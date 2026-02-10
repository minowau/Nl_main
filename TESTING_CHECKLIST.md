# Frontend-Backend Integration Testing Checklist

## Pre-Testing Setup

### Backend Preparation
- [ ] Python 3.8+ installed
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] Flask app can start without errors
- [ ] Excel file exists: `backend/nlp/Advances in NLP.xlsx`
- [ ] Port 5000 is available

### Frontend Preparation
- [ ] Node.js 16+ installed
- [ ] Dependencies installed: `npm install`
- [ ] TypeScript compiles without errors
- [ ] Port 5173 is available (or configured)

---

## Test 1: Backend API Availability

### Setup
```bash
cd backend
python app.py
```

### Tests

1. **Check Backend is Running**
   - Open browser: `http://localhost:5000`
   - Expected: Flask running (or blank page, that's OK)
   - Status: ✓ Pass / ✗ Fail

2. **Test Resource Endpoint**
   - Open: `http://localhost:5000/api/resources`
   - Expected: JSON array with resources
   - Check: `id`, `position`, `type`, `title`, `visited`, `difficulty`, `reward`
   - Sample:
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
   - Status: ✓ Pass / ✗ Fail

3. **Test Agent State Endpoint**
   - GET: `http://localhost:5000/api/agent?session_id=default`
   - Expected: 
     ```json
     {
       "position": {"x": 10, "y": 10},
       "level": 1,
       "totalReward": 0,
       "visitedResources": []
     }
     ```
   - Status: ✓ Pass / ✗ Fail

---

## Test 2: Frontend Loading & Grid Display

### Setup
```bash
# Terminal 1: Keep backend running
cd backend && python app.py

# Terminal 2: Start frontend
npm run dev
```

### Tests

1. **Frontend Loads**
   - Open: `http://localhost:5173`
   - Expected: Grid-based interface loads
   - Status: ✓ Pass / ✗ Fail

2. **Resources Load on Grid**
   - Check browser console (F12) for errors
   - Expected: ~18 resources visible as colored squares on 20x20 grid
   - Grid cells: 5×5 or 7×7 based on screen size
   - Status: ✓ Pass / ✗ Fail

3. **Agent Visible**
   - Expected: Red circle/square in center area of grid
   - Can differentiate from resources
   - Status: ✓ Pass / ✗ Fail

4. **Control Panel Visible**
   - Right side: "My Learning Map" panel
   - Expected buttons:
     - [ ] "Summarise My Learning"
     - [ ] "See polyline"
     - [ ] "Polylines List"
     - [ ] "Start DQN"
   - Status: ✓ Pass / ✗ Fail

---

## Test 3: Resource Interaction

### Test 3A: Click Resource
1. **Identify a resource cell** on the grid (not center)
   - Has an icon (book, video, etc.)
   - Type: In mockData: Resource 1 is at (5, 12)

2. **Click the resource**
   - Check browser console for errors
   - Expected results:
     - [ ] Cell changes color (green/visited)
     - [ ] Agent stays at current position
     - [ ] Learning path updates (right panel)
     - [ ] Visited counter increases
   - Status: ✓ Pass / ✗ Fail

3. **Check Backend Sync** (Optional)
   - Open Dev Tools → Network tab
   - Expected: POST to `/api/resource/visit` when resource clicked
   - Response includes updated agent state
   - Status: ✓ Pass / ✗ Fail

### Test 3B: Click Empty Cell
1. **Click an empty grid cell** (no resource)
2. **Expected results**:
   - [ ] Agent moves to that cell
   - [ ] Agent shows at new position
   - [ ] No errors in console
3. **Status**: ✓ Pass / ✗ Fail

---

## Test 4: Learning Summary Button

### Test 4A: Open Summary Modal
1. **Click "Summarise My Learning"** button (right panel)
2. **Expected**:
   - [ ] Modal opens
   - [ ] Two input fields visible: "Title" and "Summary"
   - [ ] Modal has cancel (X) button
   - Status: ✓ Pass / ✗ Fail

### Test 4B: Submit Summary
1. **Fill in fields**:
   - Title: "Week 1 Learning"
   - Summary: "Completed intro to NLP topics"

2. **Click "Update My Position"** button

3. **Expected results**:
   - [ ] Modal closes
   - [ ] Button shows "Processing..." during request
   - [ ] No errors in console
   - [ ] Polyline appears on grid
   - [ ] "Polylines List" now has content
   - Status: ✓ Pass / ✗ Fail

4. **Check Network (Optional)**
   - Network tab should show POST to `/api/summary/create`
   - Request body includes visited resources
   - Response includes summary and polyline objects

---

## Test 5: Polyline Display

### Test 5A: See Polyline Button
1. **Create a learning summary** (Test 4)
2. **Click "See polyline"** button
3. **Expected**:
   - [ ] Modal opens showing polyline details
   - [ ] SVG chart visible with grid and line graph
   - [ ] Axis labels show (topics 1-12)
   - [ ] Legend at bottom showing topics
   - Status: ✓ Pass / ✗ Fail

### Test 5B: Polylines List
1. **Click "Polylines List"** button
2. **Expected**:
   - [ ] Modal shows list of all polylines
   - [ ] Each polyline has mini-chart
   - [ ] "View Details" button per polyline
   - [ ] Multiple polylines shown if multiple summaries created
   - Status: ✓ Pass / ✗ Fail

---

## Test 6: DQN Path Generation

### Test 6A: Start DQN
1. **Click "Start DQN"** button (changes to "Stop DQN")
2. **Expected**:
   - [ ] Button text changes to "Stop DQN"
   - [ ] Red polyline appears on grid
   - [ ] Path shows unvisited resources
   - [ ] No errors in console
   - Status: ✓ Pass / ✗ Fail

3. **Check Network (Optional)**
   - Should see POST to `/api/dqn-path`
   - Request includes agent position and visited resources
   - Response has optimal path

### Test 6B: Stop DQN
1. **Click "Stop DQN"** button
2. **Expected**:
   - [ ] Button text changes back to "Start DQN"
   - [ ] Red polyline disappears from grid
   - Status: ✓ Pass / ✗ Fail

### Test 6C: Refresh DQN Path
1. **With DQN running**, visit another resource
2. **Expected**:
   - [ ] Red polyline updates
   - [ ] Shows new optimal path excluding newly visited resource
   - Status: ✓ Pass / ✗ Fail

---

## Test 7: Complete User Flow

### Scenario: Full Learning Session
```
1. Start both servers
2. Load grid - verify ~18 resources
3. Click 3 different resources
   - Verify color changes to green
   - Verify level/reward updates in header
4. Click "Summarise My Learning"
   - Enter title and summary
   - Click submit
   - Verify polyline appears
5. Click "See polyline"
   - View polyline details
6. Click "Polylines List"
   - View all polylines with charts
7. Click "Start DQN"
   - Red path appears
8. Visit one more resource
   - Verify DQN path updates
9. Click "Stop DQN"
   - Red path disappears
```

**Overall Status**: ✓ Pass / ✗ Fail

**Issues Found**:
```
(List any issues encountered)
```

---

## Test 8: Error Handling

### Test 8A: Backend Down
1. **Stop backend server**
2. **Try to click resource**
3. **Expected**: Graceful error in console (not crash)
4. **Status**: ✓ Pass / ✗ Fail

### Test 8B: Invalid Input
1. **Click "Summarise My Learning"**
2. **Leave title empty, add summary**
3. **Click "Update My Position"**
4. **Expected**: 
   - [ ] Submit button disabled or shows error
   - [ ] Modal stays open
   - [ ] No request sent
5. **Status**: ✓ Pass / ✗ Fail

### Test 8C: Network Latency
1. **Slow down network** (DevTools → Network → Throttling)
2. **Click "Summarise My Learning"** and submit
3. **Expected**:
   - [ ] Button shows loading state
   - [ ] Can't double-submit
   - [ ] Eventually completes
4. **Status**: ✓ Pass / ✗ Fail

---

## Browser Console Checks

After each major action, verify:

- [ ] No red errors in console
- [ ] No CORS warnings
- [ ] Network requests show 200 status (success)
- [ ] No unhandled promise rejections

---

## Performance Checks

### Resource Loading
- [ ] Grid loads in < 2 seconds
- [ ] Resources visible immediately
- [ ] Clicking resource responds < 500ms

### Summary Creation
- [ ] Processing takes 1-3 seconds
- [ ] Shows "Processing..." during request
- [ ] UI responsive after completion

### DQN Generation
- [ ] Red path appears < 1 second
- [ ] Path is reasonable (doesn't cross grid bounds)

---

## Data Validation

### Resources
- [ ] All resources have position (x: 0-19, y: 0-19)
- [ ] All have type: book|video|quiz|assignment
- [ ] Difficulty: 1-5
- [ ] Reward: 50-160

### Agent State
- [ ] Position always within bounds
- [ ] Level increases with visited resources
- [ ] Reward accumulates correctly
- [ ] Visited resources array grows

### Learning Data
- [ ] Strengths list only includes visited resources
- [ ] Recommendations excludes visited resources
- [ ] Next optimal resource is unvisited
- [ ] Current level matches visited count

---

## Final Checklist

### Critical (Must Pass)
- [ ] Backend serves API on port 5000
- [ ] Frontend loads on port 5173
- [ ] Resources load from Excel
- [ ] Can click and visit resources
- [ ] Learning summary creates polyline
- [ ] DQN generates optimal path

### Important (Should Pass)
- [ ] All 4 buttons work correctly
- [ ] Grid updates reflect changes
- [ ] No console errors
- [ ] Network requests succeed

### Nice to Have
- [ ] Good loading UX (spinners)
- [ ] Responsive layout on different screen sizes
- [ ] Smooth animations
- [ ] Helpful error messages

---

## Sign-Off

**Tester**: ________________
**Date**: ________________
**Backend Version**: ________________
**Frontend Version**: ________________

**Overall Result**: ✓ PASS / ✗ FAIL

**Critical Issues to Fix**:
```
1. 
2. 
3. 
```

**Notes**:
```


```

---

## Rollback Plan (If Needed)

If integration fails:

1. Check backend is accessible: `http://localhost:5000/api/resources`
2. Check frontend imports nlpApi: `grep "nlpApi" src/**/*.tsx`
3. Verify nlp_api.py exists: `ls backend/nlp_api.py`
4. Check Excel file path: `ls backend/nlp/Advances*`
5. Review console errors for clues
6. Check API_DOCUMENTATION.md for endpoint details

---

## Success Criteria Met When:

✅ All buttons functional
✅ Resources load from backend
✅ Learning summaries create polylines
✅ DQN generates optimal paths
✅ No critical errors in console
✅ Full user flow completes without issues

---

**Testing Template Complete!**
Use this checklist for thorough integration validation.
