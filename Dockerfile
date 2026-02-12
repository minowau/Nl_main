# Stage 1: Build the React Frontend
FROM node:18-alpine as build-frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Setup the Python Backend
FROM python:3.9-slim
WORKDIR /app

# Install system dependencies if needed (e.g. for numpy/pandas compilation)
RUN apt-get update && apt-get install -y --no-install-recommends gcc python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt backend/
# Add gunicorn for production server
RUN pip install --no-cache-dir -r backend/requirements.txt && pip install gunicorn

# Copy Backend Code
COPY backend/ backend/

# Copy Frontend Build from Stage 1
COPY --from=build-frontend /app/dist ./dist

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=5000

# Expose port
EXPOSE 5000

# Run the application
CMD ["gunicorn", "-b", "0.0.0.0:5000", "backend.nlp_api:app"]
