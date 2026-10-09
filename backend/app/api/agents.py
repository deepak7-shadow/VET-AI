from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from app.database import supabase_client as db

router = APIRouter(prefix="/agents", tags=["agents"])

@router.get("", response_model=List[Dict[str, Any]])
def get_all_agent_runs(limit: int = Query(50, ge=1, le=100)):
    try:
        return db.get_agent_activity(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{animal_id_or_uuid}", response_model=List[Dict[str, Any]])
def get_animal_agent_runs(animal_id_or_uuid: str, limit: int = Query(30, ge=1, le=100)):
    try:
        return db.get_agent_activity(animal_id_or_uuid=animal_id_or_uuid, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
