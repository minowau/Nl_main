# NLP Learning Grid - Task Documentation

## Project Overview
NLP Learning Grid is a grid-based learning system for Natural Language Processing (NLP) topics. It provides:
- A 2D grid visualization with NLP resources positioned at coordinates
- Interactive agent movement and resource discovery
- Learning summaries and polyline visualization
- DQN-based optimal path recommendations

---

## Frontend Components

### 1. **GridVisualization.tsx**
- **Purpose**: Renders the 20x20 grid with resources and agent
- **Buttons/Interactions**:
  - Click cells: Move agent or interact with resources
  - Resource icons: Books, Videos, Quizzes, Assignments
  - Active polylines: Highlighted paths on the grid

### 2. **ControlPanel.tsx**
- **Purpose**: Learning management and controls

#### Button Functions:
1. **"Summarise My Learning"**
   - Action: Opens modal with Title and Summary input fields
   - Backend: POST `/api/summary/create` - Creates learning summary from visited resources
   - Outputs: LearningSummary, Polyline

2. **"See polyline"**
   - Action: Display active polyline details
   - Backend: GET `/api/polylines/<id>` - Fetches polyline with chart data
   - Shows confidence, summary, and 12-point topic index visualization

3. **"Polylines List"**
   - Action: List all generated polylines with mini-charts
   - Backend: GET `/api/polylines` - Lists all polylines
   - Shows learning journey progression

4. **"Start DQN" / "Stop DQN"**
   - Action: Toggle DQN simulation
   - Backend: POST `/api/dqn-path` - Generates optimal path
   - Shows: Recommended next resources, total potential reward

### 3. **App.tsx**
- **Purpose**: Main application container
- **State Management**:
  - Resources (visited/unvisited)
  - Agent state (position, level, reward)
  - Learning data (summary, recommendations)
  - Polylines collection

---

## Backend API Endpoints

### Resource Management
```
GET /api/resources
- Returns all NLP resources from Excel
- Response: Resource[]

GET /api/resources/{id}
- Returns single resource details
- Response: Resource

POST /api/resource/visit
- Mark resource as visited, update agent
- Request: {session_id, resource_id}
- Response: AgentState
```

### Agent State
```
GET /api/agent?session_id=default
- Get current agent position, level, reward
- Response: AgentState

POST /api/agent/move
- Move agent to new position
- Request: {session_id, position: {x, y}}
- Response: AgentState
```

### Learning Summaries
```
POST /api/summary/create
- Create summary from visited resources
- Request: {session_id, title, summary, visited_resources: []}
- Response: {summary: LearningSummary, polyline: Polyline}

GET /api/learning-data?session_id=default
- Get comprehensive learning metrics
- Response: LearningData (totalResources, visitedResources, currentLevel, etc)
```

### Polylines
```
GET /api/polylines
- List all polylines
- Response: Polyline[]

GET /api/polylines/{id}
- Get specific polyline
- Response: Polyline

POST /api/polylines/{id}/toggle
- Toggle polyline visibility
- Request: {isActive: boolean}
- Response: Polyline
```

### DQN Path Generation
```
POST /api/dqn-path
- Generate optimal learning path
- Request: {session_id, agent_position: {x,y}, visited_resource_ids: []}
- Response: {path: Position[], finalResource, totalReward, pathLength}
```

---

## Data Structures

### Resource
```typescript
{
  id: string;
  position: {x: number, y: number};
  type: 'book' | 'video' | 'quiz' | 'assignment';
  title: string;
  visited: boolean;
  difficulty: number (1-5);
  reward: number (50-160);
  url?: string;
  description?: string;
}
```

### AgentState
```typescript
{
  position: {x, y};
  level: number (1-5);
  totalReward: number;
  visitedResources: string[];
}
```

### LearningSummary
```typescript
{
  totalResources: number;
  visitedResources: number;
  currentLevel: number;
  strengths: string[];
  recommendations: string[];
  nextOptimalResource: Position | null;
  totalReward: number;
}
```

### Polyline
```typescript
{
  id: string;
  name: string;
  path: Position[];
  color: string (rgba);
  isActive: boolean;
  confidence: number (0-1);
  summary?: string;
}
```

---

## Data Source

### Advances in NLP Excel (nlp/Advances in NLP.xlsx)
- Contains NLP topics with coordinates and metadata
- Loaded on backend startup via `nlp_api.py`
- Maps to Resource objects with:
  - Position: x, y coordinates for grid
  - Type: Resource type classification
  - Difficulty: 1-5 scale
  - Reward: Points for completion

---

## Task Checklist

### ✅ Completed
- [x] Frontend grid-based system examination
- [x] Backend API structure review
- [x] Created nlp_api.py with all endpoints
- [x] Created nlpApi.ts service for frontend
- [x] Updated useDQNSimulation.ts to use backend API
- [x] Updated App.tsx to load real resources from backend
- [x] Created CORS-enabled Flask init
- [x] Documentation of all buttons and endpoints

### 🔄 In Progress
- [ ] Complete backend initialization
- [ ] Connect to database (optional for MVP)

### ⏳ Todo
- [ ] Test all frontend-backend integration
- [ ] Verify Excel data loading
- [ ] Performance optimization
- [ ] Error handling refinement

---

## Setup Instructions

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

### Frontend
```bash
npm install
npm run dev
# Runs on http://localhost:5173
```

### Environment
- Python 3.8+
- Node.js 16+
- Flask + Flask-CORS
- React + TypeScript
