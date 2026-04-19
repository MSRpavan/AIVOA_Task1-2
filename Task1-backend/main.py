from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import interactions, hcps, materials, chat

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HCP CRM - AI-First CRM System",
    description="Healthcare Professional interaction management with LangGraph AI Agent",
    version="1.0.0",
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(interactions.router)
app.include_router(hcps.router)
app.include_router(materials.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {"message": "HCP CRM API - AI-First CRM System", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
