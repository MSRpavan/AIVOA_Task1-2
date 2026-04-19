from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


# ─── HCP ───
class HCPBase(BaseModel):
    name: str
    specialty: Optional[str] = None
    institution: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class HCPResponse(HCPBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Materials / Samples ───
class MaterialBase(BaseModel):
    name: str
    type: Optional[str] = None
    description: Optional[str] = None


class MaterialResponse(MaterialBase):
    id: int

    class Config:
        from_attributes = True


class SampleBase(BaseModel):
    name: str
    product: Optional[str] = None
    quantity: Optional[int] = 0


class SampleResponse(SampleBase):
    id: int

    class Config:
        from_attributes = True


# ─── Interaction CRUD ───
class InteractionCreate(BaseModel):
    hcp_name: str
    interaction_type: str = "Meeting"
    date: Optional[str] = None
    topics_discussed: Optional[str] = None
    sentiment: str = "Neutral"
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None
    attendees: Optional[List[str]] = []
    materials: Optional[List[str]] = []
    samples: Optional[List[str]] = []


class InteractionUpdate(BaseModel):
    hcp_name: Optional[str] = None
    interaction_type: Optional[str] = None
    date: Optional[str] = None
    topics_discussed: Optional[str] = None
    sentiment: Optional[str] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None


class InteractionResponse(BaseModel):
    id: int
    hcp_name: str
    interaction_type: str
    date: datetime
    topics_discussed: Optional[str] = None
    sentiment: str
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None
    ai_suggested_followups: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Structured Output: what LLM extracts from natural language ───
class ExtractedInteraction(BaseModel):
    """Structured data extracted by the LLM from a user's natural-language description."""
    hcp_name: str = Field(description="Full name of the Healthcare Professional (e.g. Dr. Sharma)")
    interaction_type: Literal["Meeting", "Call", "Email", "Conference", "Lunch"] = Field(
        default="Meeting", description="Type of interaction"
    )
    topics_discussed: str = Field(default="", description="Key discussion topics, summarised")
    sentiment: Literal["Positive", "Neutral", "Negative"] = Field(
        default="Neutral", description="Inferred HCP sentiment"
    )
    outcomes: str = Field(default="", description="Key outcomes or agreements reached")
    follow_up_actions: str = Field(default="", description="Suggested next steps or follow-ups")
    materials_shared: List[str] = Field(default_factory=list, description="Names of brochures/studies shared")
    samples_distributed: List[str] = Field(default_factory=list, description="Names of drug samples given")


# ─── Chat request / response ───
class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []
    interaction_id: Optional[int] = None
    current_form_state: Optional[dict] = None


class ChatResponse(BaseModel):
    reply: str
    form_data: Optional[dict] = None
    saved_interaction: Optional[InteractionResponse] = None
    action_taken: Optional[str] = None
    suggested_followups: Optional[List[str]] = None
