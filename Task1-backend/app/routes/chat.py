from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Interaction, ChatMessage
from app.schemas import ChatRequest, ChatResponse, InteractionResponse
from app.agent.graph import run_agent

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest, db: Session = Depends(get_db)):
    """Chat with the LangGraph AI agent.
    The agent calls tools that save to DB, then returns form_data
    so the frontend can auto-fill the form."""
    try:
        history = request.conversation_history or []
        result = await run_agent(request.message, history, request.interaction_id, request.current_form_state)

        # Persist chat messages
        db.add(ChatMessage(role="user", content=request.message))
        db.add(ChatMessage(
            role="assistant",
            content=result["reply"],
            interaction_id=result.get("interaction_id"),
        ))
        db.commit()

        # If a log_interaction tool saved a row, fetch it for the response
        saved = None
        if result.get("interaction_id"):
            row = db.query(Interaction).filter(
                Interaction.id == result["interaction_id"]
            ).first()
            if row:
                saved = InteractionResponse.model_validate(row)

        return ChatResponse(
            reply=result["reply"],
            form_data=result.get("form_data"),
            saved_interaction=saved,
            action_taken=result.get("action_taken"),
            suggested_followups=result.get("suggested_followups"),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
