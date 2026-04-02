# NLP Learning Grid - Quick Start Guide

## Project Structure

```
Nl_main/
├── backend/
│   ├── app.py                 # Main Flask application (simplified for NLP)
│   ├── nlp_api.py             # NLP Grid API endpoints ⭐ NEW
│   ├── requirements.txt       # Python dependencies
│   ├── nlp/
│   │   ├── Advances in NLP.xlsx    # NLP topics data source
│   │   └── ...
│   └── ...
├── src/
│   ├── App.tsx                # Main React component (updated)
│   ├── components/
│   │   ├── ControlPanel.tsx   # Learning controls with buttons
│   │   ├── GridVisualization.tsx   # Grid display
│   │   └── LearningRoadmap.tsx
│   ├── hooks/
│   │   └── useDQNSimulation.ts     # DQN logic (updated to use API)
│   ├── services/
│   │   └── nlpApi.ts              # API service layer ⭐ NEW
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── data/
│       └── mockData.ts        # Mock data (deprecated)
├── API_DOCUMENTATION.md       # Complete API reference
├── TASKS.md                   # Task checklist and overview
└── README.md
```

---

## Frontend Button to Backend Mapping

### Button 1: "Summarise My Learning"
```
Frontend: ControlPanel.tsx (Line 92)
  ↓
Action: Opens modal for title + summary input
  ↓
Click "Update My Position":
  ↓
Backend: POST /api/summary/create
  Body: {
    session_id, title, summary, visited_resources: [ids...]
  }
  ↓
Response: { summary: LearningSummary, polyline: Polyline }
  ↓
Updates: Learning data + adds polyline to grid
```

