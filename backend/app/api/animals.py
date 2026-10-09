from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional, Dict, Any
from app.database import supabase_client as db
from app.models.schemas import AnimalCreate, AnimalUpdate
from app.services.auth_service import get_current_user_optional

router = APIRouter(prefix="/animals", tags=["animals"])

@router.get("", response_model=List[Dict[str, Any]])
def list_animals(
    species: Optional[str] = Query(None, description="Filter by species (Cattle, Goat, Buffalo)"),
    status: Optional[str] = Query(None, description="Filter by status (Healthy, Monitoring, High Risk)"),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    try:
        user_id = current_user.get("id") if current_user else None
        return db.get_animals(species=species, status=status, user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=Dict[str, Any])
def create_animal(
    animal: AnimalCreate,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    try:
        data = animal.dict()
        if current_user and current_user.get("id"):
            data["user_id"] = current_user["id"]
        return db.create_animal(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/bulk", response_model=Dict[str, Any])
def bulk_create_animals(
    animals_list: List[Dict[str, Any]],
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Bulk registers multiple animals in one operation.
    Skips duplicates, validates required fields, enforces user ownership.
    """
    try:
        user_id = current_user.get("id") if current_user else None
        return db.bulk_create_animals(animals_list, user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{animal_id_or_uuid}", response_model=Dict[str, Any])
def get_animal(animal_id_or_uuid: str):
    animal = db.get_animal(animal_id_or_uuid)
    if not animal:
        raise HTTPException(status_code=404, detail=f"Animal '{animal_id_or_uuid}' not found")
    return animal

@router.patch("/{animal_id_or_uuid}", response_model=Dict[str, Any])
def update_animal(animal_id_or_uuid: str, update: AnimalUpdate):
    animal = db.get_animal(animal_id_or_uuid)
    if not animal:
        raise HTTPException(status_code=404, detail=f"Animal '{animal_id_or_uuid}' not found")
    updated = db.update_animal(str(animal["id"]), update.dict(exclude_unset=True))
    return updated or animal

@router.get("/{animal_id_or_uuid}/history")
def get_animal_history(animal_id_or_uuid: str):
    history = db.get_animal_history(animal_id_or_uuid)
    if not history:
        raise HTTPException(status_code=404, detail=f"Animal '{animal_id_or_uuid}' not found")
    return history

@router.get("/{animal_id_or_uuid}/risk")
def get_animal_risk(animal_id_or_uuid: str):
    history = db.get_animal_history(animal_id_or_uuid)
    if not history or not history.get("animal"):
        raise HTTPException(status_code=404, detail=f"Animal '{animal_id_or_uuid}' not found")
    assessments = history.get("risk_assessments", [])
    latest_assessment = assessments[0] if assessments else None
    return {
        "animal": history["animal"],
        "current_risk_score": history["animal"]["current_risk_score"],
        "current_risk_level": history["animal"]["current_risk_level"],
        "latest_assessment": latest_assessment
    }
