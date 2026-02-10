import json
import os
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(__file__), 'db.json')

def init_db():
    if not os.path.exists(DB_FILE):
        data = {
            "users": [],
            "learning_sessions": {},
            "polylines": {},
            "summaries": []
        }
        save_db(data)

def load_db():
    if not os.path.exists(DB_FILE):
        init_db()
    with open(DB_FILE, 'r') as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def get_session(session_id):
    db = load_db()
    if session_id not in db["learning_sessions"]:
        db["learning_sessions"][session_id] = {
            'position': {'x': 10, 'y': 10},
            'level': 1,
            'totalReward': 0,
            'visitedResources': []
        }
        save_db(db)
    return db["learning_sessions"][session_id]

def update_session(session_id, session_data):
    db = load_db()
    db["learning_sessions"][session_id] = session_data
    save_db(db)

def save_summary(summary_data):
    db = load_db()
    db["summaries"].append(summary_data)
    save_db(db)

def save_polyline(polyline_id, polyline_data):
    db = load_db()
    db["polylines"][polyline_id] = polyline_data
    save_db(db)

def get_polylines():
    db = load_db()
    return db["polylines"]
