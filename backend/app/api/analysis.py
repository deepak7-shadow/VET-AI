import os
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Dict, Any
from app.models.schemas import (
    FullAnalysisRequest,
    VisionAnalysisRequest,
    BehaviorAnalysisRequest,
    SensorAnalysisRequest
)
from app.database import supabase_client as db
from app.agents.orchestrator import OrchestratorAgent
from app.agents.vision_agent import VisionAgent
from app.agents.behavior_agent import BehaviorAgent
from app.agents.sensor_agent import SensorAgent

router = APIRouter(tags=["analysis"])

@router.post("/agent/analyze")
async def run_full_agent_analysis(req: FullAnalysisRequest):
    """
    Coordinates the complete multi-agent workflow:
    Orchestrator -> Vision, Behavior, Sensor -> Risk -> Knowledge (RAG) -> Report (GenAI) -> Alert.
    """
    try:
        result = await OrchestratorAgent.run_full_analysis(
            animal_id_or_uuid=req.animal_id,
            temperature=req.temperature or 38.5,
            feeding_percentage=req.feeding_percentage or 100.0,
            activity_percentage=req.activity_percentage or 100.0,
            behavior_notes=req.behavior_notes or "",
            image_url=req.image_url
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/image")
async def analyze_image(req: VisionAnalysisRequest):
    animal = db.get_animal(req.animal_id)
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    result = await VisionAgent.run(animal=animal, image_url=req.image_url)
    return result

@router.post("/analyze/behavior")
async def analyze_behavior(req: BehaviorAnalysisRequest):
    animal = db.get_animal(req.animal_id)
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    result = await BehaviorAgent.run(
        animal=animal,
        current_feeding=req.feeding_percentage,
        current_activity=req.activity_percentage,
        behavior_notes=req.behavior_notes or ""
    )
    return result

@router.post("/analyze/sensors")
async def analyze_sensors(req: SensorAnalysisRequest):
    animal = db.get_animal(req.animal_id)
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    result = await SensorAgent.run(
        animal=animal,
        temperature=req.temperature,
        feeding_percentage=req.feeding_percentage,
        activity_percentage=req.activity_percentage
    )
    return result

# Image upload handler
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Uploads a livestock image to local static uploads or Supabase Storage and returns URL."""
    try:
        filename = f"{uuid.uuid4().hex[:12]}_{file.filename}"
        file_path = UPLOAD_DIR / filename
        content = await file.read()
        file_path.write_bytes(content)
        
        # Return URL accessible from backend
        image_url = f"/uploads/{filename}"
        return {"url": image_url, "filename": filename, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

from pydantic import BaseModel
from typing import Optional

class YOLOScreenRequest(BaseModel):
    image_url: str
    sample_type: Optional[str] = "manure_closeup"
    animal_id: Optional[str] = "COW-027"
    farm_id: Optional[str] = "FARM-VALLEY-01"

@router.post("/analyze/yolo-screen")
async def yolo_screen_image(req: YOLOScreenRequest):
    """
    Runs YOLO26 livestock disease risk screening on manure, urine, or cow body images.
    Outputs calibrated disease risk probabilities and structured veterinary triage report.
    """
    from app.services.yolo_service import YOLOScreeningService
    try:
        return YOLOScreeningService.screen_image(
            image_path_or_url=req.image_url,
            sample_type=req.sample_type,
            animal_id=req.animal_id,
            farm_id=req.farm_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
