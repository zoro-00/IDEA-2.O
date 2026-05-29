# STAR Backend — AML Intelligence Engine

**S**uspicious **T**ransaction **A**nalysis & **R**esponse — FastAPI backend powering real-time Anti-Money Laundering detection using trained ML models + Graph Neural Networks + rule-based detection.

---

## Architecture

```
Frontend (Next.js)
        │
        ├── REST API ──────────────────── FastAPI (port 8000)
        └── WebSocket (/ws/stream) ───────────────────┐
                                                       │
                              ┌────────────────────────▼──────────┐
                              │      Transaction Pipeline          │
                              │                                    │
                              │  Raw Transaction                   │
                              │       ↓                            │
                              │  Feature Engineering (29 features) │
                              │       ↓                            │
                              │  Update Neo4j / In-Memory Graph    │
                              │       ↓                            │
                              │  Isolation Forest Inference        │
                              │  (isolation_forest.pkl + scaler)   │
                              │       ↓                            │
                              │  GATe TGNN Inference               │
                              │  (checkpoint.tar + models.py)      │
                              │       ↓                            │
                              │  Rule Engine (7 deterministic)     │
                              │       ↓                            │
                              │  Risk Fusion Engine                │
                              │  (IF×0.35 + TGNN×0.40 + rules×0.25)│
                              │       ↓                            │
                              │  Alert Generation (if score ≥ 65)  │
                              │       ↓                            │
                              │  WebSocket Broadcast               │
                              └────────────────────────────────────┘
```

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                        # FastAPI app + lifecycle
│   ├── core/
│   │   └── config.py                  # Pydantic settings from .env
│   ├── models/
│   │   ├── requests.py                # Pydantic request schemas
│   │   ├── responses.py               # Pydantic response schemas
│   │   └── internal.py                # Internal dataclasses (pipeline)
│   ├── services/
│   │   ├── isolation_forest_service.py  # IF inference (pkl)
│   │   ├── tgnn_service.py              # GATe inference (checkpoint.tar)
│   │   ├── feature_engineering.py       # 29 IF + 8 TGNN edge features
│   │   ├── graph_builder.py             # txns → PyG Data objects
│   │   ├── neo4j_service.py             # Graph DB (Neo4j + NetworkX fallback)
│   │   ├── rule_engine.py               # 7 AML rules
│   │   ├── risk_fusion.py               # Weighted score fusion
│   │   └── copilot_service.py           # LangChain + Gemini AI
│   ├── api/
│   │   ├── websocket_route.py           # /ws/stream, /ws/graph
│   │   └── routes/
│   │       ├── score.py                 # /score/account, /score/transaction, /score/graph
│   │       ├── alerts.py                # /alerts CRUD
│   │       ├── graph.py                 # /graph endpoints
│   │       ├── copilot.py               # /copilot endpoints
│   │       └── system.py                # /system/health, /metrics, /models
│   └── websocket/
│       ├── connection_manager.py        # WS connection pool
│       └── stream_manager.py            # Background pipeline loop
├── isolation_models/
│   ├── isolation_forest.pkl             # Trained IF model
│   ├── scaler (1).pkl                   # Feature scaler
│   └── model_metadata.pkl               # Threshold + feature order
└── portable_tgnn_inference/
    ├── checkpoint.tar                   # GATe model weights
    ├── models.py                        # GATe architecture
    ├── inference_engine.py              # TGNNInferenceEngine
    └── demo_input_generator.py          # Graph generator for testing
```

---

## Setup

### Prerequisites

- Python 3.12+
- `uv` package manager (already initialized)
- GPU optional (CPU inference works)

### 1. Install Dependencies

```powershell
# From backend/ directory
uv sync

# PyTorch + PyG must be installed separately (CPU version):
uv run pip install torch --index-url https://download.pytorch.org/whl/cpu
uv run pip install torch-geometric torch-scatter torch-sparse -f https://data.pyg.org/whl/torch-2.2.0+cpu.html
```

### 2. Configure Environment

Edit `backend/.env`:

```env
GEMINI_API_KEY=your_key_here   # from https://aistudio.google.com/app/apikey
NEO4J_URI=bolt://localhost:7687  # optional — in-memory fallback if unreachable
PORT=8000
```

### 3. Verify Models Load

```powershell
# Test TGNN model
cd backend/portable_tgnn_inference
uv run python verify_model.py

# Should print: ✅ TGNN loads + prints predictions
```

### 4. Start Backend

```powershell
# From backend/ directory
uv run python -m app.main

# Or with hot-reload:
uv run uvicorn app.main:app --reload --port 8000
```

---

## API Reference

### Scoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/score/account` | Score account by 29 behavioral features |
| `POST` | `/score/transaction` | Full pipeline score for a transaction |
| `POST` | `/score/graph` | TGNN inference on transaction graph |

**Example — Score Transaction:**
```bash
curl -X POST http://localhost:8000/score/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "id": "TXN-001",
      "from_account": "ACCT-1001",
      "to_account": "ACCT-1002",
      "amount": 9500.00,
      "currency": "USD",
      "payment_format": "SWIFT"
    }
  }'
```

