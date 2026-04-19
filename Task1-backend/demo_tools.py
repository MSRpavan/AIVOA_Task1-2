import os
import sys

# Add the project root to python path to import app modules
sys.path.append(os.path.abspath(r"e:\Gen-AI_Tutorial\Projects\CRM_HCP\AIVO_Task\Task1-backend"))

# Use SQLite for testing the tools without needing Postgres
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from app.database import engine, Base
from app.agent.tools.interaction_tools import (
    log_interaction,
    edit_interaction,
    search_hcp,
    schedule_followup,
    analyze_sentiment
)
import json

# Setup Database
print("Setting up test database...")
Base.metadata.create_all(bind=engine)

def pretty_print(name, result):
    print(f"\n[{name}] Result:")
    try:
        parsed = json.loads(result)
        print(json.dumps(parsed, indent=2))
    except:
        print(result)

def demonstrate_tools():
    # 1. log_interaction
    print("\n--- Demonstrating log_interaction ---")
    log_res = log_interaction.invoke({
        "hcp_name": "Dr. John Doe",
        "interaction_type": "Meeting",
        "date": "2023-10-25",
        "time": "14:00",
        "topics_discussed": "New Drug X efficacy",
        "sentiment": "Positive",
        "outcomes": "Agreed to review trial data",
        "follow_up_actions": "Send trial data PDF",
        "materials_shared": "Drug X Brochure",
        "samples_distributed": "2 samples of Drug X"
    })
    pretty_print("log_interaction", log_res)
    
    # Extract ID for the next steps
    interaction_data = json.loads(log_res)
    interaction_id = interaction_data.get("interaction_id", 1)

    # 2. edit_interaction
    print("\n--- Demonstrating edit_interaction ---")
    edit_res = edit_interaction.invoke({
        "interaction_id": interaction_id,
        "sentiment": "Very Positive",
        "outcomes": "Agreed to review trial data and start prescribing"
    })
    pretty_print("edit_interaction", edit_res)

    # 3. search_hcp
    # First let's add a dummy HCP directly to test the search
    print("\n--- Setup Dummy HCP for search_hcp ---")
    from app.database import SessionLocal
    from app.models.models import HCP
    db = SessionLocal()
    if not db.query(HCP).filter_by(name="Dr. Smith").first():
        new_hcp = HCP(name="Dr. Smith", specialty="Cardiology", institution="City Hospital", email="smith@example.com")
        db.add(new_hcp)
        db.commit()
    db.close()
    
    print("\n--- Demonstrating search_hcp ---")
    search_res = search_hcp.invoke({"query": "Smith"})
    pretty_print("search_hcp", search_res)

    # 4. schedule_followup
    print("\n--- Demonstrating schedule_followup ---")
    followup_res = schedule_followup.invoke({
        "hcp_name": "Dr. John Doe",
        "action": "Send trial data PDF",
        "due_date": "2023-10-30",
        "priority": "High"
    })
    pretty_print("schedule_followup", followup_res)

    # 5. analyze_sentiment
    print("\n--- Demonstrating analyze_sentiment ---")
    sentiment_res = analyze_sentiment.invoke({
        "text": "The meeting went really well. Dr. Doe was very interested in the new drug and asked many positive questions."
    })
    pretty_print("analyze_sentiment", sentiment_res)

if __name__ == "__main__":
    demonstrate_tools()
