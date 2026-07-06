from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
import traceback

from utils.session_manager import get_session_id, get_df, set_df
from ml_engine.data_loader import load_dataset, load_demo_dataset, get_basic_meta, export_dataframe

upload_router = APIRouter()

@upload_router.post("/api/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    if file.filename == "":
        return JSONResponse({"error": "Empty filename"}, status_code=400)

    session_id = get_session_id(request)

    try:
        # Read the file content into a file-like object for compatibility
        import io
        content = await file.read()
        file_like = io.BytesIO(content)
        file_like.filename = file.filename

        df = load_dataset(file_like, file.filename)
        set_df(session_id, df, file.filename)
        meta = get_basic_meta(df, file_like)
        
        return {
            "sessionId": session_id,
            "filename": file.filename,
            **meta
        }
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

@upload_router.post("/api/upload/demo")
async def load_demo(request: Request):
    session_id = get_session_id(request)
    df, filename = load_demo_dataset()
    set_df(session_id, df, filename)
    meta = get_basic_meta(df)
    
    return {
        "sessionId": session_id,
        "filename": filename,
        **meta
    }

@upload_router.get("/api/export/{fmt}")
async def export_data(fmt: str, request: Request):
    session_id = get_session_id(request)
    df, filename = get_df(session_id)
    if df is None:
        return JSONResponse({"error": "No dataset loaded"}, status_code=400)

    try:
        buf, mimetype, download_name = export_dataframe(df, filename, fmt)
        return StreamingResponse(
            buf,
            media_type=mimetype,
            headers={"Content-Disposition": f"attachment; filename={download_name}"}
        )
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)
