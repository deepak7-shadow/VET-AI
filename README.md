# VET-AI: Multi-Agent Livestock Health Intelligence & Early Disease-Risk Detection Platform

VET-AI is a production-quality hackathon MVP designed for modern livestock farms and veterinary health teams. It leverages **Multi-Agent AI**, **Computer Vision**, **Retrieval-Augmented Generation (RAG)**, **Behavioral Telemetry**, and **Explainable Risk Scoring** to detect acute illness patterns (e.g., Bovine Respiratory Disease, Clinical Mastitis, Ruminal Acidosis) hours or days before visible clinical emergencies arise.

---

## 🌟 Key Features

1. **Multi-Agent Veterinary Intelligence**:
   - **Orchestrator Agent**: Dispatches specialized sub-agents, aggregates assessments, and constructs the clinical decision payload.
   - **Sensor Agent**: Analyzes physiological telemetry (body temperature, feed intake, daily activity) against herd baselines.
   - **Behavior Agent**: Identifies deviations in rumination, appetite refusal, and social isolation.
   - **Vision Agent**: Evaluates visual indicators (ear droop, depressed posture, ocular/nasal discharge) with bounding-box annotations.
   - **Risk Agent**: Computes weighted, explainable health-risk scores (0–100) and risk severity tiers (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
   - **Knowledge Agent (RAG)**: Retrieves authoritative veterinary clinical consensus documents matching observed symptom clusters.
   - **Report Agent**: Generates actionable clinical decision support summaries with mandatory veterinary clinical disclaimers.
   - **Alert System**: Automatically generates escalated alerts for high-risk animals in the database.

2. **Live Supabase PostgreSQL Database**:
   - Primary database using Supabase PostgreSQL (`mlmilvhgicvxjarfgpyj`).
   - Relational schema tracking animals, health observations, image analyses, risk assessments, alerts, agent execution logs, and knowledge documents.
   - IPv4 connection support via Supabase transaction pooler (`aws-0-ap-northeast-2.pooler.supabase.com:6543`).

3. **Modern Interactive Web Interface**:
   - Built with **React 19 + TypeScript + Vite + Tailwind CSS 4**.
   - Dark glassmorphism dashboard with real-time KPI cards and Recharts trend visualization.
   - Filterable livestock directory and individual animal health profiles.
   - Full Multi-Agent interactive console with image upload and telemetry simulation sliders.
   - One-click **"Simulate Health Event (COW-027)"** and **"Reset Demo"** controls.

---

## 🏗️ System Architecture

```
                                  +-----------------------+
                                  |   React + Vite App    |
                                  | (Port 5173 / Proxy)   |
                                  +-----------+-----------+
                                              |
                                     HTTP API (/api/*)
                                              |
                                  +-----------v-----------+
                                  |    FastAPI Backend    |
                                  |      (Port 8000)      |
                                  +-----------+-----------+
                                              |
                     +------------------------v------------------------+
                     |                Orchestrator Agent               |
                     +---+----------------+---------------+--------+---+
                         |                |               |        |
         +---------------v----+  +--------v-------+  +----v--------v----+
         |    Sensor Agent    |  | Behavior Agent |  |   Vision Agent   |
         |  (Thermal/Vitals)  |  |   (Activity)   |  |   (Image CV)     |
         +---------------+----+  +--------+-------+  +----+-------------+
                         |                |               |
                         +----------------v---------------+
                                          |
                                 +--------v-------+
                                 |   Risk Agent   |
                                 | (Score 0-100)  |
                                 +--------+-------+
                                          |
                         +----------------v---------------+
                         |                                |
                +--------v-------+               +--------v-------+
                | Knowledge Agent|               |  Report Agent  |
                |   (RAG Docs)   |               |   (GenAI CDS)  |
                +--------+-------+               +--------+-------+
                         |                                |
                         +----------------+---------------+
                                          |
                                 +--------v-------+
                                 |  Alert System  |
                                 +--------+-------+
                                          |
                               +----------v----------+
                               | Supabase PostgreSQL |
                               | (Pooler Port 6543)  |
                               +---------------------+
```

---

## 📂 Repository Structure

```
vet-ai/
├── backend/
│   ├── app/
│   │   ├── agents/          # Multi-agent implementations (Orchestrator, Vision, Sensor, etc.)
│   │   ├── api/             # FastAPI REST endpoints (animals, analysis, alerts, reports, demo)
│   │   ├── database/        # Supabase PostgreSQL client and queries
│   │   ├── models/          # Pydantic schemas
│   │   ├── services/        # AI, RAG, Risk, Vision, and Alert services
│   │   ├── config.py        # Environment configuration
│   │   └── main.py          # FastAPI application entrypoint
│   ├── .env.example         # Backend environment template
│   ├── requirements.txt     # Python dependencies
│   └── run_migrations.py    # Database migration runner script
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (charts, modals, badges)
│   │   ├── layouts/         # Navbar, Sidebar
│   │   ├── pages/           # Dashboard, AnimalsList, AnimalProfile, AIAnalysis, Alerts, Reports
│   │   ├── services/        # API client
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx          # Main application shell
│   │   └── index.css        # Tailwind CSS and theme tokens
│   ├── package.json         # Node.js dependencies
│   ├── tsconfig.json        # TypeScript configuration
│   └── vite.config.ts       # Vite build & API proxy configuration
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql  # 8 core relational tables & indexes
│       └── 002_seed_data.sql       # 10 animals, veterinary documents, initial alerts
├── .env.example             # Root environment reference
├── .gitignore               # Ignored files (venv, node_modules, .env)
└── README.md                # Project documentation
```

---

## ⚡ Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL client / Supabase credentials

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (.env)
cp .env.example .env
```

Ensure your `backend/.env` contains the database credentials:
```env
SUPABASE_URL=https://mlmilvhgicvxjarfgpyj.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_OR3xjLxyJY9CqIszOuzojQ_WAhMJ7-O
DATABASE_URL=postgresql://postgres.mlmilvhgicvxjarfgpyj:Deepak8431**%23%23%40%40@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
DB_HOST=aws-0-ap-northeast-2.pooler.supabase.com
DB_NAME=postgres
DB_USER=postgres.mlmilvhgicvxjarfgpyj
DB_PASS=Deepak8431**##@@
DB_PORT=6543
AI_API_KEY=your_gemini_api_key
AI_MODEL=gemini-3.8-flash
PORT=8000
DEMO_MODE=true
```

Start the backend:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at `http://127.0.0.1:8000` (Docs at `/docs`).

---

### 2. Frontend Setup

In a new terminal:
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### 3. Demo Walkthrough

1. **Dashboard Overview**: Inspect the live herd KPI summary (Total Animals, Healthy, High Risk).
2. **Simulate Acute Pyrexia on COW-027**:
   - Click the top navbar button **"Simulate Health Event (COW-027)"** or run `POST /api/demo/simulate-health-event`.
   - The multi-agent pipeline immediately executes:
     - Temperature rises from 38.5°C to 40.1°C (`HIGH_PYREXIA`).
     - Feed intake drops from 100% to 65% (-29.4%).
     - Activity drops from 100% to 58% (-35.4%).
     - Risk Score jumps to **78.0/100 (HIGH RISK)**.
     - A clinical decision report is generated and an alert is logged.
3. **Reset Demo**:
   - Click **"Reset Demo"** in the top navbar or call `POST /api/demo/reset`.
   - `COW-027` is restored to baseline healthy status (Risk: 18, Status: Healthy).

---

## 🔒 Clinical Disclaimer

*VET-AI provides AI-assisted health-risk monitoring and decision support based on multi-sensor telemetry, computer vision, and veterinary literature. It does NOT provide a definitive veterinary medical diagnosis. Always consult a licensed veterinarian for definitive diagnosis and treatment protocols.*
