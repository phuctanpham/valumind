from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # AWS Settings
    AWS_REGION: str = "ap-southeast-1"
    S3_BUCKET: str
    
    # Auth Settings
    AUTH_SERVICE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    
    # OCR Settings
    TESSERACT_CMD: Optional[str] = None
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: list = [".pdf", ".png", ".jpg", ".jpeg", ".tiff"]
    
    class Config:
        env_file = ".env"

settings = Settings()
