import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env file
base_dir = Path(__file__).resolve().parent.parent
env_path = base_dir / ".env"
load_dotenv(dotenv_path=env_path)

class Settings(BaseModel):
    PROJECT_NAME: str = "VET-AI Multi-Agent Livestock Health Intelligence"
    API_PREFIX: str = "/api"
    
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://mlmilvhgicvxjarfgpyj.supabase.co")
    SUPABASE_PUBLISHABLE_KEY: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    DB_HOST: str = os.getenv("DB_HOST", "db.mlmilvhgicvxjarfgpyj.supabase.co")
    DB_NAME: str = os.getenv("DB_NAME", "postgres")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASS: str = os.getenv("DB_PASS", "Deepak8431**##@@")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-2.0-flash")
    
    PORT: int = int(os.getenv("PORT", "8000"))
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

settings = Settings()
