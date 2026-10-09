from typing import Dict, Any, Optional
from app.database.supabase_client import create_alert

class AlertService:
    @staticmethod
    def process_risk_alert(
        animal: Dict[str, Any],
        risk_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        If risk level is HIGH or CRITICAL, generates and persists a veterinary alert.
        """
        risk_level = risk_data.get("risk_level", "LOW")
        risk_score = risk_data.get("risk_score", 0)
        animal_code = animal.get("animal_id", "ANIMAL")
        animal_uuid = str(animal.get("id"))

        if risk_level in ["HIGH", "CRITICAL"]:
            factors_summary = ", ".join([f["name"] for f in risk_data.get("factors", []) if f.get("numeric_weight", 0) > 0])
            title = f"{risk_level} HEALTH RISK DETECTED: {animal_code}"
            message = (
                f"Multi-agent intelligence identified a {risk_level} risk score of {risk_score}/100 "
                f"for animal {animal_code} ({animal.get('breed', 'Livestock')}). "
                f"Contributing factors: {factors_summary}. "
                f"Recommended immediate next step: Veterinary clinical evaluation and pen isolation."
            )
            
            alert_record = {
                "animal_id": animal_uuid,
                "severity": risk_level,
                "title": title,
                "message": message,
                "status": "OPEN"
            }
            return create_alert(alert_record)
        return None
