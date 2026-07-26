"""
PipeWise-AI — Python ML Backend
Full ML pipeline API using FastAPI, pandas, sklearn, matplotlib.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from config import Config
from routes.upload_routes import upload_router
from routes.clean_routes import clean_router
from routes.visualize_routes import visualize_router
from routes.train_routes import train_router
from routes.insights_routes import insights_router
from routes.chat_routes import chat_router

def create_app():
    app = FastAPI(title="PipeWise-AI", version="1.0.0")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=Config.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    async def index():
        return RedirectResponse(url="http://localhost:3000")

    @app.get("/api/health")
    async def health():
        return {"status": "ok", "message": "PipeWise-AI Python Backend is running"}

    # Include routers
    app.include_router(upload_router)
    app.include_router(clean_router)
    app.include_router(visualize_router)
    app.include_router(train_router)
    app.include_router(insights_router)
    app.include_router(chat_router)

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    print("🚀 PipeWise-AI Backend starting on http://localhost:8000")
    print("   Endpoints: /api/upload, /api/understand, /api/clean, /api/visualize, /api/train, /api/insights, /api/export, /api/chat")
    uvicorn.run(app, host=Config.HOST, port=Config.PORT)
