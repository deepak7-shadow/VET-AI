import time
from typing import Dict, Any, Optional
from app.services.vision_service import VisionService
from app.database.supabase_client import save_image_analysis, save_agent_run

class VisionAgent:
    name: str = "Vision Agent"

    @classmethod
    async def run(
        cls,
        animal: Dict[str, Any],
        image_url: Optional[str] = None,
        temperature: float = 38.5,
        behavior_notes: str = ""
    ) -> Dict[str, Any]:
        start_time = time.time()
        animal_uuid = str(animal["id"])
        
        # Determine image URL to analyze
        target_img = image_url or animal.get("image_url") or "https://images.unsplash.com/photo-1546445317-29f4545e9d53"

        # Execute vision service
        analysis_result = await VisionService.analyze_livestock_image(
            image_url=target_img,
            temperature=temperature,
            behavior_notes=behavior_notes
        )

        # Save to image_analysis table
        save_image_analysis({
            "animal_id": animal_uuid,
            "image_url": target_img,
            "observations": analysis_result.get("observations", []),
            "risk_indicators": analysis_result.get("risk_indicators", []),
            "confidence": analysis_result.get("confidence", 0.85),
            "model_name": f"VET-Vision Agent ({analysis_result.get('inference_type', 'VET-Engine')})"
        })

        elapsed_ms = round((time.time() - start_time) * 1000, 1)

        # Log agent run
        save_agent_run({
            "animal_id": animal_uuid,
            "agent_name": cls.name,
            "status": "COMPLETED",
            "input_data": {"image_url": target_img, "temp_context": temperature, "notes": behavior_notes},
            "output_data": analysis_result,
            "execution_time_ms": elapsed_ms
        })

        return analysis_result
