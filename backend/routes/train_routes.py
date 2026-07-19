from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import traceback

from utils.session_manager import get_session_id, get_df
from ml_engine.model_trainer import train_and_evaluate, compare_models

train_router = APIRouter()

@train_router.post("/api/train")
async def train_model(request: Request):
    session_id = get_session_id(request)
    df, _ = get_df(session_id)
    if df is None:
        return JSONResponse({"error": "No dataset loaded"}, status_code=400)

    body = await request.json()
    target_col = body.get("targetColumn")
    algorithm = body.get("algorithm", "Random Forest")
    test_size = body.get("testSize", 0.2)
    task_type = body.get("taskType")

    if not target_col or target_col not in df.columns:
        return JSONResponse({"error": f"Invalid target column: {target_col}"}, status_code=400)

    try:
        result = train_and_evaluate(df, target_col, algorithm, test_size, task_type)
        return result
    except Exception as e:
        return JSONResponse({"error": str(e), "traceback": traceback.format_exc()}, status_code=400)

@train_router.post("/api/train/compare")
async def compare_all_models(request: Request):
    session_id = get_session_id(request)
    df, _ = get_df(session_id)
    if df is None:
        return JSONResponse({"error": "No dataset loaded"}, status_code=400)

    body = await request.json()
    target_col = body.get("targetColumn")
    test_size = body.get("testSize", 0.2)
    task_type = body.get("taskType")

    if not target_col or target_col not in df.columns:
        return JSONResponse({"error": f"Invalid target column: {target_col}"}, status_code=400)

    try:
        result = compare_models(df, target_col, test_size, task_type)
        return result
    except Exception as e:
        return JSONResponse({"error": str(e), "traceback": traceback.format_exc()}, status_code=400)
