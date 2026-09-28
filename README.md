# ResolveIQ — AI Incident Resolution Agent

> **Remember. Reflect. Resolve Better.**

ResolveIQ is an AI-powered incident resolution agent that helps engineers investigate production problems using organizational memory.

Instead of treating every incident as a completely new problem, ResolveIQ can retain completed incident experiences, recall relevant historical incidents during a new investigation, and turn verified outcomes into reusable lessons.

## The Core Idea

> **The first incident creates the knowledge.  
> The second incident benefits from it.**

The system follows this learning loop:

```text
Incident
   ↓
Investigate
   ↓
Recall Historical Experience
   ↓
AI Reasoning & Recommendations
   ↓
Engineer Action
   ↓
Verified Outcome
   ↓
Reflect
   ↓
Retain Experience
   ↓
Better Future Investigations
```

---

## Why ResolveIQ?

During production incidents, engineers often need to answer questions such as:

- Have we seen this problem before?
- What caused it last time?
- What did we try?
- Which approach actually worked?
- Which approaches failed?
- Can the previous experience help with the current investigation?

Traditional incident systems mainly record what happened.

ResolveIQ focuses on making the **experience from previous incidents reusable**.

---

## How It Works

### 1. Declare an Incident

An engineer provides structured incident information:

- Incident title
- Service
- Environment
- Severity
- Error message / HTTP code
- Description
- Logs and technical details
- Recent changes

Example:

```text
Service: payment-api
Environment: Production
Severity: High
Error: 502 Bad Gateway
Problem: Customers cannot complete payments
```

Creating an incident does **not** immediately create organizational memory.

The experience is retained after the investigation has an actual outcome.

---

### 2. Investigate With Memory

When a new problem is investigated, ResolveIQ checks organizational memory first.

If no relevant experience exists:

```text
No relevant historical memory found
```

The agent then reasons from the current incident context.

If a similar historical experience exists:

```text
Historical Experience Found
```

ResolveIQ can show:

- Previous incident
- Previous root cause
- Previous resolution
- Previous outcome
- Relevance to the current problem

The historical experience is used as **evidence, not proof**.

The engineer still validates the current incident.

---

### 3. Record the Outcome

After investigation, the engineer records what actually happened:

```text
Action Taken
Result
Root Cause
Final Resolution
Engineer Feedback
```

For example:

```text
Root Cause:
Database connection pool exhaustion

Resolution:
Reset the database connection pool
and scale the pool ceiling

Outcome:
Successfully resolved
```

---

### 4. Retain the Experience

The completed incident becomes a reusable organizational memory.

ResolveIQ retains information such as:

```text
Incident
Service
Error
Root Cause
Actions
Failed Approaches
Resolution
Outcome
Engineer Feedback
Tags
```

This creates a persistent experience that can be recalled during future investigations.

---

### 5. Reflect Into Lessons

ResolveIQ can also synthesize a reusable lesson from the completed incident.

Example:

```text
For recurring payment-api incidents exhibiting symptoms
of Payment API returning 502, first inspect for database
connection pool exhaustion.

Verified remediation:
Reset the database connection pool and scale the pool ceiling.
```

The goal is to prevent engineers from repeatedly rediscovering the same operational knowledge.

---

## Example: Payment API 502

### First Incident

A production Payment API starts returning:

```text
502 Bad Gateway
```

There is no previous relevant memory.

ResolveIQ investigates the current context and provides possible causes and investigation steps.

The engineer discovers:

```text
Root Cause:
Database connection pool exhaustion
```

The pool is reset and the pool ceiling is increased.

The incident succeeds.

The experience is then retained.

---

### Similar Incident Later

A similar Payment API problem occurs again.

This time ResolveIQ recalls the previous experience:

```text
Historical Experience Found

Previous Root Cause:
Database connection pool exhaustion

Previous Resolution:
Reset database connection pool
and scale the pool ceiling

Previous Outcome:
Successfully resolved
```

The previous experience becomes part of the investigation context.

```text
First incident
     ↓
Resolve
     ↓
Retain
     ↓
Historical Memory
     ↓
Second incident
     ↓
Recall
     ↓
Investigate with previous experience
```

---

## Hindsight Memory

ResolveIQ is designed around persistent agent memory concepts from **Hindsight**.

The memory service supports three important operations:

### Retain

Stores completed incident experiences.

```python
await hindsight_service.retain(memory_data)
```

### Recall

Searches previously retained experiences relevant to the current incident.

```python
memories = await hindsight_service.recall(
    query=incident_query,
    service=service
)
```

### Reflect

Converts an incident outcome into a reusable organizational lesson.

```python
lesson = await hindsight_service.reflect(
    incident_data,
    feedback
)
```

The project can connect to a remote Hindsight service through:

```text
HINDSIGHT_API_URL
HINDSIGHT_AGENT_ID
```

When a remote Hindsight URL is not configured, ResolveIQ uses its local persistent memory engine for development and demonstration.

---

## Architecture

