# NLP Learning Grid - Quick Reference Card

## 🎯 What is This?
A grid-based learning system for NLP topics. Users navigate a grid, discover resources, summarize learning, and get DQN-optimized recommendations.

---

## 🖱️ Frontend Buttons

```
┌─────────────────────────────────────┐
│    Control Panel (Right Side)        │
├─────────────────────────────────────┤
│                                     │
│ 📝 Summarise My Learning            │
│    ↓ POST /api/summary/create       │
│    Creates summary + polyline       │
│                                     │
│ 📊 See polyline                     │
│    ↓ GET /api/polylines/{id}        │
│    Shows chart visualization        │
│                                     │
│ 📚 Polylines List                   │
│    ↓ GET /api/polylines             │
│    List all created polylines       │
│                                     │
│ 🤖 Start/Stop DQN                   │
│    ↓ POST /api/dqn-path             │
│    Shows optimal learning path      │
│                                     │
└─────────────────────────────────────┘
```

---

## 🌐 API Endpoints

```
BASE URL: http://localhost:5000/api

RESOURCES
  GET    /resources           List all NLP topics
  GET    /resources/{id}      Get one resource

AGENT
  GET    /agent               Get position, level, reward
  POST   /agent/move          Move to new position

INTERACTION
  POST   /resource/visit      Mark visited, update rewards

SUMMARIES
  POST   /summary/create      Create learning summary
  GET    /learning-data       Get analytics/recommendations

POLYLINES
  GET    /polylines           List all paths
  GET    /polylines/{id}      Get one path
  POST   /polylines/{id}/toggle   Toggle visibility

DQN
  POST   /dqn-path            Generate optimal path
```

---

## 📁 Key Files

```
Frontend
├─ src/App.tsx                Main app (loads resources)
├─ src/components/
│  ├─ ControlPanel.tsx        Buttons & summaries
│  └─ GridVisualization.tsx    20×20 grid display
├─ src/hooks/
│  └─ useDQNSimulation.ts      Calls backend API
└─ src/services/
   └─ nlpApi.ts               API service layer ⭐

Backend
├─ backend/app.py             Flask entry point
├─ backend/nlp_api.py         All 14 API routes ⭐
├─ backend/nlp/
│  └─ Advances in NLP.xlsx     NLP topics data ⭐
└─ backend/requirements.txt    Dependencies

Documentation
├─ INTEGRATION_GUIDE.md       Step-by-step walkthrough
├─ API_DOCUMENTATION.md       Complete endpoint docs
├─ TESTING_CHECKLIST.md       Test scenarios
└─ This file                  Quick reference
```

---

## 🔄 Data Flow Examples

### Example 1: Click Resource → Visit
```
User clicks resource on grid
  ↓
Frontend: handleResourceClick()
  ↓
POST /api/resource/visit
Body: {session_id, resource_id}
  ↓
Backend marks visited, adds reward
  ↓
Response: {position, level, totalReward, visitedResources}
  ↓
Frontend updates state & UI
  → Cell turns green
  → Level/Reward updates in header
```

### Example 2: Create Learning Summary
```
User fills summary form
  ↓
Click "Update My Position"
  ↓
POST /api/summary/create
Body: {session_id, title, summary, visited_resources: []}
  ↓
Backend calculates:
  • Strengths (learned topics)
  • Recommendations (next topics)
  • Confidence score
  • Polyline path
  ↓
Response: {summary, polyline}
  ↓
Frontend adds polyline to grid
  → Visible as colored line on grid
  → Can click "See polyline" for details
```

### Example 3: Start DQN
```
User clicks "Start DQN"
  ↓
POST /api/dqn-path
Body: {session_id, agent_position, visited_resource_ids}
  ↓
Backend finds best unvisited resources
  • Calculates score = reward - (distance * factor)
  • Creates optimal path
  ↓
Response: {path: [{x,y}...], finalResource, totalReward}
  ↓
Frontend displays red polyline on grid
  → Shows recommended learning path
  → Updates as user visits resources
```

---

## 💾 Data Structures

```
Resource
├─ id: string
├─ position: {x: 0-19, y: 0-19}
├─ type: book|video|quiz|assignment
├─ title: string
├─ difficulty: 1-5
└─ reward: 50-160

AgentState
├─ position: {x, y}
├─ level: 1-5
├─ totalReward: number
└─ visitedResources: string[]

LearningSummary
├─ totalResources: number
├─ visitedResources: number
├─ currentLevel: 1-5
├─ strengths: string[]
├─ recommendations: string[]
└─ nextOptimalResource: {x, y}

Polyline
├─ id: string
├─ name: string
├─ path: [{x, y}...]
├─ color: rgba(...)
├─ isActive: boolean
├─ confidence: 0-1
└─ summary?: string
```

---

## ⚙️ Setup & Run

