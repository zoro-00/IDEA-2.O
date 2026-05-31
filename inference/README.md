# STAR: Spatial Temporal Automated Risk system

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue.svg" alt="Python Version"/>
  <img src="https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react" alt="React Platform"/>
  <img src="https://img.shields.io/badge/PyTorch-Geometric-EE4C2C.svg?logo=pytorch" alt="PyTorch Framework"/>
  <img src="https://img.shields.io/badge/Neo4j-Aura_Cloud-008CC1.svg?logo=neo4j" alt="Neo4j Layer"/>
</p>

## 🚀 Overview

The **Spatial Temporal Automated Risk (STAR)** system is a production-grade Anti-Money Laundering (AML) platform bridging the gap between cutting-edge Graph Machine Learning research and real-time infrastructure.

Our system uses a **Hybrid AML Architecture**:
* **Layer 1: Explainability Rule Engine** (Deterministic evaluation of structural typologies like Dispersion/Gathering)
* **Layer 2: Temporal Graph Neural Network (TGNN)** (Probabilistic scoring via PyTorch GATe model)
* **Layer 3: Score Fusion** (Adaptive thresholding weighing deterministic rules vs probabilistic graph attention)

By integrating these layers with **Neo4j Aura** cloud databases, STAR evaluates the contextual "subgraph" of every transaction in real-time to detect complex fraud typologies.

## 🏗️ Repository Architecture

1. **`/model` (TGNN Training Pipeline)**
   Contains the complete PyTorch Geometric (PyG) pipeline used to train our AI model on the IBM AML dataset. 
   - **`training.py` & `models.py`:** Implements the Temporal GAT (GATe) architecture, utilizing both spatial message passing and temporal transaction features.
   - **`extract_baseline.py`:** Extracts precise normalization statistics directly from the training dataset.

2. **`/backend` (Real-Time Inference Server)**
   A FastAPI application simulating a high-throughput transaction stream.
   - **`checkpoint_gat_medium_hi.tar`:** The production-ready pre-trained weights (trained on Medium_HI dataset using H200 instances).
   - **k-hop Subgraph Extraction:** Executes Neo4j Cypher queries to extract multi-hop neighborhoods for structural feature analysis.
   - **`demo_server.py`:** The primary orchestrator handling WebSockets, the Hybrid Rule+GNN logic (35% risk threshold), and live PyTorch inference.

3. **`/frontend` (Investigator Dashboard)**
   A modern React/Vite/TypeScript frontend rendering a high-performance force-directed graph UI (via `react-force-graph-2d`). 
   - Live stream visualization of transactions and embedded fraud typologies.
   - Integrated Case Management queue to review and escalate fraud alerts directly connected to the backend.

---

## 💻 Tech Stack

*   **Backend:** Python, FastAPI, WebSockets, PyTorch Geometric, Neo4j Python Driver.
*   **Frontend:** React, TypeScript, Vite, Force-Graph.
*   **Database Engine:** Neo4j Aura (Cloud managed graph logic & k-hop pathfinding).

---

## ⚙️ Quick Start (Real-Time Demo)

### 1. Backend Setup
```bash
cd backend
# Create and activate environment
uv venv .venv
.venv/Scripts/activate # Windows
# Install CPU-optimized deployment dependencies
uv pip install -r requirements-deploy.txt 

# Launch the FastAPI orchestrator
python demo_server.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Navigate to `http://localhost:5173` to access the Investigator Command Center. Click "START DEMO" to watch the real-time inference loop build the graph and flag fraud.*

---

## ☁️ Cloud Deployment

The repository is pre-configured for containerized cloud deployment (DigitalOcean, Google Cloud Run, etc.). The `backend/Dockerfile` and `app.yaml` are optimized to use CPU-only PyTorch builds via `requirements-deploy.txt` to minimize image size (~300MB).

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
