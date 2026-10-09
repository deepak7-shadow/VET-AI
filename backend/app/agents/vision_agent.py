import time
import logging
from typing import Dict, Any, Optional
from app.services.vision_service import VisionService
from app.services.yolo_service import YOLOScreeningService
from app.database.supabase_client import save_image_analysis, save_agent_run

logger = logging.getLogger("vet_ai.vision_agent")

class VisionAgent:
    name: str = "Vision Agent"

    @classmethod
    async def run(
        cls,
        animal: Dict[str, Any],
        image_url: Optional[str] = None,
        temperature: float = 38.5,
        behavior_notes: str = "",
        sample_type: Optional[str] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        animal_uuid = str(animal["id"])
        animal_code = animal.get("animal_id", "UNKNOWN")
        farm_name = animal.get("farm", "FARM-DEFAULT")
        
        # Determine image URL to analyze
        target_img = image_url or animal.get("image_url") or "https://images.unsplash.com/photo-1546445317-29f4545e9d53"

        # Check if this is an excreta sample (manure / poop / pop / urine / diarrhea)
        notes_lower = (behavior_notes or "").lower()
        is_excreta = (
            bool(sample_type) or 
            any(w in notes_lower for w in ["manure", "urine", "pop", "poop", "dung", "stool", "scour", "diarrhea"])
        )
        effective_sample_type = sample_type or ("urine_sample" if "urine" in notes_lower else "manure_closeup")

        # Execute standard vision service
        analysis_result = await VisionService.analyze_livestock_image(
            image_url=target_img,
            temperature=temperature,
            behavior_notes=behavior_notes
        )

        # If excreta image or requested sample type, execute YOLO26 Screening Service
        if is_excreta:
            try:
                yolo_result = YOLOScreeningService.screen_image(
                    image_path_or_url=target_img,
                    sample_type=effective_sample_type,
                    animal_id=animal_code,
                    farm_id=farm_name
                )
                analysis_result["excreta_screening"] = yolo_result
                analysis_result["sample_type"] = effective_sample_type
                
                top_indication = yolo_result.get("top_indication", "Unknown")
                top_prob = yolo_result.get("top_probability", 0.0)
                risk_tier = yolo_result.get("risk_tier", "LOW RISK")
                
                # Add structured indicators and observations
                if risk_tier in ("CRITICAL CONCERN", "HIGH RISK", "MEDIUM RISK") and top_indication != "Healthy / Normative":
                    indicator_msg = f"YOLO26 Excreta Triage: {top_indication} ({top_prob:.1f}% confidence, {risk_tier})"
                    if indicator_msg not in analysis_result.get("risk_indicators", []):
                        analysis_result.setdefault("risk_indicators", []).insert(0, indicator_msg)
                
                obs_msg = f"Visual {effective_sample_type.replace('_', ' ').title()}: Primary indication is {top_indication} ({top_prob:.1f}% probability)."
                analysis_result.setdefault("observations", []).insert(0, obs_msg)
                
                # Update summary
                analysis_result["summary"] = (
                    f"Excreta Visual Screening: Flagged {top_indication} ({top_prob:.1f}%) on {effective_sample_type}. " +
                    analysis_result.get("summary", "")
                )
            except Exception as e:
                logger.warning(f"YOLO26 Screening failed in VisionAgent: {e}")

        # Save to image_analysis table
        save_image_analysis({
            "animal_id": animal_uuid,
            "image_url": target_img,
            "observations": analysis_result.get("observations", []),
            "risk_indicators": analysis_result.get("risk_indicators", []),
            "confidence": analysis_result.get("confidence", 0.85),
            "model_name": f"VET-Vision Agent + YOLO26 ({analysis_result.get('inference_type', 'VET-Engine')})"
        })

        elapsed_ms = round((time.time() - start_time) * 1000, 1)

        # Log agent run
        save_agent_run({
            "animal_id": animal_uuid,
            "agent_name": cls.name,
            "status": "COMPLETED",
            "input_data": {
                "image_url": target_img, 
                "temp_context": temperature, 
                "notes": behavior_notes,
                "sample_type": effective_sample_type if is_excreta else None
            },
            "output_data": analysis_result,
            "execution_time_ms": elapsed_ms
        })

        return analysis_result

