class Config:
    CORS_ORIGINS = ["*"]
    DEBUG = True
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500 MB limit
    HOST = "0.0.0.0"
    PORT = 8000
