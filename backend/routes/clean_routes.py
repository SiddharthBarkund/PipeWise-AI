from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from utils.session_manager import get_session_id, get_df, set_df
from ml_engine.data_cleaner import get_clean_info, apply_cleaning

clean_router = APIRouter()

@clean_router.get("/api/clean/info")
async def clean_info(request: Request):
    session_id = get_session_id(request)
    df, _ = get_df(session_id)
    if df is None:
        return JSONResponse({"error": "No dataset loaded"}, status_code=400)

    info = get_clean_info(df)
    return info

@clean_router.post("/api/clean/apply")
async def clean_apply(request: Request):
    session_id = get_session_id(request)
    df, filename = get_df(session_id)
    if df is None:
        return JSONResponse({"error": "No dataset loaded"}, status_code=400)

    body = await request.json()
    action = body.get("action", "")
    column = body.get("column")
    fill_value = body.get("fillValue")
    strategy = body.get("strategy", "mean")

    try:
        df, original_shape = apply_cleaning(df, action, column, fill_value, strategy)
        set_df(session_id, df, filename)

        return {
            "message": f"Applied '{action}' successfully",
            "originalShape": {"rows": int(original_shape[0]), "columns": int(original_shape[1])},
            "newShape": {"rows": int(df.shape[0]), "columns": int(df.shape[1])},
            "totalMissing": int(df.isnull().sum().sum()),
        }
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)
