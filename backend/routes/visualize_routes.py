from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from utils.session_manager import get_session_id, get_df
from ml_engine.visualizer import generate_visualization

visualize_router = APIRouter()

@visualize_router.post("/api/visualize")
async def visualize(request: Request):
    session_id = get_session_id(request)
    df, _ = get_df(session_id)
    if df is None:
        return JSONResponse({"error": "No dataset loaded"}, status_code=400)

    body = await request.json()
    graph_type = body.get("graphType", "Histogram")
    x_column = body.get("xColumn")
    y_column = body.get("yColumn")

    if not x_column:
        return JSONResponse({"error": "X column is required"}, status_code=400)

    try:
        image_b64 = generate_visualization(df, graph_type, x_column, y_column)
        return {"image": image_b64, "graphType": graph_type}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)