**Frontend Code Location**: [src/App.tsx](src/App.tsx#L72-L95)

**Related Files**:
- [nlpApi.ts#createLearningSummary](src/services/nlpApi.ts#L106)
- [ControlPanel.tsx#handleSummarySubmit](src/components/ControlPanel.tsx#L30)

---

### Button 2: "See polyline"
```
Frontend: ControlPanel.tsx (Line 97)
  ↓
Action: Get active polyline
  ↓
Backend: GET /api/polylines/{polylineId}
  ↓
Response: Polyline with path, confidence, summary
  ↓
Displays: Modal with SVG chart visualization
```

**Frontend Code**: [src/App.tsx#handleShowPolyline](src/App.tsx#L151)

**Backend**: [nlp_api.py#get_polyline](backend/nlp_api.py#L179)

---

### Button 3: "Polylines List"
```
Frontend: ControlPanel.tsx (Line 101)
  ↓
Action: Opens modal listing all polylines
  ↓
Backend: GET /api/polylines
  ↓
Response: Polyline[]
  ↓
Displays: List with mini-charts for each polyline
```

**Frontend Code**: [src/components/ControlPanel.tsx#L288-L351](src/components/ControlPanel.tsx)

**Backend**: [nlp_api.py#get_polylines](backend/nlp_api.py#L167)

---

### Button 4: "Start DQN" / "Stop DQN"
```
Frontend: ControlPanel.tsx (Line 106)
  ↓
Action: Toggle DQN simulation
  ↓
Backend: POST /api/dqn-path
  Body: {
    session_id, agent_position, visited_resource_ids: [ids...]
  }
  ↓
Response: { path: Positions[], finalResource, totalReward }
  ↓
Displays: Red polyline on grid showing optimal path
```

**Frontend Code**: [src/App.tsx#handleToggleSimulation](src/App.tsx#L156-L180)

**Backend**: [nlp_api.py#generate_dqn_path](backend/nlp_api.py#L199)

---

### Button 5: "Refresh DQN Path" (Grid)
```
Frontend: GridVisualization.tsx
  ↓
Action: User clicks refresh button while DQN running
  ↓
Backend: POST /api/dqn-path (same as Button 4)
  ↓
Updates: DQN polyline with new optimal path
```

---

## Resource Grid Interaction

### Clicking a Resource Cell
```
Frontend: GridVisualization.tsx (handleCellClick)
  ↓
If resource at cell:
  ├─ Mark visited in state
  ├─ Call handleResourceClick
  │  ↓
  │  Backend: POST /api/resource/visit
  │    Body: { session_id, resource_id }
  │    Response: Updated AgentState
  │
  └─ Update learning data
  
If empty cell:
  └─ Move agent (local state only)
```

**Frontend**: [src/components/GridVisualization.tsx#handleCellClick](src/components/GridVisualization.tsx#L46-L60)

**Backend**: [nlp_api.py#visit_resource](backend/nlp_api.py#L118)

---

## Data Flow Architecture

```
Frontend (React) ←→ API Service (nlpApi.ts) ←→ Backend (Flask)
                                                    ↓
                                            nlp_api.py routes
                                                    ↓
                                            Excel: Advances in NLP.xlsx
```

### App Initialization Sequence
```
1. App.tsx loads
2. useEffect → nlpApi.getResources()
3. GET /api/resources ← Backend loads Excel
4. Resources displayed on grid
5. User interacts → Buttons → API calls → Backend updates
6. Frontend syncs state from responses
```

---

## API Service Usage Pattern

### In React Components/Hooks
```typescript
import { nlpApi } from '../services/nlpApi';

// Get resources
const resources = await nlpApi.getResources();

// Create summary
const { summary, polyline } = await nlpApi.createLearnningSummary(
  'default', 
  'Week 1', 
  'Completed basics',
  visitedIds
);

// Generate DQN path
const dqn = await nlpApi.generateDQNPath(
  'default',
  agentPosition,
  visitedIds
);
```

---

## Backend Routes Summary

**All routes prefixed with `/api/`**

### Resources
- `GET /resources` - List all
- `GET /resources/{id}` - Get one

### Agent
- `GET /agent` - Get state
- `POST /agent/move` - Move

### Interactions
- `POST /resource/visit` - Mark visited

### Summaries
- `POST /summary/create` - Create summary
- `GET /learning-data` - Get metrics

### Polylines
- `GET /polylines` - List all
- `GET /polylines/{id}` - Get one
- `POST /polylines/{id}/toggle` - Toggle visibility

### DQN
- `POST /dqn-path` - Generate path

---

## Setup & Running

### Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run Flask server
python app.py

# Server starts at http://localhost:5000
# API available at http://localhost:5000/api
```

### Frontend Setup
```bash
# In root directory
npm install

# Start development server
npm run dev

# Application opens at http://localhost:5173
```

### Environment Variables (Optional)
Create `.env` in frontend:
```
VITE_API_BASE=http://localhost:5000/api
```

Then update `nlpApi.ts`:
```typescript
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
```

---

## Key Files Modified

| File | Changes | Purpose |
|------|---------|---------|
| `backend/nlp_api.py` | ✨ NEW | All API endpoints |
| `src/services/nlpApi.ts` | ✨ NEW | API client service |
| `src/App.tsx` | Updated | Load from API, sync state |
| `src/hooks/useDQNSimulation.ts` | Updated | Use backend API instead of mock |
| `backend/app.py` | Updated | Simplified, import nlp_api |

---

## Testing the Integration

### Test 1: Load Resources
1. Start backend: `python app.py`
2. Visit `http://localhost:5000/api/resources`
3. Should see JSON array of resources from Excel

### Test 2: Full Frontend Flow
1. Start backend
2. Start frontend: `npm run dev`
3. Grid should display with ~18 resources
4. Click a resource → should mark visited
5. Click "Summarise My Learning" → create summary
6. Summary polyline appears on grid

### Test 3: DQN Path
1. Click "Start DQN"
2. Red polyline should appear showing optimal path
3. Shows resources not yet visited
4. "Refresh DQN Path" updates recommendation

---

## Common Issues & Solutions

### Issue: "Failed to load resources"
**Solution**: Make sure backend is running on port 5000
```bash
cd backend
python app.py
```

### Issue: CORS errors
**Solution**: Backend has Flask-CORS enabled in init. Check `app.py` imports

### Issue: Excel file not found
**Solution**: Check path is correct relative to backend/
```python
nlp_excel_path = os.path.join(os.path.dirname(__file__), 'nlp', 'Advances in NLP.xlsx')
```

### Issue: Resources show but can't click them
**Solution**: Check grid coordinates match 0-19 range

---

## Next Steps

1. ✅ Complete: Backend API endpoints
2. ✅ Complete: Frontend service layer
3. ✅ Complete: Button-to-backend mapping
4. 🔄 Test full integration end-to-end
5. 🔄 Verify Excel data loads correctly
6. ⏳ Add error handling/validation
7. ⏳ Add loading states/spinners
8. ⏳ Performance optimization

---

## Documentation Files

- **API_DOCUMENTATION.md** - Complete endpoint reference
- **TASKS.md** - Detailed task breakdown
- **This file** - Quick reference guide

---

## Questions?

Check:
1. [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) - Endpoint details
2. Frontend components - Button implementations
3. [nlpApi.ts](src/services/nlpApi.ts) - API service methods
4. Backend [nlp_api.py](backend/nlp_api.py) - Route implementations