```bash
# Terminal 1: Backend
cd backend
pip install -r requirements.txt
python app.py
→ Runs on http://localhost:5000
→ API on http://localhost:5000/api

# Terminal 2: Frontend  
npm install
npm run dev
→ Runs on http://localhost:5173
```

---

## ✅ Test Sequence

```
1. Backend running?
   GET http://localhost:5000/api/resources
   → Should see ~18 NLP topics in JSON

2. Frontend loads?
   Visit http://localhost:5173
   → Should see 20×20 grid + control panel

3. Resources visible?
   → Check grid has ~18 colored squares
   → Agent is red center square

4. Button: Click resource
   → Cell turns green
   → Reward increases in header

5. Button: Summarise My Learning
   → Enter title + summary
   → Click submit
   → Polyline appears on grid

6. Button: See polyline
   → Shows chart modal
   → Has axis labels, legend, line graph

7. Button: Polylines List
   → Lists all created polylines
   → Shows mini-charts for each

8. Button: Start DQN
   → Red path appears
   → Shows recommended unvisited resources
```

---

## 🐛 Troubleshooting

```
Issue: No resources on grid
Fix: Check backend running: python app.py
Fix: Check Excel file exists: backend/nlp/Advances in NLP.xlsx

Issue: Buttons don't work
Fix: Check console (F12): Are there errors?
Fix: Check Network tab: API requests failing?

Issue: Can't click resources
Fix: Make sure position is within grid (0-19)
Fix: Check grid cells are clickable (not disabled)

Issue: DQN shows no path
Fix: Make sure some resources visited first
Fix: Check agent position is valid
```

---

## 📊 API Response Examples

### GET /api/resources
```json
[
  {
    "id": "1",
    "position": {"x": 5, "y": 12},
    "type": "book",
    "title": "Pre training objectives",
    "visited": false,
    "difficulty": 2,
    "reward": 60
  }
]
```

### POST /api/summary/create
```json
{
  "summary": {
    "totalResources": 18,
    "visitedResources": 3,
    "currentLevel": 1,
    "strengths": ["Pre training objectives", "..."],
    "recommendations": ["Fine tuning LLM", "..."],
    "totalReward": 195
  },
  "polyline": {
    "id": "polyline_0",
    "name": "Week 1",
    "path": [{"x": 5, "y": 12}, {"x": 4, "y": 12}],
    "color": "rgba(120, 180, 200, 0.4)",
    "isActive": true,
    "confidence": 0.82
  }
}
```

### POST /api/dqn-path
```json
{
  "path": [{"x": 10, "y": 10}, {"x": 9, "y": 10}, {"x": 9, "y": 9}],
  "finalResource": {
    "id": "4",
    "position": {"x": 9, "y": 10},
    "type": "assignment",
    "title": "Fine tuning LLM",
    "reward": 80
  },
  "totalReward": 395,
  "pathLength": 3
}
```

---

## 📱 Feature Matrix

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Grid Display | ✅ | - | ✅ |
| Resource Click | ✅ | ✅ | ✅ |
| Agent Movement | ✅ | ✅ | ✅ |
| Summarize | ✅ | ✅ | ✅ |
| Polylines | ✅ | ✅ | ✅ |
| DQN Path | ✅ | ✅ | ✅ |
| Learning Data | ✅ | ✅ | ✅ |
| Charts | ✅ | - | ✅ |

---

## 📚 Documentation

| File | Content |
|------|---------|
| API_DOCUMENTATION.md | Every endpoint details |
| INTEGRATION_GUIDE.md | Full integration walkthrough |
| TESTING_CHECKLIST.md | Test scenarios and validation |
| TASKS.md | Task breakdown |
| This file | Quick reference |

---

## 🚀 Quick Commands

```bash
# Check backend API
curl http://localhost:5000/api/resources

# Start servers
# Terminal 1:
cd backend && python app.py

# Terminal 2:
npm run dev

# Check logs
# Backend: Terminal where python app.py runs
# Frontend: Browser DevTools Console (F12)

# Build frontend
npm run build

# Check TypeScript
npm run tsc --noEmit
```

---

## 🎓 Important Concepts

**Agent**: User's position on grid, gains level/reward when visiting resources

**Resource**: NLP topic at a grid position, can be book/video/quiz/assignment

**Polyline**: Visual path showing learning journey or recommendations

**DQN Path**: Machine learning recommendation of best next resources to learn

**Session**: User's current learning progress (stored in backend)

**Confidence**: How confident the system is about a recommendation (0-1)

---

## 🔐 Important Notes

1. **Session**: Default is "default", no user auth yet
2. **Data**: Lost on server restart (in-memory storage)
3. **Excel**: Loaded once on startup
4. **DQN**: Simple heuristic, not true deep Q-learning
5. **CORS**: Enabled for localhost development

---

## 📞 Need Help?

1. Check [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
2. Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
3. Run [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)
4. Check browser console (F12)
5. Check backend logs (terminal)

---

**Version**: 1.0
**Last Updated**: February 10, 2026
**Status**: ✅ Complete
