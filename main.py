from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, Query
from pydantic import BaseModel
import torch
import json
import numpy as np
import os
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import uuid
import random

# --- Models ---

class GridPosition(BaseModel):
    x: int
    y: int

class Resource(BaseModel):
    id: str
    position: GridPosition
    type: str  # 'book', 'quiz', 'video', 'assignment'
    title: str
    visited: bool
    difficulty: int
    reward: int
    url: Optional[str] = None
    description: Optional[str] = None

class Agent(BaseModel):
    position: GridPosition
    level: int
    totalReward: int
    visitedResources: List[str]

class Polyline(BaseModel):
    id: str
    name: str
    path: List[GridPosition]
    color: str
    isActive: bool
    confidence: float
    summary: Optional[str] = None

# Request Models
class MoveAgentRequest(BaseModel):
    session_id: str
    position: GridPosition

class VisitResourceRequest(BaseModel):
    session_id: str
    resource_id: str

class CreateSummaryRequest(BaseModel):
    session_id: str
    title: str
    summary: str
    visited_resources: List[str]

class TogglePolylineRequest(BaseModel):
    isActive: bool

class DQNPathRequest(BaseModel):
    session_id: str
    agent_position: GridPosition
    visited_resource_ids: List[str]

# Response Models
class LearningSummaryResponse(BaseModel):
    summary: Any
    polyline: Polyline

class LearningDataResponse(BaseModel):
    totalResources: int
    visitedResources: int
    currentLevel: int
    strengths: List[str]
    recommendations: List[str]
    nextOptimalResource: Optional[GridPosition]
    totalReward: int

class DQNPathResponse(BaseModel):
    path: List[GridPosition]
    finalResource: Optional[Resource]
    totalReward: int
    pathLength: int

# --- Application Setup ---

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Loading & Processing ---

SCALE = 200

def load_and_process_resources():
    json_path = os.path.join(os.path.dirname(__file__), "extracted_data.json")
    if not os.path.exists(json_path):
        print(f"Warning: {json_path} not found.")
        return [], {}, 20, 20

    with open(json_path, "r") as f:
        extracted_data = json.load(f)

    resource_cells = []
    resource_names = []
    
    # Initial scaling
    for name, data in extracted_data.items():
        x = int(float(data['x_coordinate']) * SCALE)
        y = int(float(data['y_coordinate']) * SCALE)
        resource_cells.append((x, y))
        resource_names.append(name)

    if not resource_cells:
        return [], {}, 20, 20

    min_x = min(x for x, y in resource_cells)
    min_y = min(y for x, y in resource_cells)
    
    # Normalize
    adjusted_resources = [[x - min_x, y - min_y] for x, y in resource_cells]

    # Duplicate Handling (Smart Offsetting)
    from collections import defaultdict
    coord_groups = defaultdict(list)
    for idx, (x_adj, y_adj) in enumerate(adjusted_resources):
        coord_groups[(x_adj, y_adj)].append((resource_names[idx], y_adj, idx))

    for coord in coord_groups:
        coord_groups[coord].sort(key=lambda item: item[1])

    final_resources_list = []
    
    for coord, resources_at_coord in coord_groups.items():
        x_base, y_base = coord
        
        if len(resources_at_coord) == 1:
            name = resources_at_coord[0][0]
            final_resources_list.append({'name': name, 'x': x_base, 'y': y_base})
        else:
            for offset_idx, (name, y_val, orig_idx) in enumerate(resources_at_coord):
                if offset_idx == 0:
                    final_resources_list.append({'name': name, 'x': x_base, 'y': y_base})
                else:
                    offset_x = x_base + 1 if offset_idx % 2 == 1 else x_base
                    offset_y = y_base - 1 if offset_idx % 2 == 1 else y_base + 1
                    final_resources_list.append({'name': name, 'x': offset_x, 'y': offset_y})

    max_x = max(r['x'] for r in final_resources_list)
    max_y = max(r['y'] for r in final_resources_list)
    
    # Mirroring (Flip Y)
    grid_h = max(20, max_y + 1)
    
    processed_resources = []
    types = ['book', 'video', 'quiz', 'assignment']
    resource_map = {}
    
    for r in final_resources_list:
        mirrored_y = (grid_h - 1) - r['y']
        
        res_id = str(len(processed_resources) + 1)
        res_type = types[len(processed_resources) % len(types)]
        difficulty = (len(processed_resources) % 5) + 1
        reward = 50 + (difficulty * 10)
        
        processed_resources.append(Resource(
            id=res_id,
            position=GridPosition(x=r['x'], y=mirrored_y),
            type=res_type,
            title=r['name'],
            visited=False,
            difficulty=difficulty,
            reward=reward,
            description=f"Learn about {r['name']}",
            url=f"https://example.com/{res_id}"
        ))
        resource_map[f"{r['x']},{mirrored_y}"] = r['name']

    return processed_resources, resource_map, max(20, max_x + 1), grid_h

RESOURCES, RESOURCE_MAP, GRID_WIDTH, GRID_HEIGHT = load_and_process_resources()

# --- State Management ---

AGENT_STATE = Agent(
    position=GridPosition(x=0, y=0),
    level=1,
    totalReward=0,
    visitedResources=[]
)

