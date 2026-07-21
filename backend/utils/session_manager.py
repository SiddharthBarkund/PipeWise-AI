import uuid
from fastapi import Request

# In-memory data store (per session — for simplicity)
DATA_STORE = {}

def get_session_id(request: Request):
    """Get or create session ID from request header."""
    sid = request.headers.get("X-Session-Id")
    if not sid:
        sid = str(uuid.uuid4())
    return sid

def get_df(session_id):
    """Retrieve the dataframe for a session."""
    entry = DATA_STORE.get(session_id)
    if entry is None:
        return None, None
    return entry["df"], entry["filename"]

def set_df(session_id, df, filename):
    """Set the dataframe for a session."""
    DATA_STORE[session_id] = {"df": df, "filename": filename}
