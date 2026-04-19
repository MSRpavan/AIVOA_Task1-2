
---

## 🧩 Tech Stack

### Frontend
- React.js  
- Redux  
- Google Inter Font  

### Backend
- FastAPI (Python)  
- REST APIs  

### AI Layer
- LangGraph (Agent orchestration)  
- LLM: `openai/gpt-oss-120b`  

### Database
- PostgreSQL  

---

## ⚙️ System Workflow

1. **User Input**
   - Chat input OR Form input  

2. **LangGraph Processing**
   - Detects user intent  
   - Routes to appropriate tool  

3. **Tool Execution**
   - log_interaction  
   - edit_interaction  
   - search_hcp  
   - schedule_followup  
   - analyze_sentiment  

4. **LLM Processing**
   - Extracts structured data  
   - Performs reasoning & classification  

5. **User Review**
   - Editable UI  
   - User confirms or updates  

6. **Database Storage**
   - Final data saved in PostgreSQL  

---

## 🧠 Example Flow

### Input
> “Met Dr. Sharma yesterday, discussed diabetes drugs, he was positive. Schedule a follow-up next week.”

### Output
```json
{
  "hcp_name": "Dr. Sharma",
  "discussion": "Diabetes drugs",
  "sentiment": "Positive",
  "followup": {
    "date": "Next Week",
    "priority": "Medium"
  }
}