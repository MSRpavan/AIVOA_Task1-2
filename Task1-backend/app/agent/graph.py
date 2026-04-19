"""
LangGraph Agent for HCP CRM.

Single flow: User describes interaction → LLM calls tools → data saved to DB
→ form_data returned to frontend → form auto-fills.
"""

import os
import json
from typing import TypedDict, Annotated, Sequence
from dotenv import load_dotenv

from langchain_core.messages import (
    BaseMessage, HumanMessage, AIMessage, ToolMessage, SystemMessage,
)
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langgraph.graph.message import add_messages

from app.agent.tools.interaction_tools import ALL_TOOLS

load_dotenv(dotenv_path=r"e:\Gen-AI_Tutorial\Projects\CRM_HCP\AIVO_Task\Groq_API_Key.env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

SYSTEM_PROMPT = """You are an AI assistant for a pharmaceutical CRM system, helping field representatives log and manage HCP interactions.

CRITICAL RULES — follow them exactly:

1. When the user describes ANY interaction (meeting, call, email, etc.) with an HCP, you MUST call the `log_interaction` tool. Do NOT just reply with text — you MUST use the tool.
2. Extract EVERY detail you can from the user's message into the tool parameters:
   - hcp_name: the doctor's full name (e.g. "Dr. Sharma")
   - interaction_type: one of Meeting, Call, Email, Conference, Lunch (default Meeting)
   - topics_discussed: summarise the key discussion points
   - sentiment: infer from tone — enthusiasm/agreement = Positive, concerns/pushback = Negative, neutral/informational = Neutral
   - outcomes: key agreements, decisions, requests made
   - follow_up_actions: next steps (e.g. "Send Phase III PDF", "Schedule follow-up in 2 weeks")
   - materials_shared: comma-separated names of brochures, PDFs, studies shared
   - samples_distributed: comma-separated names of drug samples given
3. After the tool returns, write a friendly confirmation and suggest 2-3 follow-up actions.
4. For editing existing interactions, use `edit_interaction`.
5. For HCP lookups, use `search_hcp`.
6. For scheduling reminders, use `schedule_followup`.
7. For sentiment questions, use `analyze_sentiment`.
8. NEVER skip tool calls. If the user mentions meeting a doctor, ALWAYS call log_interaction."""


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]


def create_agent():
    """Create the LangGraph agent with tool calling."""
    llm = ChatGroq(
        api_key=GROQ_API_KEY,
        model="openai/gpt-oss-120b",
    )
    llm_with_tools = llm.bind_tools(ALL_TOOLS)

    def should_continue(state: AgentState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    def call_model(state: AgentState):
        msgs = list(state["messages"])
        if not msgs or not isinstance(msgs[0], SystemMessage):
            msgs = [SystemMessage(content=SYSTEM_PROMPT)] + msgs
        return {"messages": [llm_with_tools.invoke(msgs)]}

    tool_node = ToolNode(ALL_TOOLS)

    g = StateGraph(AgentState)
    g.add_node("agent", call_model)
    g.add_node("tools", tool_node)
    g.set_entry_point("agent")
    g.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    g.add_edge("tools", "agent")
    return g.compile()


agent_graph = create_agent()


def _collect_tool_results(messages: list) -> list[dict]:
    """Pull parsed JSON from every ToolMessage."""
    results = []
    for msg in messages:
        if isinstance(msg, ToolMessage):
            try:
                results.append(json.loads(msg.content))
            except (json.JSONDecodeError, AttributeError):
                pass
    return results


async def run_agent(user_message: str, history: list | None = None, interaction_id: int | None = None, current_form_state: dict | None = None) -> dict:
    """Run the LangGraph agent. Returns reply + form_data + interaction_id."""
    print(f"DEBUG run_agent: Received interaction_id={interaction_id} for user_message='{user_message}'")
    messages: list[BaseMessage] = []
    
    if interaction_id is not None:
        context_msg = f"[SYSTEM: The user is currently viewing/editing Interaction ID #{interaction_id}. If they ask to add, edit, or modify details previously discussed, use `edit_interaction` for interaction_id={interaction_id}. Only use `log_interaction` if they explicitly want to log a BRAND NEW interaction.]"
        if current_form_state:
            context_msg += f"\nThe user's current LIVE form draft inputs are: {current_form_state}. Incorporate this existing data directly into your operations when modifying."
        messages.append(SystemMessage(content=context_msg))
    elif current_form_state:
        context_msg = f"[SYSTEM: The user has filled out a draft with these inputs: {current_form_state}. Incorporate these inputs naturally if logging a new interaction.]"
        messages.append(SystemMessage(content=context_msg))
    if history:
        for m in history:
            cls = HumanMessage if m["role"] == "user" else AIMessage
            messages.append(cls(content=m["content"]))
    messages.append(HumanMessage(content=user_message))

    result = agent_graph.invoke({"messages": messages})
    all_msgs = result["messages"]

    # Get the final AI reply (not a tool-call message)
    reply = "Done."
    for msg in reversed(all_msgs):
        if isinstance(msg, AIMessage) and not (hasattr(msg, "tool_calls") and msg.tool_calls):
            reply = msg.content
            break

    # Collect all tool results
    tool_results = _collect_tool_results(all_msgs)

    action = None
    form_data = None
    interaction_id = None
    suggested_followups: list[str] = []

    for tr in tool_results:
        act = tr.get("action")
        if act:
            action = act
            
        # Only extract form_data from the primary interaction tools, ignore schedule/search data
        if act in ("log_interaction", "edit_interaction") and tr.get("data"):
            form_data = tr["data"]
            
        if tr.get("interaction_id"):
            interaction_id = tr["interaction_id"]

    # Extract follow-up suggestions from the reply text
    if form_data and form_data.get("follow_up_actions"):
        for line in form_data["follow_up_actions"].replace(";", "\n").split("\n"):
            line = line.strip().lstrip("•-+0123456789.) ")
            if line:
                suggested_followups.append(line)

    return {
        "reply": reply,
        "action_taken": action,
        "form_data": form_data,
        "interaction_id": interaction_id,
        "suggested_followups": suggested_followups,
    }
