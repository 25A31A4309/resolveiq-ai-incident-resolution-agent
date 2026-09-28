# RESOLVEIQ — AI Incident Resolution Agent
> **Tagline:** Remember. Reflect. Resolve Better.

ResolveIQ is an autonomous AI Incident Resolution Agent for DevOps, SRE, and IT operations teams powered by **Hindsight** organizational memory.

Unlike conventional chatbot assistants that reset their context between sessions, ResolveIQ builds a persistent, evolving organizational memory across past production outages. It retains resolution playbooks, identifies root causes, records failed anti-patterns, and reflects upon completed incidents to formulate actionable organizational lessons.

---

## 1. The Core Learning Loop

```
                     ┌───────────────────────────┐
                     │     Production Outage     │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │   Hindsight Recall Query  │
                     └─────────────┬─────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
        [Scenario A: Memory Exists]    [Scenario B: New Outage]
        • Recalls historical cases     • 0 previous memories found
        • Shows past fixes & causes    • Formulates diagnostic path
        • Warns of failed approaches   • Hypotheses labeled clearly
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                     ┌───────────────────────────┐
                     │     AI Recommendations    │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │      Engineer Action      │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │   Outcome & Root Cause    │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │    Hindsight Reflection   │
                     │  (Synthesizes New Lesson) │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │      Hindsight Retain     │
                     │   (Stored in Knowledge)   │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                   Better & Faster Future Resolution!
```

---

## 2. Architecture

```
Engineer / SRE Responder
         │
         ▼
ResolveIQ Web UI (React + TypeScript + Tailwind CSS)
         │  HTTP /api/incidents, /api/memory
         ▼
FastAPI Backend / Full-Stack Server
         │
   ┌─────┴─────────────────────────┐
   │                               │
   ▼                               ▼
Incident Agent            Hindsight Service
(Orchestration & Reasoning) (Retain • Recall • Reflect)
   │                               │
   ▼                               ▼
LLM Provider               Persistent Memory Store
(Gemini 3.8 / Ollama)      (Vector + Lexical Indexes)
```

---

## 3. How Hindsight Is Used

ResolveIQ integrates directly with the three core operations of the Hindsight agent memory framework:

1. **Retain (`hindsight.retain`)**:
   - Ingests structured incident experiences upon resolution:
     - `incident_id`, `service`, `title`, `severity`, `environment`
     - `root_cause`, `final_resolution`, `outcome`
     - `actions_taken`, `failed_approaches` (anti-patterns)
     - `engineer_feedback`, `tags`
   - Normalizes facts and creates searchable representations.

2. **Recall (`hindsight.recall`)**:
   - Queries long-term organizational memory using error telemetry, service signatures, and failure symptoms.
   - Strictly reports real findings:
     - If matches exist: returns memories ranked by relevance tier (`High relevance` or `Relevant memory`).
     - If no match exists: returns empty memory and triggers "No relevant historical memory found" without inventing fake cases.

3. **Reflect (`hindsight.reflect`)**:
   - Analyzes the full incident lifecycle to synthesize permanent organizational lessons and runbook guidelines.
   - Example synthesized lesson:
     > *"For recurring payment-api incidents exhibiting symptoms of 'Payment API returning 502', first inspect for database connection pool exhaustion. Verified successful remediation is to reset database connection pool."*

---

## 4. Quick Start & Running the Project

### Prerequisites
- Node.js (v18+) & npm
- Python 3.10+ (if running Python backend standalone)

### 1. Installation
```bash
# Install frontend and full-stack dependencies
npm install

# (Optional) Install Python backend dependencies
cd backend && pip install -r requirements.txt
```

### 2. Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env
```

Key environment variables:
- `GEMINI_API_KEY`: API key for Gemini model reasoning (automatically injected in AI Studio).
- `PORT`: Web server port (default: `3000`).
- `LLM_PROVIDER`: `gemini` (default) or `ollama`.
- `OLLAMA_BASE_URL`: Local Ollama instance URL (e.g. `http://localhost:11434`).
- `HINDSIGHT_API_URL`: Optional external Hindsight server URL (leave empty for embedded engine).

### 3. Run the Full-Stack Application
```bash
npm run dev
```
The server will boot on `http://localhost:3000`.

---

## 5. Local Hindsight & Local Ollama Setup

ResolveIQ can operate completely offline with local LLMs and local Hindsight:

### Running Local Ollama
```bash
# Pull model
ollama run llama3

# Set environment variables in .env:
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### Running Standalone Python FastAPI Backend
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 6. How to Perform the Hackathon Live Demo

This live demonstration highlights the core value of ResolveIQ in two simple steps:

### Preparation: Clean Slate
1. Click **"Reset"** in the top navigation bar (or via the **Demo Guide** modal).
2. The memory count will display **0 Incidents Remembered**.

### Step 1: Brand New Incident (Scenario B: No Memory)
1. Navigate to **New Incident** and click preset **"Payment 502 (Demo 1)"**.
2. Click **"Analyze Incident"**.
3. **Observation:**
   - Hindsight reports: *"No relevant historical memory found. This appears to be a new incident for your organization."*
   - AI generates generic diagnostic investigation steps (checking pool health, deployment logs).
4. Scroll to **"Record Incident Outcome"** and click **"Auto-fill DB Pool Resolution"**.
5. Click **"Save Outcome & Retain Memory"**.
6. **Observation:**
   - Hindsight executes **Reflect**, synthesizing a new organizational lesson.
   - The completed experience is **retained** in long-term memory.
   - Memory count increases to **1 Incident Remembered**.

### Step 2: Recurring Outage (Scenario A: Memory Recalled!)
1. Click **"Test Recall on Next Incident"** (or click preset **"Payment 502 (Demo 2: Recall)"** on New Incident).
2. Click **"Analyze Incident"**.
3. **Observation:**
   - Hindsight immediately displays: *"Similar historical incidents found (High relevance)"*.
   - Shows the exact incident resolved in Step 1 (`INC-...`), confirmed root cause (`Database connection pool exhaustion`), and resolution (`Reset database connection pool`).
   - The AI's #1 recommended action is now: **"Execute verified resolution: Reset database connection pool"** with justification referencing the past incident!
   - Shows previously failed approaches to avoid.
4. **Conclusion:** Resolution time drops from 45 minutes to under 3 minutes. The organization has permanently learned!

---

## 7. Seeding Synthetic Demo Incidents

To populate realistic synthetic incident experiences for exploration:
```bash
# Via Web UI: Click "Seed Experiences" in top navigation bar
# Or via CLI:
python3 backend/seed_demo.py
```
This populates realistic multi-service outages (API Gateway 504 timeouts, Auth token key rotation loops, etc.) into Hindsight memory.

---

## 8. Automated Tests
```bash
# Run backend test suite verifying the 2-stage learning loop
python3 -m pytest backend/tests/test_incident_flow.py -v
```

---

## License
Apache-2.0
