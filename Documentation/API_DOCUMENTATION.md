# NLP Learning Grid - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Overview
The NLP Learning Grid API provides endpoints for managing a grid-based learning system for NLP topics. The system includes resource management, agent state tracking, learning summaries, and DQN-based path optimization.

---

## Resource Endpoints

### Get All Resources
```http
GET /api/resources
```

**Description**: Fetch all available NLP learning resources from the database/Excel file.

**Query Parameters**: None

**Response**:
```json
[
  {
    "id": "1",
    "position": {"x": 5, "y": 12},
    "type": "book",
    "title": "Pre training objectives",
    "visited": false,
    "difficulty": 2,
    "reward": 60,
    "url": "https://...",
    "description": "..."
  },
  ...
]
```

**Status Codes**:
- `200`: Success

---

### Get Single Resource
```http
GET /api/resources/{resource_id}
```

**Description**: Fetch details of a specific resource.

**Path Parameters**:
- `resource_id` (string): The resource ID

**Response**:
```json
{
  "id": "1",
  "position": {"x": 5, "y": 12},
  "type": "book",
  "title": "Pre training objectives",
  "visited": false,
  "difficulty": 2,
  "reward": 60
}
```

**Status Codes**:
- `200`: Success
- `404`: Resource not found

---

## Agent State Endpoints

### Get Agent State
```http
GET /api/agent?session_id=default
```

**Description**: Get the current state of the learning agent (position, level, accumulated reward).

**Query Parameters**:
- `session_id` (string, optional): Session identifier. Default: "default"

**Response**:
```json
{
  "position": {"x": 10, "y": 10},
  "level": 1,
  "totalReward": 0,
  "visitedResources": []
}
```

**Status Codes**:
- `200`: Success

---

### Move Agent
```http
POST /api/agent/move
```

**Description**: Move the agent to a new position on the grid.

**Request Body**:
```json
{
  "session_id": "default",
  "position": {"x": 15, "y": 8}
}
```

