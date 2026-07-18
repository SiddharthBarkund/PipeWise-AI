from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from utils.session_manager import get_session_id, get_df
from ml_engine.stats_engine import get_understand_data, get_insights

insights_router = APIRouter()

@insights_router.get("/api/understand")
async def understand_data(request: Request):
    session_id = get_session_id(request)
    df, filename = get_df(session_id)
    if df is None:
        return JSONResponse({"error": "No dataset loaded"}, status_code=400)

    data = get_understand_data(df)
    return {"filename": filename, **data}

@insights_router.get("/api/insights")
async def insights(request: Request):
    session_id = get_session_id(request)
    df, _ = get_df(session_id)
    if df is None:
        return JSONResponse({"error": "No dataset loaded"}, status_code=400)

    data = get_insights(df)
    return data
