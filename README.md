# 🧠 AI-First CRM – HCP Interaction Module

## 📌 Project Overview

This project is an **AI-first CRM system** designed for managing interactions with **Healthcare Professionals (HCPs)**.

The goal is to transform traditional CRM systems into an **intelligent, conversational platform** where users (medical representatives) can log interactions either through structured forms or natural language.

The system uses **LLMs + LangGraph** to convert unstructured conversation into structured CRM data automatically.

---

## 🚀 Key Features

### 🗣️ Conversational Logging
Users can log interactions like:
> “Met Dr. Rao today, discussed oncology drugs, he seemed interested.”

The system extracts:
- HCP Name  
- Date & Time  
- Discussion Topics  
- Sentiment  
- Outcomes  

---

### 🧾 Dual Input System
- Structured Form Input  
- Chat-Based Input (AI-driven)  

---

### 🤖 AI-Powered Understanding
- Converts unstructured text → structured JSON  
- Reduces manual work  
- Improves accuracy  

---

### 🔄 LangGraph Workflow Engine
LangGraph acts as the system’s **brain**, handling:
- Input understanding  
- Tool selection  
- Multi-step workflows  
- State management  

---

### ✏️ Editable AI Output
- Users can correct extracted data  
- Only modified fields are updated  
- Ensures human-in-the-loop control  

---

## 🧰 Core AI Tools (LangGraph)

The system is built around **5 key tools**:

### 📝 log_interaction
- Records a meeting with an HCP  
- Captures:
  - Date  
  - Topics discussed  
  - Sentiment  
  - Outcomes  

> Stores a complete interaction summary

---

### ✏️ edit_interaction
- Updates an existing interaction  
- Example:
  - Modify sentiment  
  - Update outcomes  

> Prevents duplicate entries

---

### 🔍 search_hcp
- Searches doctors using keywords  
- Quickly retrieves HCP data  

> Enables fast lookup instead of manual search

---

### ⏰ schedule_followup
- Creates follow-up tasks  
- Includes:
  - Task description  
  - Due date  
  - Priority  

> Helps manage future actions

---

### 🧠 analyze_sentiment
- Uses AI to detect tone of interaction  
- Outputs:
  - Positive  
  - Negative  
  - Neutral  

> Adds intelligence to CRM insights

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
