import time
from typing import Dict, Any, Optional
from app.services.risk_service import RiskService
from app.database.supabase_client import save_risk_assessment, save_agent_run

class RiskAgent:
    name: str = "Risk Agent"

    @classmethod
    async def run(
        cls,
        animal: Dict[str, Any],
        sensor_data: Optional[Dict[str, Any]] = None,
        behavior_data: Optional[Dict[str, Any]] = None,
        vision_data: Optional[Dict[str, Any]] = None,
        feeding_data: Optional[Dict[str, Any]] = None,
        appearance_data: Optional[Dict[str, Any]] = None,
        is_preliminary: bool = False
    ) -> Dict[str, Any]:
        start_time = time.time()
        animal_uuid = str(animal["id"])
        baseline_temp = (sensor_data or {}).get("baseline_temperature", 38.5)

        # Synthesize multi-modal evidence into risk assessment
        risk_result = RiskService.calculate_risk(
            sensor_data=sensor_data,
            behavior_data=behavior_data,
            vision_data=vision_data,
            feeding_data=feeding_data,
            appearance_data=appearance_data,
            baseline_temp=baseline_temp,
            is_preliminary=is_preliminary
        )

        # Save risk assessment and update animal record in Supabase
        save_risk_assessment({
            "animal_id": animal_uuid,
            "risk_score": risk_result["risk_score"],
            "risk_level": risk_result["risk_level"],
            "confidence": risk_result["confidence"],
            "factors": risk_result["factors"],
            "evidence": risk_result["evidence"]
        })

        elapsed_ms = round((time.time() - start_time) * 1000, 1)

        # Log agent run (safe access - any of these may be empty dicts)
        _sd = sensor_data or {}
        _bd = behavior_data or {}
        _vd = vision_data or {}
        save_agent_run({
            "animal_id": animal_uuid,
            "agent_name": cls.name,
            "status": "COMPLETED",
            "input_data": {
                "temp_deviation": _sd.get("temperature_deviation"),
                "feeding_change": _bd.get("feeding_change"),
                "activity_change": _bd.get("activity_change"),
                "vision_anomalies": len(_vd.get("risk_indicators", []))
            },
            "output_data": risk_result,
            "execution_time_ms": elapsed_ms
        })

        return risk_result
