import json
import os
from datetime import datetime

# HF Native Persistence: Check if /data volume is mounted
def get_db_file_path():
    # Primary choice: HF Persistent Storage Mount
    if os.path.exists('/data'):
        # Use a subdirectory to avoid permission issues at the root mount point
        test_path = '/data/db/db.json'
        try:
            os.makedirs(os.path.dirname(test_path), exist_ok=True)
            # Verify write access
            with open(os.path.join(os.path.dirname(test_path), '.write_test'), 'w') as f:
                f.write('test')
            os.remove(os.path.join(os.path.dirname(test_path), '.write_test'))
            print(f"[HF] Native Persistence: Verified. Storing data in {test_path}")
            return test_path
        except Exception as e:
            print(f"[WARN] HF Native Persistence: (/data) exists but is not writable: {e}")
    
    # Fallback: Local Storage
    local_path = os.path.join(os.path.dirname(__file__), 'data', 'db.json')
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    print(f"[LOCAL] Persistence: Active. Storing data in {local_path}")
    return local_path

DB_FILE = get_db_file_path()

# Ensure final data directory exists
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

def reset_session_data(session_id):
    """Resets all progress, rewards, polylines and summaries for a specific session."""
    db = load_db()
    
    # 1. Reset session state
    db["learning_sessions"][session_id] = {
        'position': {'x': 10, 'y': 10},
        'level': 0,
        'totalReward': 0,
        'visitedResources': [],
        'notifications': [
            { 
              'id': f'reset_{int(datetime.now().timestamp())}', 
              'type': 'info', 
              'message': 'Intelligence Journey restarted. System recalibrated.', 
              'timestamp': int(datetime.now().timestamp() * 1000), 
              'read': False 
            }
        ]
    }
    
    # 2. Clear polylines related to this session (including current_average)
    # We remove the average polyline and any session-specific polylines
    keys_to_remove = ['current_average']
    for k in list(db["polylines"].keys()):
        if f"_{session_id}_" in k or k.startswith(f"polyline_{session_id}"):
            keys_to_remove.append(k)
    
    for k in keys_to_remove:
        if k in db["polylines"]:
            del db["polylines"][k]
            
    # 3. Clear summaries for this session
    if "summaries" in db:
        db["summaries"] = [s for s in db["summaries"] if session_id not in s.get("id", "")]
        
    # 4. Clear bookmarks for this session
    if "bookmarks" in db and session_id in db["bookmarks"]:
        db["bookmarks"][session_id] = []
        
    save_db(db)
    return db["learning_sessions"][session_id]
