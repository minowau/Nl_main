
---
title: NL Main
emoji: 🧠
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
---

# NLP Learning Grid

Advanced agentic NLP learning platform with a 3D grid interface, DQN-based pathfinding, and interactive AI learning assistant.

## Deployment Options

### Hugging Face Spaces
This repository is configured for direct deployment to Hugging Face Spaces using Docker.
- Port: 7860 (Auto-configured in Dockerfile)

### Fly.io
Deploy using the included `fly.toml`:
```bash
fly launch
```

### Render.com
Use the `render.yaml` for one-click deployment.

### Manual
```bash
docker build -t nlp-learning-grid .
docker run -p 5000:7860 nlp-learning-grid
```
