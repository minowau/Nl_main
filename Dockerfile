# Stage 1: Build the React Frontend
FROM node:18-alpine as build-frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Setup the Python Backend
FROM python:3.9-slim

# Create a non-root user for Hugging Face (UID 1000)
RUN useradd -m -u 1000 user

# Install system dependencies first (cached layer)
USER root
RUN apt-get update && apt-get install -y --no-install-recommends gcc python3-dev \
    && rm -rf /var/lib/apt/lists/*

USER user
ENV PATH="/home/user/.local/bin:$PATH"
USER root
RUN mkdir -p /data/db && chown -R user:user /data
USER user

WORKDIR /home/user/app

# Install PyTorch CPU-only FIRST (largest package, separate cache layer)
# This avoids downloading the ~800MB CUDA version
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies
COPY --chown=user backend/requirements.txt backend/
# Remove torch from requirements since we installed it above
RUN grep -v '^torch' backend/requirements.txt > /tmp/req_notorch.txt && pip install --no-cache-dir --upgrade -r /tmp/req_notorch.txt && pip install --no-cache-dir gunicorn

# Copy Backend Code
COPY --chown=user backend/ backend/
COPY --chown=user navigators/ navigators/

# Copy Frontend Build from Stage 1
COPY --chown=user --from=build-frontend /app/dist ./dist

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=7860

# Run the application
CMD gunicorn -b 0.0.0.0:$PORT backend.nlp_api:app
