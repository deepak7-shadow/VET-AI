import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api import animals, analysis, alerts, reports, agents, dashboard, demo

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multi-Agent Livestock Health Intelligence & Early Disease-Risk Detection Platform",
    version="1.0.0"
)

# Enable CORS for frontend Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads directory
upload_dir = Path(__file__).resolve().parent.parent / "uploads"
upload_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

# Include API Routers under /api
app.include_router(animals.router, prefix=settings.API_PREFIX)
app.include_router(analysis.router, prefix=settings.API_PREFIX)
app.include_router(alerts.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(agents.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(demo.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "ONLINE",
        "docs": "/docs",
        "supabase_project": settings.SUPABASE_URL,
        "demo_mode": settings.DEMO_MODE
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "VET-AI Multi-Agent Backend",
        "database": "Supabase PostgreSQL",
        "timestamp": os.environ.get("SERVER_START_TIME", "2026-10-08T19:47:13Z")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
