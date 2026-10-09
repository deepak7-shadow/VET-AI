from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class AnimalBase(BaseModel):
    animal_id: str
    species: str
    breed: Optional[str] = "Unknown"
    age: Optional[float] = 2.0
    gender: Optional[str] = "Female"
    farm: Optional[str] = "Green Valley Dairy"
    image_url: Optional[str] = None
    status: Optional[str] = "Healthy"
    current_risk_score: Optional[float] = 0.0
    current_risk_level: Optional[str] = "LOW"

class AnimalCreate(AnimalBase):
    pass

class AnimalUpdate(BaseModel):
    status: Optional[str] = None
    current_risk_score: Optional[float] = None
    current_risk_level: Optional[str] = None
    image_url: Optional[str] = None
    farm: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[float] = None

class AnimalResponse(AnimalBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HealthObservationCreate(BaseModel):
    animal_id: str
    temperature: float
    feeding_percentage: float
    activity_percentage: float
    behavior_notes: Optional[str] = ""
    observation_source: Optional[str] = "IoT Collar Telemetry"

class FullAnalysisRequest(BaseModel):
    animal_id: str
    temperature: Optional[float] = 38.5
    feeding_percentage: Optional[float] = 100.0
    activity_percentage: Optional[float] = 100.0
    behavior_notes: Optional[str] = "Animal standing calmly"
    image_url: Optional[str] = None
    sample_type: Optional[str] = None # e.g. 'manure_closeup', 'urine_sample', 'body'
    excreta_image_url: Optional[str] = None

class ExcretaScreeningRequest(BaseModel):
    animal_id: str
    image_url: str
    sample_type: Optional[str] = "manure_closeup" # 'manure_closeup' or 'urine_sample'
    behavior_notes: Optional[str] = ""
    temperature: Optional[float] = None

class VisionAnalysisRequest(BaseModel):
    animal_id: str
    image_url: Optional[str] = None
    sample_type: Optional[str] = None


class BehaviorAnalysisRequest(BaseModel):
    animal_id: str
    feeding_percentage: float
    activity_percentage: float
    behavior_notes: Optional[str] = ""

class SensorAnalysisRequest(BaseModel):
    animal_id: str
    temperature: float
    feeding_percentage: float
    activity_percentage: float

class AlertUpdate(BaseModel):
    status: str # 'ACKNOWLEDGED', 'RESOLVED'

class SimulateHealthEventRequest(BaseModel):
    animal_id: str = "COW-027"
    target_temperature: float = 40.1
    target_feeding: float = 65.0
    target_activity: float = 58.0
    notes: Optional[str] = "Simulated acute pyrexia, lethargy, head drooping, decreased herd socialization"
