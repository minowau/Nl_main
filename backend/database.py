"""PostgreSQL persistence for the learning platform.

The public functions mirror the old JSON store so the NLP routes can keep
their existing behavior while storage becomes transactional and user-scoped.
"""

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

import psycopg2
from psycopg2.extras import Json, RealDictCursor
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


def _database_url() -> str:
    return os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/nl_learning")


def _connect():
    return psycopg2.connect(_database_url())


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL DEFAULT '',
    identifier TEXT UNIQUE,
    password_hash TEXT,
    school_code TEXT NOT NULL DEFAULT '',
    auth_token TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    module TEXT NOT NULL UNIQUE,
    payload JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS learning_sessions (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS summaries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS summaries_user_created_idx ON summaries(user_id, created_at);
CREATE TABLE IF NOT EXISTS polylines (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS polylines_user_created_idx ON polylines(user_id, created_at);
CREATE TABLE IF NOT EXISTS bookmarks (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, resource_id)
);
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS lectures (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS youtube_links (
    module TEXT PRIMARY KEY,
    url TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS youtube_transcripts (
    module TEXT PRIMARY KEY,
    transcript TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS history_archive (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""


def _execute(sql, params=(), fetchone=False, fetchall=False):
    with _connect() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(sql, params)
            if fetchone:
                return cursor.fetchone()
            if fetchall:
                return cursor.fetchall()
            return None


def init_db():
    """Create the schema and import static/legacy data once."""
    _execute(SCHEMA)
    _execute("""INSERT INTO users (id, full_name, identifier, school_code)
               VALUES ('default', 'Legacy User', 'default', '')
               ON CONFLICT (id) DO NOTHING""")
    _seed_content()
    _migrate_legacy_json()


def _seed_content():
    links_path = DATA_DIR / "youtube_links.json"
    transcripts_path = DATA_DIR / "youtube_transcripts.json"
    resources_path = BASE_DIR / "nlp" / "nlp_resources.json"
    if links_path.exists():
        for module, url in json.loads(links_path.read_text(encoding="utf-8")).items():
            _execute("""INSERT INTO youtube_links (module, url) VALUES (%s, %s)
                       ON CONFLICT (module) DO UPDATE SET url = EXCLUDED.url""", (str(module), str(url)))
    if transcripts_path.exists():
        for module, transcript in json.loads(transcripts_path.read_text(encoding="utf-8")).items():
            _execute("""INSERT INTO youtube_transcripts (module, transcript) VALUES (%s, %s)
                       ON CONFLICT (module) DO UPDATE SET transcript = EXCLUDED.transcript""", (str(module).strip().lower(), str(transcript)))
    if resources_path.exists():
        for index, resource in enumerate(json.loads(resources_path.read_text(encoding="utf-8")), start=1):
            module = str(resource.get("module") or resource.get("name") or index)
            _execute("""INSERT INTO resources (id, module, payload) VALUES (%s, %s, %s)
                       ON CONFLICT (id) DO UPDATE SET module = EXCLUDED.module, payload = EXCLUDED.payload""", (str(resource.get("module_id", index)), module, Json(resource)))


def _migrate_legacy_json():
    """Import existing db.json records without duplicating rows."""
    legacy = None
    for path in (BASE_DIR / "db.json", DATA_DIR / "db.json"):
        if path.exists():
            try:
                legacy = json.loads(path.read_text(encoding="utf-8"))
                break
            except json.JSONDecodeError:
                continue
    if not legacy:
        return
    session = legacy.get("learning_sessions", {}).get("default")
    if session:
        update_session("default", session)
    for summary in legacy.get("summaries", []):
        save_summary(summary, "default")
    for polyline_id, polyline in legacy.get("polylines", {}).items():
        save_polyline(polyline_id, polyline, "default")
    for resource_id in legacy.get("bookmarks", {}).get("default", []):
        add_bookmark("default", str(resource_id))
    for note in legacy.get("notes", {}).get("default", []):
        add_note("default", note)
    for filename in ("history.json", "history_archive.json"):
        history_path = DATA_DIR / filename
        if history_path.exists():
            payload = json.loads(history_path.read_text(encoding="utf-8"))
            _execute("INSERT INTO history_archive (user_id, payload) SELECT %s, %s WHERE NOT EXISTS (SELECT 1 FROM history_archive WHERE user_id = %s AND payload = %s)", ("default", Json({"source": filename, "data": payload}), "default", Json({"source": filename, "data": payload})))


def reset_db():
    for table in ("notifications", "notes", "bookmarks", "polylines", "summaries", "history_archive", "learning_sessions"):
        _execute(f"DELETE FROM {table}")


def load_db(user_id="default") -> Dict[str, Any]:
    session = get_session(user_id)
    summaries = [dict(row["payload"]) for row in _execute("SELECT payload FROM summaries WHERE user_id = %s ORDER BY created_at", (user_id,), fetchall=True)]
    polylines = {row["id"]: dict(row["payload"]) for row in _execute("SELECT id, payload FROM polylines WHERE user_id = %s ORDER BY created_at", (user_id,), fetchall=True)}
    return {"learning_sessions": {user_id: session}, "summaries": summaries, "polylines": polylines}


def get_session(user_id="default"):
    row = _execute("SELECT payload FROM learning_sessions WHERE user_id = %s", (user_id,), fetchone=True)
    if row:
        return dict(row["payload"])
    session = {"position": {"x": 10, "y": 10}, "level": 1, "totalReward": 0, "visitedResources": [], "notifications": [{"id": "initial", "type": "info", "message": "Welcome back to the Intelligence Hub. Neural Sync complete.", "timestamp": int(datetime.now(tz=timezone.utc).timestamp() * 1000), "read": False}]}
    _execute("INSERT INTO learning_sessions (user_id, payload) VALUES (%s, %s) ON CONFLICT (user_id) DO NOTHING", (user_id, Json(session)))
    return session


def update_session(user_id, session_data):
    _execute("""INSERT INTO learning_sessions (user_id, payload, updated_at) VALUES (%s, %s, NOW())
               ON CONFLICT (user_id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()""", (user_id, Json(session_data)))


def save_summary(summary_data, user_id="default"):
    _execute("INSERT INTO summaries (id, user_id, payload) VALUES (%s, %s, %s) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload", (summary_data["id"], user_id, Json(summary_data)))


def save_polyline(polyline_id, polyline_data, user_id="default"):
    _execute("INSERT INTO polylines (id, user_id, payload) VALUES (%s, %s, %s) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload", (polyline_id, user_id, Json(polyline_data)))


def get_polylines(user_id="default"):
    return {row["id"]: dict(row["payload"]) for row in _execute("SELECT id, payload FROM polylines WHERE user_id = %s ORDER BY created_at", (user_id,), fetchall=True)}


def get_bookmarks(user_id):
    return [row["resource_id"] for row in _execute("SELECT resource_id FROM bookmarks WHERE user_id = %s ORDER BY created_at", (user_id,), fetchall=True)]


def add_bookmark(user_id, resource_id):
    _execute("INSERT INTO bookmarks (user_id, resource_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (user_id, resource_id))


def remove_bookmark(user_id, resource_id):
    _execute("DELETE FROM bookmarks WHERE user_id = %s AND resource_id = %s", (user_id, resource_id))


def get_notes(user_id):
    return [dict(row["payload"]) for row in _execute("SELECT payload FROM notes WHERE user_id = %s ORDER BY created_at", (user_id,), fetchall=True)]


def add_note(user_id, note_data):
    note = dict(note_data)
    note.setdefault("id", f"note_{uuid.uuid4().hex}")
    note.setdefault("createdAt", datetime.now(tz=timezone.utc).isoformat())
    _execute("INSERT INTO notes (id, user_id, payload) VALUES (%s, %s, %s) ON CONFLICT (id) DO NOTHING", (note["id"], user_id, Json(note)))
    return note


def get_lectures():
    return [dict(row["payload"]) for row in _execute("SELECT payload FROM lectures ORDER BY id", fetchall=True)]


def reset_session_data(user_id):
    for table in ("summaries", "polylines"):
        _execute(f"DELETE FROM {table} WHERE user_id = %s", (user_id,))
    _execute("INSERT INTO history_archive (user_id, payload) VALUES (%s, %s)", (user_id, Json({"reset_at": datetime.now(tz=timezone.utc).isoformat()})))
    session = {"position": {"x": 10, "y": 10}, "level": 1, "totalReward": 0, "visitedResources": [], "notifications": []}
    update_session(user_id, session)
    return session


def get_notifications(user_id):
    return [dict(row["payload"]) for row in _execute("SELECT payload FROM notifications WHERE user_id = %s ORDER BY created_at DESC", (user_id,), fetchall=True)]


def save_notification(user_id, notification):
    _execute("INSERT INTO notifications (id, user_id, payload) VALUES (%s, %s, %s)", (notification["id"], user_id, Json(notification)))


def create_user(full_name, identifier, password, school_code):
    user_id = str(uuid.uuid4())
    token = uuid.uuid4().hex
    _execute("INSERT INTO users (id, full_name, identifier, password_hash, school_code, auth_token) VALUES (%s, %s, %s, %s, %s, %s)", (user_id, full_name, identifier.lower(), generate_password_hash(password), school_code, token))
    get_session(user_id)
    return {"id": user_id, "fullName": full_name, "identifier": identifier, "schoolCode": school_code, "token": token}


def authenticate_user(identifier, password):
    row = _execute("SELECT id, full_name, identifier, school_code, password_hash FROM users WHERE identifier = %s", (identifier.lower(),), fetchone=True)
    if not row or not row["password_hash"] or not check_password_hash(row["password_hash"], password):
        return None
    token = uuid.uuid4().hex
    _execute("UPDATE users SET auth_token = %s WHERE id = %s", (token, row["id"]))
    return {"id": row["id"], "fullName": row["full_name"], "identifier": row["identifier"], "schoolCode": row["school_code"], "token": token}


def get_user_by_token(token):
    if not token:
        return None
    row = _execute("SELECT id, full_name, identifier, school_code FROM users WHERE auth_token = %s", (token,), fetchone=True)
    if not row:
        return None
    return {"id": row["id"], "fullName": row["full_name"], "identifier": row["identifier"], "schoolCode": row["school_code"]}
