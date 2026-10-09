from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.models.schemas import SimulateHealthEventRequest
from app.database import supabase_client as db
from app.agents.orchestrator import OrchestratorAgent

router = APIRouter(prefix="/demo", tags=["demo"])

@router.post("/simulate-health-event")
async def simulate_health_event(req: SimulateHealthEventRequest = SimulateHealthEventRequest()):
    """
    Simulates acute health event on COW-027 (or specified animal):
    Temperature: 38.5 -> 40.1°C
    Feeding: 100 -> 65%
    Activity: 100 -> 58%
    Runs full multi-agent pipeline and persists all results into Supabase.
    Target result: Risk ~76/100 (HIGH).
    """
    try:
        animal = db.get_animal(req.animal_id)
        if not animal:
            raise HTTPException(status_code=404, detail=f"Animal '{req.animal_id}' not found")

        result = await OrchestratorAgent.run_full_analysis(
            animal_id_or_uuid=req.animal_id,
            temperature=req.target_temperature,
            feeding_percentage=req.target_feeding,
            activity_percentage=req.target_activity,
            behavior_notes=req.notes or "Simulated acute pyrexia, dropped appetite, lethargic posture",
            image_url=animal.get("image_url")
        )
        return {
            "status": "success",
            "simulation": "ACUTE_HEALTH_EVENT_TRIGGERED",
            "animal_id": req.animal_id,
            "target_temperature": req.target_temperature,
            "target_feeding": req.target_feeding,
            "target_activity": req.target_activity,
            "analysis_result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset")
def reset_demo():
    """
    Resets COW-027 back to healthy baseline (Risk = 18, Status = Healthy).
    """
    try:
        cow = db.get_animal("COW-027")
        if not cow:
            raise HTTPException(status_code=404, detail="COW-027 not found")

        cow_uuid = str(cow["id"])
        
        # Reset animal status and risk
        db.update_animal(cow_uuid, {
            "current_risk_score": 18,
            "current_risk_level": "LOW",
            "status": "Healthy"
        })

        # Insert healthy baseline observation
        db.save_observation({
            "animal_id": cow_uuid,
            "temperature": 38.5,
            "feeding_percentage": 100.0,
            "activity_percentage": 100.0,
            "behavior_notes": "Healthy baseline restored. Herd ruminating normally.",
            "observation_source": "Demo Calibration Reset"
        })

        # Acknowledge / resolve any open alerts for COW-027
        conn = db.get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE alerts 
                    SET status = 'RESOLVED' 
                    WHERE animal_id = %s AND status = 'OPEN';
                """, (cow_uuid,))
        finally:
            conn.close()

        updated_cow = db.get_animal("COW-027")
        return {
            "status": "success",
            "message": "COW-027 reset to healthy baseline (Risk 18, Status: Healthy)",
            "animal": updated_cow
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
