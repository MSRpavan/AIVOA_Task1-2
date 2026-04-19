from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class InteractionType(str, enum.Enum):
    MEETING = "Meeting"
    CALL = "Call"
    EMAIL = "Email"
    CONFERENCE = "Conference"
    LUNCH = "Lunch"


class Sentiment(str, enum.Enum):
    POSITIVE = "Positive"
    NEUTRAL = "Neutral"
    NEGATIVE = "Negative"


interaction_attendees = Table(
    "interaction_attendees",
    Base.metadata,
    Column("interaction_id", Integer, ForeignKey("interactions.id"), primary_key=True),
    Column("hcp_id", Integer, ForeignKey("hcps.id"), primary_key=True),
)

interaction_materials = Table(
    "interaction_materials",
    Base.metadata,
    Column("interaction_id", Integer, ForeignKey("interactions.id"), primary_key=True),
    Column("material_id", Integer, ForeignKey("materials.id"), primary_key=True),
)

interaction_samples = Table(
    "interaction_samples",
    Base.metadata,
    Column("interaction_id", Integer, ForeignKey("interactions.id"), primary_key=True),
    Column("sample_id", Integer, ForeignKey("samples.id"), primary_key=True),
)


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    specialty = Column(String(255))
    institution = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(100))
    description = Column(Text)


class Sample(Base):
    __tablename__ = "samples"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    product = Column(String(255))
    quantity = Column(Integer, default=0)


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_name = Column(String(255), nullable=False)
    interaction_type = Column(String(50), default="Meeting")
    date = Column(DateTime, default=datetime.utcnow)
    topics_discussed = Column(Text)
    sentiment = Column(String(20), default="Neutral")
    outcomes = Column(Text)
    follow_up_actions = Column(Text)
    ai_suggested_followups = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    attendees = relationship("HCP", secondary=interaction_attendees)
    materials = relationship("Material", secondary=interaction_materials)
    samples = relationship("Sample", secondary=interaction_samples)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    interaction_id = Column(Integer, ForeignKey("interactions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
