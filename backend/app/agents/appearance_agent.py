import time
import logging
from typing import Dict, Any, List, Optional
from app.database import supabase_client as db

logger = logging.getLogger("vet_ai.appearance_agent")

class AppearanceAgent:
    name: str = "Appearance Agent"

    @classmethod
    async def analyze(
        cls,
        animal: Dict[str, Any],
        vision_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Specializes in morphological appearance findings (coat condition, swelling, lesions, ocular clarity).
        Reuses Vision Agent image extraction without redundant API calls.
        """
        start_time = time.time()
        animal_uuid = str(animal["id"])
        
        observations_raw = vision_data.get("observations", "")
        risk_indicators = vision_data.get("risk_indicators", [])
        
        structured_findings: List[Dict[str, Any]] = []
        abnormalities_detected = False

        # Parse outward findings
        obs_lower = observations_raw.lower() if isinstance(observations_raw, str) else ""

        # 1. Coat & Skin
        if any(term in obs_lower for term in ["alopecia", "rough coat", "matting", "lesion", "wound", "skin"]):
            structured_findings.append({
                "region": "Integumentary System / Coat",
                "finding": "Dermatological irregularity or rough coat texture noted",
                "concern_level": "MODERATE"
            })
            abnormalities_detected = True
        else:
            structured_findings.append({
                "region": "Integumentary System / Coat",
                "finding": "Uniform, healthy hair coat without evident trauma or ectoparasite patches",
                "concern_level": "NORMAL"
            })

        # 2. Ocular & Cranial
        if any(term in obs_lower for term in ["discharge", "sunken eye", "conjunctiv", "crusting", "droop"]):
            structured_findings.append({
                "region": "Cranial / Ocular",
                "finding": "Ocular dullness, potential discharge, or facial asymmetry observed",
                "concern_level": "HIGH"
            })
            abnormalities_detected = True
        else:
            structured_findings.append({
                "region": "Cranial / Ocular",
                "finding": "Clear, bright eyes without purulent discharge or scleral injection",
                "concern_level": "NORMAL"
            })

        # 3. Swelling & Joint Symmetry
        if any(term in obs_lower for term in ["edema", "swelling", "distension", "joint effusion", "inflammation"]):
            structured_findings.append({
                "region": "Musculoskeletal / Lymphatic",
                "finding": "Localized swelling or joint distension observed",
                "concern_level": "HIGH"
            })
            abnormalities_detected = True
        else:
            structured_findings.append({
                "region": "Musculoskeletal / Lymphatic",
                "finding": "No overt localized edema, joint swelling, or abdominal asymmetry observed",
                "concern_level": "NORMAL"
            })

        result = {
            "agent": cls.name,
            "abnormalities_detected": abnormalities_detected,
            "structured_findings": structured_findings,
            "appearance_summary": "Morphological visual features evaluated and categorized into regional findings.",
            "confidence": vision_data.get("confidence", 0.85)
        }

        elapsed_ms = round((time.time() - start_time) * 1000, 1)
        db.save_agent_run({
            "animal_id": animal_uuid,
            "agent_name": cls.name,
            "status": "COMPLETED",
            "input_data": {"has_vision_data": bool(vision_data)},
            "output_data": result,
            "execution_time_ms": elapsed_ms
        })

        return result
