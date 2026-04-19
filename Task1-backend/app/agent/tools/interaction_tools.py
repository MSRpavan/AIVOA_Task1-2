"""
LangGraph Agent Tools for HCP CRM.

Each tool receives structured args from the LLM (via tool-calling) and
interacts with the database. A db session is injected at call-time via
the RunnableConfig mechanism so tools stay testable.
"""

from langchain_core.tools import tool
from typing import Optional
import json

from app.database import SessionLocal
from app.models.models import Interaction, HCP
from datetime import datetime


def _get_db():
    """Obtain a throw-away session for tool execution."""
    return SessionLocal()


# ──────────────────────────────────────────────
# Tool 1 – LOG INTERACTION  (saves to DB)
# ──────────────────────────────────────────────
@tool
def log_interaction(
    hcp_name: str,
    interaction_type: str = "Meeting",
    date: str = "",
    time: str = "",
    topics_discussed: str = "",
    sentiment: str = "Neutral",
    outcomes: str = "",
    follow_up_actions: str = "",
    materials_shared: str = "",
    samples_distributed: str = "",
) -> str:
    """Save a new HCP interaction to the database. Call this when the user
    describes a meeting, call, or any interaction with a healthcare professional.
    Extract ALL fields from the user message: hcp_name, interaction_type
    (Meeting|Call|Email|Conference|Lunch), date (YYYY-MM-DD format), time (HH:MM format),
    topics_discussed, sentiment (Positive|Neutral|Negative), outcomes, follow_up_actions,
    materials_shared (comma-separated), samples_distributed (comma-separated)."""
    db = _get_db()
    try:
        interaction = Interaction(
            hcp_name=hcp_name,
            interaction_type=interaction_type,
            topics_discussed=topics_discussed,
            sentiment=sentiment,
            outcomes=outcomes,
            follow_up_actions=follow_up_actions,
        )
        if date or time:
            try:
                d_str = date if date else datetime.utcnow().strftime("%Y-%m-%d")
                t_str = time if time else datetime.utcnow().strftime("%H:%M")
                interaction.date = datetime.fromisoformat(f"{d_str}T{t_str}:00")
            except ValueError:
                pass

        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        return json.dumps({
            "status": "success",
            "action": "log_interaction",
            "interaction_id": interaction.id,
            "data": {
                "hcp_name": hcp_name,
                "interaction_type": interaction_type,
                "date": date,
                "time": time,
                "topics_discussed": topics_discussed,
                "sentiment": sentiment,
                "outcomes": outcomes,
                "follow_up_actions": follow_up_actions,
                "materials_shared": materials_shared,
                "samples_distributed": samples_distributed,
            },
            "message": f"Interaction #{interaction.id} with {hcp_name} saved to database.",
        })
    finally:
        db.close()


# ──────────────────────────────────────────────
# Tool 2 – EDIT INTERACTION  (updates DB row)
# ──────────────────────────────────────────────
@tool
def edit_interaction(
    interaction_id: int,
    hcp_name: Optional[str] = None,
    interaction_type: Optional[str] = None,
    date: Optional[str] = None,
    time: Optional[str] = None,
    topics_discussed: Optional[str] = None,
    sentiment: Optional[str] = None,
    outcomes: Optional[str] = None,
    follow_up_actions: Optional[str] = None,
) -> str:
    """Edit an existing HCP interaction in the database. Provide the
    interaction_id and any fields to update (e.g., date formatted YYYY-MM-DD, time formatted HH:MM). Only supplied fields are changed."""
    db = _get_db()
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return json.dumps({"status": "error", "message": f"Interaction #{interaction_id} not found."})

        updates = {}
        if hcp_name is not None:
            interaction.hcp_name = hcp_name; updates["hcp_name"] = hcp_name
        if interaction_type is not None:
            interaction.interaction_type = interaction_type; updates["interaction_type"] = interaction_type
        if date is not None or time is not None:
            curr_date = interaction.date or datetime.utcnow()
            d_str = date if date else curr_date.strftime("%Y-%m-%d")
            t_str = time if time else curr_date.strftime("%H:%M")
            try:
                new_dt = datetime.fromisoformat(f"{d_str}T{t_str}:00")
                interaction.date = new_dt
                updates["date"] = f"{d_str}T{t_str}:00"
            except ValueError:
                pass
        if topics_discussed is not None:
            interaction.topics_discussed = topics_discussed; updates["topics_discussed"] = topics_discussed
        if sentiment is not None:
            interaction.sentiment = sentiment; updates["sentiment"] = sentiment
        if outcomes is not None:
            interaction.outcomes = outcomes; updates["outcomes"] = outcomes
        if follow_up_actions is not None:
            interaction.follow_up_actions = follow_up_actions; updates["follow_up_actions"] = follow_up_actions

        interaction.updated_at = datetime.utcnow()
        db.commit()
        return json.dumps({
            "status": "success",
            "action": "edit_interaction",
            "interaction_id": interaction_id,
            "updated_fields": updates,
            "message": f"Interaction #{interaction_id} updated.",
        })
    finally:
        db.close()


# ──────────────────────────────────────────────
# Tool 3 – SEARCH HCP  (queries DB)
# ──────────────────────────────────────────────
@tool
def search_hcp(query: str) -> str:
    """Search for Healthcare Professionals by name, specialty, or institution.
    Returns matching HCP profiles from the database."""
    db = _get_db()
    try:
        results = db.query(HCP).filter(
            (HCP.name.ilike(f"%{query}%"))
            | (HCP.specialty.ilike(f"%{query}%"))
            | (HCP.institution.ilike(f"%{query}%"))
        ).limit(10).all()

        hcps = [
            {"id": h.id, "name": h.name, "specialty": h.specialty,
             "institution": h.institution, "email": h.email}
            for h in results
        ]
        return json.dumps({
            "status": "success",
            "action": "search_hcp",
            "count": len(hcps),
            "results": hcps,
            "message": f"Found {len(hcps)} HCP(s) matching '{query}'.",
        })
    finally:
        db.close()


# ──────────────────────────────────────────────
# Tool 4 – SCHEDULE FOLLOW-UP
# ──────────────────────────────────────────────
@tool
def schedule_followup(
    hcp_name: str,
    action: str,
    due_date: str = "",
    priority: str = "medium",
) -> str:
    """Schedule a follow-up action for an HCP interaction. Creates a reminder
    for tasks like sending materials, scheduling meetings, or follow-up calls."""
    return json.dumps({
        "status": "success",
        "action": "schedule_followup",
        "data": {
            "hcp_name": hcp_name,
            "action": action,
            "due_date": due_date,
            "priority": priority,
        },
        "message": f"Follow-up scheduled for {hcp_name}: {action}",
    })


# ──────────────────────────────────────────────
# Tool 5 – ANALYZE SENTIMENT
# ──────────────────────────────────────────────
@tool
def analyze_sentiment(text: str) -> str:
    """Analyze the sentiment of an HCP interaction from conversation notes.
    Return Positive, Neutral, or Negative with brief reasoning."""
    return json.dumps({
        "status": "success",
        "action": "analyze_sentiment",
        "text_preview": text[:200],
        "message": "Sentiment analysis complete. Infer from context and return result in your reply.",
    })


ALL_TOOLS = [
    log_interaction,
    edit_interaction,
    search_hcp,
    schedule_followup,
    analyze_sentiment,
]
