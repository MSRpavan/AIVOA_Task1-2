from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.database import get_db
from app.models.models import Interaction, HCP, Material, Sample, ChatMessage
from app.schemas import InteractionCreate, InteractionUpdate, InteractionResponse

router = APIRouter(prefix="/api/interactions", tags=["interactions"])


@router.post("/", response_model=InteractionResponse)
def create_interaction(data: InteractionCreate, db: Session = Depends(get_db)):
    date_val = datetime.utcnow()
    if data.date:
        try:
            date_val = datetime.fromisoformat(data.date)
        except ValueError:
            try:
                date_val = datetime.strptime(data.date, "%d-%m-%Y")
            except ValueError:
                date_val = datetime.utcnow()

    interaction = Interaction(
        hcp_name=data.hcp_name,
        interaction_type=data.interaction_type,
        date=date_val,
        topics_discussed=data.topics_discussed,
        sentiment=data.sentiment,
        outcomes=data.outcomes,
        follow_up_actions=data.follow_up_actions,
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


@router.get("/", response_model=List[InteractionResponse])
def list_interactions(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Interaction).order_by(Interaction.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{interaction_id}", response_model=InteractionResponse)
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


@router.put("/{interaction_id}", response_model=InteractionResponse)
def update_interaction(interaction_id: int, data: InteractionUpdate, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            if field == "date":
                try:
                    value = datetime.fromisoformat(value)
                except ValueError:
                    value = datetime.strptime(value, "%d-%m-%Y")
            setattr(interaction, field, value)

    interaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(interaction)
    return interaction


@router.delete("/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
        
    # Nullify any referencing chat messages to avoid foreign key violation
    chat_messages = db.query(ChatMessage).filter(ChatMessage.interaction_id == interaction_id).all()
    for msg in chat_messages:
        msg.interaction_id = None
        
    # Clear many-to-many associations to prevent foreign key cascade errors
    interaction.attendees.clear()
    interaction.materials.clear()
    interaction.samples.clear()
    db.flush()
    
    db.delete(interaction)
    db.commit()
    return {"message": "Interaction deleted successfully"}
