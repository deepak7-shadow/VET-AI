from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import (
    RiskLevel, AnimalStatus, AlertSeverity, AlertStatus,
    SampleType, ScreeningStatus, AppetiteChange, WaterConsumption, OnsetTiming
)

# ─────────────────────────────────────────────────────────────────────────────
# 1. Animal Domain Models
# ─────────────────────────────────────────────────────────────────────────────
class AnimalBase(BaseModel):
    animal_id: str = Field(..., description="Unique ear-tag identifier e.g. COW-027")
    species: str = Field(default="Bovine", description="Species name e.g. Bovine, Ovine")
    breed: Optional[str] = Field(default="Unknown", description="Breed specification")
    age: Optional[float] = Field(default=2.0, ge=0.0, description="Age in years")
    gender: Optional[str] = Field(default="Female", description="Gender of the animal")
    farm: Optional[str] = Field(default="Green Valley Dairy", description="Farm name")
    herd_group: Optional[str] = Field(default="General", description="Herd group or pen")
    image_url: Optional[str] = Field(default=None, description="Profile image URL")
    status: Optional[str] = Field(default=AnimalStatus.HEALTHY.value, description="Clinical status")
    current_risk_score: Optional[float] = Field(default=0.0, ge=0.0, le=100.0)
    current_risk_level: Optional[str] = Field(default=RiskLevel.LOW.value)
    notes: Optional[str] = None
    user_id: Optional[UUID] = None

class AnimalCreate(AnimalBase):
    pass

class AnimalUpdate(BaseModel):
    species: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[float] = None
    gender: Optional[str] = None
    farm: Optional[str] = None
    herd_group: Optional[str] = None
    status: Optional[str] = None
    current_risk_score: Optional[float] = None
    current_risk_level: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None