**Response**:
```json
{
  "position": {"x": 15, "y": 8},
  "level": 1,
  "totalReward": 0,
  "visitedResources": []
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid position

---

## Resource Interaction Endpoints

### Visit Resource
```http
POST /api/resource/visit
```

**Description**: Mark a resource as visited and update the agent's state (reward, level).

**Request Body**:
```json
{
  "session_id": "default",
  "resource_id": "1"
}
```

**Response**:
```json
{
  "position": {"x": 5, "y": 12},
  "level": 1,
  "totalReward": 60,
  "visitedResources": ["1"]
}
```

**Status Codes**:
- `200`: Success
- `404`: Resource not found

---

## Learning Summary Endpoints

### Create Learning Summary
```http
POST /api/summary/create
```

**Description**: Generate a learning summary from visited resources and create a polyline visualization.

**Request Body**:
```json
{
  "session_id": "default",
  "title": "Week 1 Learning",
  "summary": "Completed foundational NLP topics",
  "visited_resources": ["1", "2", "3"]
}
```

**Response**:
```json
{
  "summary": {
    "id": "summary_default_0",
    "title": "Week 1 Learning",
    "summary": "Completed foundational NLP topics",
    "totalResources": 18,
    "visitedResources": 3,
    "currentLevel": 1,
    "strengths": ["Pre training objectives", "Pre trained models"],
    "recommendations": ["Fine tuning LLM", "RLHF"],
    "avgDifficulty": 2.33,
    "totalReward": 195
  },
  "polyline": {
    "id": "polyline_0",
    "name": "Week 1 Learning",
    "path": [
      {"x": 5, "y": 12},
      {"x": 4, "y": 12},
      {"x": 8, "y": 9}
    ],
    "color": "rgba(120, 180, 200, 0.4)",
    "isActive": true,
    "confidence": 0.82,
    "summary": "Completed foundational NLP topics"
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Missing required fields (title, summary)

---

### Get Learning Data
```http
GET /api/learning-data?session_id=default
```

**Description**: Get comprehensive learning analytics and recommendations.

**Query Parameters**:
- `session_id` (string, optional): Session identifier. Default: "default"

**Response**:
```json
{
  "totalResources": 18,
  "visitedResources": 3,
  "currentLevel": 1,
  "strengths": ["Pre training objectives", "Tutorial: Introduction to huggingface"],
  "recommendations": ["Fine tuning LLM", "Instruction tuning", "Parameter efficient fine tuning"],
  "nextOptimalResource": {"x": 9, "y": 10},
  "totalReward": 215
}
```

**Status Codes**:
- `200`: Success

---

## Polyline Endpoints

### Get All Polylines
```http
GET /api/polylines
```

**Description**: Fetch all generated polylines (learning paths).

**Response**:
```json
[
  {
    "id": "polyline_0",
    "name": "Week 1 Learning",
    "path": [
      {"x": 5, "y": 12},
      {"x": 4, "y": 12}
    ],
    "color": "rgba(100, 150, 200, 0.4)",
    "isActive": true,
    "confidence": 0.85,
    "summary": "..."
  },
  ...
]
```

**Status Codes**:
- `200`: Success

---

### Get Single Polyline
```http
GET /api/polylines/{polyline_id}
```

**Description**: Fetch details of a specific polyline with visualization data.

**Path Parameters**:
- `polyline_id` (string): The polyline ID

**Response**:
```json
{
  "id": "polyline_0",
  "name": "Week 1 Learning",
  "path": [{"x": 5, "y": 12}, {"x": 4, "y": 12}],
  "color": "rgba(100, 150, 200, 0.4)",
  "isActive": true,
  "confidence": 0.85,
  "summary": "Learning summary text"
}
```

**Status Codes**:
- `200`: Success
- `404`: Polyline not found

---

### Toggle Polyline
```http
POST /api/polylines/{polyline_id}/toggle
```

**Description**: Toggle the visibility/active state of a polyline.

**Path Parameters**:
- `polyline_id` (string): The polyline ID

**Request Body**:
```json
{
  "isActive": true
}
```

**Response**:
```json
{
  "id": "polyline_0",
  "name": "Week 1 Learning",
  "path": [...],
  "color": "rgba(100, 150, 200, 0.4)",
  "isActive": true,
  "confidence": 0.85
}
```

**Status Codes**:
- `200`: Success
- `404`: Polyline not found

---

## DQN Path Endpoints

### Generate DQN Path
```http
POST /api/dqn-path
```

**Description**: Generate an optimal learning path using DQN algorithm.

**Request Body**:
```json
{
  "session_id": "default",
  "agent_position": {"x": 10, "y": 10},
  "visited_resource_ids": ["1", "2"]
}
```

**Response**:
```json
{
  "path": [
    {"x": 10, "y": 10},
    {"x": 9, "y": 10},
    {"x": 9, "y": 9},
    {"x": 9, "y": 9}
  ],
  "finalResource": {
    "id": "4",
    "position": {"x": 9, "y": 10},
    "type": "assignment",
    "title": "Fine tuning LLM",
    "visited": false,
    "difficulty": 3,
    "reward": 80
  },
  "totalReward": 395,
  "pathLength": 4
}
```

**Response Fields**:
- `path`: Array of grid positions representing the optimal path
- `finalResource`: The highest-value unvisited resource to target
- `totalReward`: Sum of all unvisited resources in the path
- `pathLength`: Number of steps in the path

**Status Codes**:
- `200`: Success

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common Error Codes**:
- `400`: Bad request - invalid parameters
- `404`: Not found - resource/polyline doesn't exist
- `500`: Server error - internal processing error

---

## Session Management

All endpoints support `session_id` parameter for session isolation:

```
default: Anonymous session
user_{id}: User-specific session
```

Each session maintains separate:
- Agent state
- Visited resources
- Generated polylines
- Learning progress

---

## Frontend Integration Examples

### Load Resources and Initialize
```typescript
// Get all resources
const resources = await fetch('/api/resources').then(r => r.json());

// Get agent state
const agent = await fetch('/api/agent?session_id=default').then(r => r.json());
```

### Interact with Resource
```typescript
const response = await fetch('/api/resource/visit', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    session_id: 'default',
    resource_id: '1'
  })
});
const updatedAgent = await response.json();
```

### Generate Learning Summary
```typescript
const result = await fetch('/api/summary/create', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    session_id: 'default',
    title: 'Week 1',
    summary: 'Completed NLP basics',
    visited_resources: ['1', '2', '3']
  })
});
const {summary, polyline} = await result.json();
```

### Get DQN Recommendation
```typescript
const dqn = await fetch('/api/dqn-path', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    session_id: 'default',
    agent_position: agent.position,
    visited_resource_ids: agent.visitedResources
  })
});
const path = await dqn.json();
```

---

## Rate Limiting

No rate limiting currently implemented. Production deployments should add:
- Per-session rate limiting
- Authentication/authorization
- Request validation

---

## Future Enhancements

- [ ] User authentication
- [ ] Database persistence
- [ ] Advanced NLP analysis
- [ ] Real DQN integration
- [ ] Batch operations
- [ ] WebSocket support for real-time updates