```text
┌──────────────────────────────────────┐
│          ResolveIQ Web UI            │
│      React + TypeScript + Vite       │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│       Full-Stack Application         │
│        Node.js / Express / TS        │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│        Incident Agent Logic          │
│      Investigation + Reasoning       │
└───────────────┬───────────────┬──────┘
                │               │
                ▼               ▼
       ┌──────────────┐  ┌───────────────┐
       │ LLM Service  │  │ Hindsight     │
       │ Gemini /     │  │ Memory        │
       │ Ollama       │  │ Service       │
       └──────────────┘  └───────┬───────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
                 Retain       Recall       Reflect
                    │            │            │
                    └────────────┼────────────┘
                                 ▼
                       Organizational Memory
```

---

## Main Features

### 🧾 Incident Management

Create and track production incidents with structured technical context.

### 🧠 Historical Memory Recall

Retrieve relevant previous incident experiences during a new investigation.

### 🤖 AI Investigation

Use current incident context together with historical experience to generate investigation guidance.

### 🔄 Outcome Tracking

Record actions, results, root causes, final resolutions, and engineer feedback.

### 💾 Persistent Organizational Memory

Retain useful incident experiences for future investigations.

### 📚 Lessons

Convert completed experiences into reusable organizational lessons.

### 📊 Analytics

Track incident and memory-related operational metrics.

### 👨‍💻 Human-in-the-Loop

ResolveIQ provides investigation guidance. Engineers remain responsible for validating the actual root cause and resolution.

---

## Before vs After Memory

| Without Organizational Memory | With ResolveIQ |
|---|---|
| Start troubleshooting from current context | Start with current context + relevant history |
| Search old incidents manually | Recall relevant historical experiences |
| Previous failed approaches may be forgotten | Failed approaches can be retained |
| Knowledge can remain with individuals | Experiences become reusable organizational knowledge |
| Similar incidents may repeat the same investigation | Previous outcomes can inform future investigation |

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Motion

### Application Server

- Node.js
- Express
- TypeScript
- `tsx`

### AI

- Google Gemini
- Optional local Ollama support

### Backend / Services

- Python
- FastAPI
- Hindsight memory service

### Memory

- Hindsight-compatible retain / recall / reflection workflow
- Local persistent fallback for development and demo execution

---

## Project Structure

```text
resolveiq-ai-incident-resolution-agent/
│
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── services/
│   │       ├── hindsight_service.py
│   │       ├── incident_agent.py
│   │       └── llm_service.py
│   │
│   ├── requirements.txt
│   ├── seed_demo.py
│   └── tests/
│       └── test_incident_flow.py
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── App.tsx
│   ├── main.tsx
│   └── types.ts
│
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Getting Started

### Prerequisites

Install:

- Node.js
- npm
- Python 3.10+ if using the Python backend separately

### 1. Clone the Repository

```bash
git clone https://github.com/25A31A4309/resolveiq-ai-incident-resolution-agent.git
cd resolveiq-ai-incident-resolution-agent
```

### 2. Install Dependencies

```bash
npm install
```

For the Python backend:

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 3. Configure Environment Variables

Create `.env` from the provided template.

Important configuration values include:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

PORT=3000

LLM_PROVIDER="gemini"

OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3"

HINDSIGHT_API_URL=""
HINDSIGHT_AGENT_ID="resolveiq-sre-agent"
```

Never commit real API keys or secrets.

---

## Run ResolveIQ

Start the application:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## Optional Local Ollama

To use Ollama instead of Gemini:

```env
LLM_PROVIDER="ollama"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3"
```

Then make sure Ollama is running locally.

---

## Optional Python Backend

The FastAPI backend can be started separately with:

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Demo Flow

A simple demonstration of the learning behavior:

```text
1. Start with no retained incident
             ↓
2. Create Payment API 502 incident
             ↓
3. Investigate
             ↓
4. Identify database connection pool exhaustion
             ↓
5. Record successful resolution
             ↓
6. Retain the experience
             ↓
7. Create a similar incident
             ↓
8. Recall historical experience
             ↓
9. Use memory as investigation context
             ↓
10. Validate the current incident
```

### The key moment

The first investigation has no useful historical memory.

The later investigation can show:

```text
Hindsight Memory Found
```

and expose the previous:

- Root cause
- Resolution
- Outcome
- Relevant incident experience

---

## Important Design Principle

ResolveIQ does **not** assume that a previous incident has the same root cause as the current incident.

Historical memory is treated as:

> **Evidence, not proof.**

The engineer must validate the current system before applying a previous resolution.

This is especially important for production systems where similar symptoms can have different underlying causes.

---

## Security & Operational Notes

- Do not commit API keys or secrets.
- Use synthetic incident data unless you have authorization to use real production information.
- Do not automatically execute destructive production actions.
- Treat AI recommendations as investigation guidance.
- Require engineer validation before applying operational changes.

---

## Hindsight Resources

ResolveIQ uses Hindsight concepts for persistent agent memory.

- [Hindsight GitHub](https://github.com/vectorize-io/hindsight)
- [Hindsight Documentation](https://hindsight.vectorize.io/)
- [What is Agent Memory?](https://vectorize.io/what-is-agent-memory)

---

## Project

**ResolveIQ — AI Incident Resolution Agent**

> Remember. Reflect. Resolve Better.

Repository:

https://github.com/25A31A4309/resolveiq-ai-incident-resolution-agent

Article:

https://medium.com/@gollapallipavani21/how-i-built-an-incident-agent-that-remembers-what-worked-with-hindsight-d32fa08c7995

---
