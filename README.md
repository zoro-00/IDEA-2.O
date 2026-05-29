# STAR — Suspicious Transaction Analysis & Response

> Real-time Anti-Money Laundering intelligence platform combining trained ML models, Graph Neural Networks, rule-based detection, and Gemini AI.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STAR Platform                                 │
│                                                                      │
│  ┌──────────────────────────────┐    ┌────────────────────────────┐  │
│  │     Frontend (Next.js 16)    │    │    Backend (FastAPI)       │  │
│  │                              │◄──►│                            │  │
│  │  • Command Center Dashboard  │ WS │  • Isolation Forest        │  │
│  │  • Real-Time Alert Stream    │    │  • GATe TGNN               │  │
│  │  • Graph Visualization       │    │  • Rule Engine (7 rules)   │  │
│  │  • Temporal Analysis         │    │  • Risk Fusion Engine      │  │
│  │  • AI Copilot Chat           │    │  • LangChain + Gemini      │  │
│  │  • Entity Investigation      │    │  • Neo4j / NetworkX        │  │
│  │  • Risk Scoring              │    │  • WebSocket Streaming     │  │
│  └──────────────────────────────┘    └────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    ML Intelligence Layer                      │    │
│  │                                                              │    │
│  │  isolation_models/          portable_tgnn_inference/         │    │
│  │  ├── isolation_forest.pkl   ├── checkpoint.tar (GATe)        │    │
│  │  ├── scaler.pkl             ├── models.py                    │    │
│  │  └── model_metadata.pkl     └── inference_engine.py          │    │
│  └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## AML Intelligence Pipeline

```
New Transaction Arrives
        │
        ▼
Feature Engineering (29 IF features + 8 TGNN edge features)
        │
        ▼
Update Transaction Graph (Neo4j or in-memory NetworkX)
        │
        ├──────────────────────────────┐
        │                              │
        ▼                              ▼
Isolation Forest               GATe TGNN Inference
(behavioral anomaly)           (graph fraud probability)
        │                              │
        └──────────────┬───────────────┘
                       │
                       ▼
              Rule Engine Checks
              • Structuring
              • Fan-out
              • Rapid layering
              • Round-tripping
              • Dormant reactivation
              • Velocity breach
              • High value
                       │
                       ▼
            Risk Fusion Engine
       IF(0.35) + TGNN(0.40) + Rules(0.25)
                       │
                       ▼
              Final Score (0–100)
                       │
                  Score ≥ 65?
                 /            \
               YES              NO
                │                │
                ▼                ▼
         Generate Alert     Log transaction
                │
                ▼
      WebSocket Broadcast
                │
                ▼
      Frontend Updates Live
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TailwindCSS v4 |
| State Management | Zustand |
| Animations | Framer Motion, GSAP |
| 3D / Graph | Three.js, react-force-graph-2d |
| Charts | Recharts |
| Backend | FastAPI, Uvicorn |
| ML — Anomaly | Isolation Forest (scikit-learn) |
| ML — Graph | GATe (PyTorch + PyTorch Geometric) |
| Graph Store | Neo4j (optional) + NetworkX (fallback) |
| AI Copilot | LangChain + Google Gemini 2.0 Flash |
| Config | Pydantic Settings |
| Package Mgr | uv (Python), npm (Node.js) |

---

## Quick Start

### 1. Backend

```powershell
cd backend

# Install dependencies
uv sync

# Install PyTorch (CPU)
uv run pip install torch --index-url https://download.pytorch.org/whl/cpu
uv run pip install torch-geometric -f https://data.pyg.org/whl/torch-2.2.0+cpu.html

# Configure environment
# Edit backend/.env and set GEMINI_API_KEY

# Start server
uv run python -m app.main
# → http://localhost:8000
# → Docs: http://localhost:8000/docs
```

### 2. Frontend

```powershell
cd apps/web

npm install
npm run dev
# → http://localhost:3000
```

### 3. Connect Frontend to Backend

The frontend automatically connects to `ws://localhost:8000/ws/stream`. When the backend is running, the dashboard shows **real** AI-scored transactions instead of mock data.

---

## Repository Structure

```
STAR/
├── apps/
│   └── web/                           # Next.js Frontend
│       └── src/
│           ├── app/                   # Next.js app router
│           │   ├── (app)/             # Authenticated app routes
│           │   │   ├── dashboard/     # Command center
│           │   │   ├── alerts/        # Alert management
│           │   │   ├── graph/         # Transaction graph
│           │   │   ├── risk/          # Risk scoring
│           │   │   ├── copilot/       # AI assistant
│           │   │   └── ...
│           │   └── (landing)/         # Landing page
│           ├── components/            # Reusable UI components
│           ├── hooks/
│           │   └── useWebSocketSim.ts # Real WS + mock fallback
│           ├── lib/
│           │   └── api.ts             # Typed backend API client
│           ├── store/
│           │   └── useAMLStore.ts     # Zustand global state
│           └── types/index.ts         # TypeScript types
│
└── backend/                           # FastAPI Backend
    ├── app/
    │   ├── main.py                    # Application entry point
    │   ├── core/config.py             # Pydantic settings
    │   ├── models/                    # Pydantic schemas
    │   ├── services/                  # AI + business logic
    │   ├── api/routes/                # REST API routes
    │   └── websocket/                 # WS managers
    ├── isolation_models/              # Trained IF artifacts
    ├── portable_tgnn_inference/       # GATe checkpoint + code
    ├── pyproject.toml                 # uv dependencies
    └── .env                           # Environment config
```

---

## API Quick Reference

```
GET  /system/health         → Service status (IF, TGNN, Neo4j, Gemini, WS)
GET  /system/models         → Loaded model metadata

POST /score/transaction     → Full pipeline score (IF + TGNN + rules → fused)
POST /score/account         → Account behavioral score
POST /score/graph           → Batch graph inference

GET  /alerts                → Alert list (filterable)
PATCH /alerts/{id}          → Update alert status

GET  /graph/subgraph        → Account neighborhood visualization
GET  /graph/path            → Money movement tracing
GET  /graph/communities     → Community detection

POST /copilot/query/sync    → AI investigation assistant
POST /copilot/sar           → SAR draft generation

WS   /ws/stream             → Real-time transactions + alerts
WS   /ws/graph              → Live graph mutations
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google AI API key for copilot | For copilot features |
| `NEO4J_URI` | Neo4j connection string | Optional (in-memory fallback) |
| `NEO4J_USER` | Neo4j username | Optional |
| `NEO4J_PASSWORD` | Neo4j password | Optional |
| `PORT` | Backend port (default: 8000) | No |
| `RISK_ALERT_THRESHOLD` | Score threshold for alerts (default: 65) | No |
| `IF_WEIGHT` | Isolation Forest weight in fusion (0.35) | No |
| `TGNN_WEIGHT` | TGNN weight in fusion (0.40) | No |
| `RULE_WEIGHT` | Rule engine weight in fusion (0.25) | No |

---

## License

Internal POC — STAR Platform
