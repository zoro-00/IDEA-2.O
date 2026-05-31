FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy deployment requirements first for caching
COPY requirements-deploy.txt .

# Install standard dependencies (includes FastAPI, Neo4j, PyTorch CPU)
RUN pip install --no-cache-dir -r requirements-deploy.txt

# Install PyG specific C++ extensions for the exact PyTorch version on CPU
RUN pip install --no-cache-dir pyg_lib torch_scatter torch_sparse torch_cluster torch_spline_conv -f https://data.pyg.org/whl/torch-2.3.0+cpu.html

# Copy the rest of the application
COPY . .

# DigitalOcean provides the PORT environment variable dynamically
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "uvicorn demo_server:app --host 0.0.0.0 --port ${PORT}"]
