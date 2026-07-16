from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from utils.session_manager import get_session_id, get_df
from ml_engine.chat_engine import generate_chat_response
from ml_engine.chat_visualizer import generate_chat_chart

chat_router = APIRouter()

@chat_router.post("/api/chat")
async def ai_chat(request: Request):
    session_id = get_session_id(request)
    df, filename = get_df(session_id)
    if df is None:
        return {"reply": "Please upload a dataset first. I need data to analyze!"}

    body = await request.json()
    question = body.get("question", "")
    
    # Generate text reply
    reply = generate_chat_response(df, filename, question)

    # Check if the question asks for a chart — generate inline
    chart_b64, chart_desc = generate_chat_chart(df, question)

    response = {"reply": reply}
    if chart_b64:
        response["chart"] = chart_b64
        if chart_desc:
            response["chartDescription"] = chart_desc

    return response