POLYLINES: List[Polyline] = []
SIMULATION_RUNNING = False

# --- Endpoints ---

@app.get("/api/resources", response_model=List[Resource])
def get_resources():
    return RESOURCES

@app.get("/api/resources/{resource_id}", response_model=Resource)
def get_resource(resource_id: str):
    res = next((r for r in RESOURCES if r.id == resource_id), None)
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    return res

@app.get("/api/agent", response_model=Agent)
def get_agent(session_id: str = Query("default")):
    return AGENT_STATE

@app.post("/api/agent/move", response_model=Agent)
def move_agent(req: MoveAgentRequest):
    AGENT_STATE.position = req.position
    
    # Check for resource visit (implicit)
    for res in RESOURCES:
        if res.position.x == req.position.x and res.position.y == req.position.y:
            if res.id not in AGENT_STATE.visitedResources:
                AGENT_STATE.visitedResources.append(res.id)
                res.visited = True
                AGENT_STATE.totalReward += res.reward
                AGENT_STATE.level = 1 + (len(AGENT_STATE.visitedResources) // 3)
    
    return AGENT_STATE

@app.post("/api/resource/visit", response_model=Agent)
def visit_resource(req: VisitResourceRequest):
    if req.resource_id not in AGENT_STATE.visitedResources:
        res = next((r for r in RESOURCES if r.id == req.resource_id), None)
        if res:
            AGENT_STATE.visitedResources.append(req.resource_id)
            res.visited = True
            AGENT_STATE.totalReward += res.reward
            AGENT_STATE.level = 1 + (len(AGENT_STATE.visitedResources) // 3)
    return AGENT_STATE

@app.post("/api/summary/create", response_model=LearningSummaryResponse)
def create_learning_summary(req: CreateSummaryRequest):
    # Create a polyline representing the learning path
    visited_objs = [r for r in RESOURCES if r.id in req.visited_resources]
    # Sort by visit order? Assuming req.visited_resources is ordered
    # Actually AGENT_STATE.visitedResources tracks order better if appended sequentially
    
    # Just use current resources positions
    path = [r.position for r in visited_objs]
    
    new_polyline = Polyline(
        id=str(uuid.uuid4()),
        name=req.title,
        path=path,
        color="rgba(59, 130, 246, 0.6)",
        isActive=True,
        confidence=0.9,
        summary=req.summary
    )
    POLYLINES.append(new_polyline)
    
    return LearningSummaryResponse(
        summary={"title": req.title, "content": req.summary},
        polyline=new_polyline
    )

@app.get("/api/polylines", response_model=List[Polyline])
def get_polylines():
    return POLYLINES

@app.get("/api/polylines/{polyline_id}", response_model=Polyline)
def get_polyline(polyline_id: str):
    pl = next((p for p in POLYLINES if p.id == polyline_id), None)
    if not pl:
        raise HTTPException(status_code=404, detail="Polyline not found")
    return pl

@app.post("/api/polylines/{polyline_id}/toggle", response_model=Polyline)
def toggle_polyline(polyline_id: str, req: TogglePolylineRequest):
    pl = next((p for p in POLYLINES if p.id == polyline_id), None)
    if not pl:
        raise HTTPException(status_code=404, detail="Polyline not found")
    pl.isActive = req.isActive
    return pl

@app.post("/api/dqn-path", response_model=DQNPathResponse)
def generate_dqn_path(req: DQNPathRequest):
    current_pos = req.agent_position
    path = [current_pos]
    
    # Simple heuristic: find nearest unvisited resource
    unvisited = [r for r in RESOURCES if r.id not in req.visited_resource_ids]
    
    final_res = None
    if unvisited:
        # Find closest
        target = min(unvisited, key=lambda r: abs(r.position.x - current_pos.x) + abs(r.position.y - current_pos.y))
        final_res = target
        
        # Generate simple path (Manhattan)
        curr_x, curr_y = current_pos.x, current_pos.y
        tgt_x, tgt_y = target.position.x, target.position.y
        
        # Basic interpolation (max 10 steps)
        steps = 0
        while (curr_x != tgt_x or curr_y != tgt_y) and steps < 10:
            if curr_x < tgt_x: curr_x += 1
            elif curr_x > tgt_x: curr_x -= 1
            
            if curr_y < tgt_y: curr_y += 1
            elif curr_y > tgt_y: curr_y -= 1
            
            path.append(GridPosition(x=curr_x, y=curr_y))
            steps += 1
            
    return DQNPathResponse(
        path=path,
        finalResource=final_res,
        totalReward=100, # Mock
        pathLength=len(path)
    )

@app.get("/api/learning-data", response_model=LearningDataResponse)
def get_learning_data(session_id: str = Query("default")):
    unvisited = [r for r in RESOURCES if not r.visited]
    next_res = unvisited[0].position if unvisited else None
    
    return LearningDataResponse(
        totalResources=len(RESOURCES),
        visitedResources=len(AGENT_STATE.visitedResources),
        currentLevel=AGENT_STATE.level,
        strengths=["NLP Concepts", "Deep Learning"],
        recommendations=["Practice Transformers", "Review Attention Mechanisms"],
        nextOptimalResource=next_res,
        totalReward=AGENT_STATE.totalReward
    )
