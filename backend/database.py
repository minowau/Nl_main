import json
import os
from datetime import datetime

# HF Native Persistence: Check if /data volume is mounted
IF_HF_PERSISTENT = os.path.exists('/data')
if IF_HF_PERSISTENT:
    DB_FILE = '/data/db.json'
    print(f"📡 HF Native Persistence: Active. Storing data in {DB_FILE}")
else:
    DB_FILE = os.path.join(os.path.dirname(__file__), 'data', 'db.json')
    print(f"💻 Local Persistence: Active. Storing data in {DB_FILE}")

# Ensure data directory exists
os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)

def init_db():
    if not os.path.exists(DB_FILE):
        data = {
            "users": [],
            "learning_sessions": {},
            "polylines": {},
            "summaries": [],
            "bookmarks": {},  # session_id -> list of resource_ids
            "notes": {},      # session_id -> list of note objects
            "lectures": []    # list of lecture objects
        }
        save_db(data)

def reset_db():
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
    init_db()

def load_db():
    if not os.path.exists(DB_FILE):
        init_db()
    
    try:
        with open(DB_FILE, 'r') as f:
            content = f.read().strip()
            if not content:
                init_db()
                with open(DB_FILE, 'r') as f2:
                    db = json.load(f2)
            else:
                db = json.loads(content)
                
            if "bookmarks" not in db:
                db["bookmarks"] = {}
                save_db(db)
            return db
    except (json.JSONDecodeError, FileNotFoundError):
        init_db()
        with open(DB_FILE, 'r') as f:
            return json.load(f)

def save_db(data):
    # Ensure directory exists (in case /data was just mounted)
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def get_session(session_id):
    db = load_db()
    if session_id not in db["learning_sessions"]:
        db["learning_sessions"][session_id] = {
            'position': {'x': 10, 'y': 10},
            'level': 0,
            'totalReward': 0,
            'visitedResources': [],
            'notifications': [
                { 
                  'id': 'initial', 
                  'type': 'info', 
                  'message': 'Welcome back to the Intelligence Hub. Neural Sync complete.', 
                  'timestamp': int(datetime.now().timestamp() * 1000), 
                  'read': False 
                }
            ]
        }
        save_db(db)
    return db["learning_sessions"][session_id]

def update_session(session_id, session_data):
    db = load_db()
    db["learning_sessions"][session_id] = session_data
    save_db(db)

def save_summary(summary_data):
    db = load_db()
    if "summaries" not in db:
        db["summaries"] = []
    db["summaries"].append(summary_data)
    save_db(db)

def save_polyline(polyline_id, polyline_data):
    db = load_db()
    db["polylines"][polyline_id] = polyline_data
    save_db(db)

def get_polylines():
    db = load_db()
    return db["polylines"]

def get_bookmarks(session_id):
    db = load_db()
    return db["bookmarks"].get(session_id, [])

def add_bookmark(session_id, resource_id):
    db = load_db()
    if session_id not in db["bookmarks"]:
        db["bookmarks"][session_id] = []
    if resource_id not in db["bookmarks"][session_id]:
        db["bookmarks"][session_id].append(resource_id)
        save_db(db)

def remove_bookmark(session_id, resource_id):
    db = load_db()
    if session_id in db["bookmarks"] and resource_id in db["bookmarks"][session_id]:
        db["bookmarks"][session_id].remove(resource_id)
        save_db(db)

def get_notes(session_id):
    db = load_db()
    if "notes" not in db or isinstance(db["notes"], list):
        db["notes"] = {}
        save_db(db)
    return db["notes"].get(session_id, [])

def add_note(session_id, note_data):
    db = load_db()
    if "notes" not in db or isinstance(db["notes"], list):
        db["notes"] = {}
    if session_id not in db["notes"]:
        db["notes"][session_id] = []
    
    # Simple ID generation if not provided
    if "id" not in note_data:
        note_data["id"] = f"note_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    if "createdAt" not in note_data:
        note_data["createdAt"] = datetime.now().isoformat()
        
    db["notes"][session_id].append(note_data)
    save_db(db)
    return note_data

def get_lectures():
    db = load_db()
    return db.get("lectures", [])