**Response:**
```json
{
  "final_score": 78.4,
  "risk_level": "high",
  "alert_generated": true,
  "alert_id": "ALT-A3B2C1D0",
  "breakdown": {
    "isolation_forest": 24.5,
    "tgnn": 38.2,
    "rules": 15.7
  },
  "top_signals": ["GNN fraud probability 95.5%", "Structuring pattern detected"],
  "explanation": "STAR assessed ACCT-1001 with a final risk score of 78/100 (HIGH)..."
}
```

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/alerts` | List alerts (paginated, filterable) |
| `GET` | `/alerts/{id}` | Single alert detail |
| `PATCH` | `/alerts/{id}` | Update status |
| `GET` | `/alerts/stats/summary` | Summary statistics |

### Graph

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/graph/subgraph?account_id=&depth=` | Account neighborhood |
| `GET` | `/graph/full` | Full graph |
| `GET` | `/graph/path?from_id=&to_id=` | Shortest path tracing |
| `GET` | `/graph/communities` | Community detection |
| `POST` | `/graph/query` | Raw Cypher (Neo4j only) |

### AI Copilot

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/copilot/query` | Streaming SSE chat |
| `POST` | `/copilot/query/sync` | Non-streaming chat |
| `POST` | `/copilot/sar` | Generate SAR draft |
| `GET` | `/copilot/status` | Check if Gemini is available |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/system/health` | All service statuses |
| `GET` | `/system/metrics` | Runtime performance |
| `GET` | `/system/models` | Model metadata |

### WebSocket

| URL | Description |
|-----|-------------|
| `ws://localhost:8000/ws/stream` | Real-time transactions + alerts |
| `ws://localhost:8000/ws/graph` | Live graph mutations |

---

## Risk Fusion Formula

```
final_score = 0.35 × IF_score + 0.40 × TGNN_score + 0.25 × rule_score
```

| Score Range | Risk Level |
|-------------|------------|
| 0–20 | Normal |
| 20–40 | Monitoring |
| 40–60 | Moderate |
| 60–75 | High |
| 75–100 | Critical |

Alert threshold: **65/100** (configurable via `RISK_ALERT_THRESHOLD` in `.env`)

---

## AI Models

### Isolation Forest
- **File**: `isolation_models/isolation_forest.pkl`
- **Scaler**: `isolation_models/scaler (1).pkl`
- **Features**: 29 behavioral features (txn_count, structuring_ratio, burst_score, ...)
- **Output**: Anomaly score → normalized 0-100 risk score

### GATe TGNN (Graph Attention Network)
- **File**: `portable_tgnn_inference/checkpoint.tar`
- **Architecture**: `GATe` — 2-layer GATConv + MLP classifier
- **Edge features**: 8-dim `[timestamp, amount, currency, format, in_port, out_port, in_td, out_td]`
- **Node features**: 1-dim placeholder (ones)
- **Output**: Per-edge fraud probability (0.0–1.0)

### Rule Engine (7 Rules)
1. **Structuring** — multiple txns $8k–$10k in 24h
2. **Fan-out** — 8+ unique receivers in 1h
3. **Rapid Layering** — 4+ chain hops in 30 minutes
4. **Dormant Reactivation** — 90+ day gap then high-value txn
5. **Round-tripping** — money returns to origin within 24h
6. **High Velocity** — 3× baseline transaction rate
7. **High Value** — single txn above $100k

---

## WebSocket Message Types

```typescript
// Transaction scored
{ type: "transaction", data: { id, from, to, amount, risk, final_score, ... } }

// Alert generated
{ type: "alert", data: { id, type, severity, score, breakdown, top_signals, ... } }

// Graph mutation
{ type: "graph_update", nodes: [...], edges: [...] }

// Heartbeat
{ type: "ping", ts: 1234567890 }
```

---

## Neo4j vs In-Memory Mode

The backend automatically tries Neo4j on startup. If unreachable, it uses a **NetworkX DiGraph** in-memory.

| Feature | Neo4j Mode | In-Memory Mode |
|---------|-----------|----------------|
| Persistence | ✅ | ❌ (resets on restart) |
| Cypher queries | ✅ | ❌ |
| Path tracing | ✅ Cypher | ✅ NetworkX |
| Community detection | ✅ GDS | ✅ Louvain/Components |
| Centrality metrics | ✅ | ✅ (up to 500 nodes) |

To enable Neo4j: set `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` in `.env`.

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'torch_geometric'`**
```powershell
uv run pip install torch-geometric -f https://data.pyg.org/whl/torch-2.2.0+cpu.html
```

**`FileNotFoundError: isolation_forest.pkl not found`**
Ensure the `isolation_models/` directory contains all 3 pkl files.

**`TGNN scoring failed: Expected edge_attr with 8 columns`**
The checkpoint expects exactly 8 edge features. The `feature_engineering.py` always produces 8. If calling directly, ensure `edge_features` has length 8.

**Gemini copilot not responding**
Add `GEMINI_API_KEY=...` to `backend/.env` and restart the server.
