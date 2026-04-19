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

## 🏗️ System Architecture