class AnimalResponse(AnimalBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Health Observation Models
# ─────────────────────────────────────────────────────────────────────────────
class HealthObservationBase(BaseModel):
    animal_id: str
    temperature: float = Field(..., description="Rectal or tympanic temperature in °C")
    feeding_percentage: float = Field(..., ge=0.0, le=150.0, description="% of expected daily feed intake")
    activity_percentage: float = Field(..., ge=0.0, le=200.0, description="% of expected baseline movement")
    behavior_notes: Optional[str] = Field(default="", description="Field observations or notes")
    observation_source: Optional[str] = Field(default="Collar Telemetry", description="Telemetry source")

class HealthObservationCreate(HealthObservationBase):
    pass

class HealthObservationResponse(HealthObservationBase):
    id: UUID
    timestamp: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Computer Vision & Excreta Analysis Models
# ─────────────────────────────────────────────────────────────────────────────
class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float
    label: str
    confidence: float

class ImageAnalysisBase(BaseModel):
    animal_id: str
    image_url: str
    sample_type: Optional[str] = Field(default=SampleType.BODY.value)
    detected_features: List[str] = Field(default_factory=list)
    clinical_signs: List[str] = Field(default_factory=list)
    bounding_boxes: List[Dict[str, Any]] = Field(default_factory=list)
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    visual_health_index: float = Field(default=100.0, ge=0.0, le=100.0)

class ImageAnalysisCreate(ImageAnalysisBase):
    pass

class ImageAnalysisResponse(ImageAnalysisBase):
    id: UUID
    timestamp: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Multi-Agent Risk Assessment Models
# ─────────────────────────────────────────────────────────────────────────────
class ScoreBreakdown(BaseModel):
    sensor_score: float = 0.0
    behavior_score: float = 0.0
    vision_score: float = 0.0
    baseline_deviation: float = 0.0

class AcuteSyndromeProbabilities(BaseModel):
    bovine_respiratory_disease: float = 0.0
    clinical_mastitis: float = 0.0
    ruminal_acidosis: float = 0.0
    heat_stress: float = 0.0

class RiskAssessmentBase(BaseModel):
    animal_id: str
    risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: str = Field(default=RiskLevel.LOW.value)
    score_breakdown: Dict[str, Any] = Field(default_factory=dict)
    top_contributing_factors: List[str] = Field(default_factory=list)
    acute_syndrome_probabilities: Dict[str, float] = Field(default_factory=dict)
    confidence: str = Field(default="moderate")

class RiskAssessmentCreate(RiskAssessmentBase):
    pass

class RiskAssessmentResponse(RiskAssessmentBase):
    id: UUID
    timestamp: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────────────────────────────────────
# 5. Alert Models
# ─────────────────────────────────────────────────────────────────────────────
class AlertBase(BaseModel):
    animal_id: str
    alert_type: str = Field(..., description="Alert classification e.g. FEVER_DETECTED, SEVERE_ANOREXIA")
    severity: str = Field(default=AlertSeverity.WARNING.value)
    trigger_factor: str = Field(..., description="Specific trigger threshold or event")
    recommended_action: str = Field(..., description="Clinical recommended triage action")
    status: str = Field(default=AlertStatus.ACTIVE.value)
    user_id: Optional[UUID] = None

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    status: str = Field(..., description="ACKNOWLEDGED or RESOLVED")

class AlertResponse(AlertBase):
    id: UUID
    timestamp: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Clinical Decision Support Report Models
# ─────────────────────────────────────────────────────────────────────────────
class ReportBase(BaseModel):
    animal_id: str
    executive_summary: str
    findings: Dict[str, Any] = Field(default_factory=dict)
    agent_trace: Dict[str, Any] = Field(default_factory=dict)
    clinical_guidelines_cited: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    disclaimer: str = Field(default="Veterinary Clinical Decision Support System: Not a final medical diagnosis.")
    generated_by: str = Field(default="VET-AI Multi-Agent System")
    pdf_url: Optional[str] = None
    user_id: Optional[UUID] = None

class ReportCreate(ReportBase):
    pass

class ReportResponse(ReportBase):
    id: UUID
    timestamp: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────────────────────────────────────
# 7. Agent Execution Log Models
# ─────────────────────────────────────────────────────────────────────────────
class AgentLogBase(BaseModel):
    run_id: str
    agent_name: str
    status: str = "SUCCESS" # SUCCESS, FAILED, RUNNING
    execution_time_ms: int = 0
    input_payload: Dict[str, Any] = Field(default_factory=dict)
    output_payload: Dict[str, Any] = Field(default_factory=dict)
    error_message: Optional[str] = None

class AgentLogCreate(AgentLogBase):
    pass

class AgentLogResponse(AgentLogBase):
    id: UUID
    timestamp: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────────────────────────────────────
# 8. Herd Screening Runs & Feeding Telemetry
# ─────────────────────────────────────────────────────────────────────────────
class ScreeningRunBase(BaseModel):
    farm: str = "General Herd"
    species_filter: Optional[str] = "ALL"
    status: str = Field(default=ScreeningStatus.IN_PROGRESS.value)
    total_animals: int = 0
    screened_animals: int = 0
    failed_animals: int = 0
    needs_info_count: int = 0
    low_risk_count: int = 0
    medium_risk_count: int = 0
    high_risk_count: int = 0
    critical_count: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)
    user_id: Optional[UUID] = None

class ScreeningRunCreate(ScreeningRunBase):
    pass

class ScreeningRunResponse(ScreeningRunBase):
    id: UUID
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ScreeningRunAnimalResponse(BaseModel):
    id: UUID
    run_id: UUID
    animal_id: UUID
    animal_code: str
    species: str
    breed: Optional[str] = None
    farm: Optional[str] = None
    status: str
    initial_category: str
    final_category: Optional[str] = None
    initial_risk_score: float = 0.0
    final_risk_score: Optional[float] = None
    observed_findings: List[Any] = Field(default_factory=list)
    missing_information: List[Any] = Field(default_factory=list)
    feeding_status: str = "NOT_REQUESTED"
    recommended_next_step: str = ""
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeedingObservationBase(BaseModel):
    animal_id: UUID
    run_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    usual_routine: Optional[str] = "Twice daily pasture and silage"
    estimated_intake_percent: float = Field(default=100.0, ge=0.0, le=150.0)
    appetite_change: str = Field(default=AppetiteChange.NORMAL.value)
    missed_sessions: int = Field(default=0, ge=0)
    feed_type: Optional[str] = "Mixed ration"
    recent_feed_change: Optional[str] = "No recent change"
    water_consumption: str = Field(default=WaterConsumption.NORMAL.value)
    onset_timing: str = Field(default=OnsetTiming.TODAY.value)
    behavior_notes: Optional[str] = None
    notes: Optional[str] = None

class FeedingObservationCreate(FeedingObservationBase):
    pass

class FeedingObservationResponse(FeedingObservationBase):
    id: UUID
    observation_time: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
