import time
import logging
from typing import Dict, Any, List, Optional
from app.database import supabase_client as db

logger = logging.getLogger("vet_ai.feeding_agent")

class FeedingIntelligenceAgent:
    name: str = "Feeding Intelligence Agent"

    @classmethod
    async def evaluate_feeding(
        cls,
        animal: Dict[str, Any],
        observation: Dict[str, Any],
        run_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluates farmer-submitted feeding observations against individual or species baselines.
        Distinguishes normal intake from potentially concerning appetite or rumination declines.
        """
        start_time = time.time()
        animal_uuid = str(animal["id"])
        animal_code = animal.get("animal_id", "UNKNOWN")
        species = animal.get("species", "Cattle")

        # Step 1: Retrieve baseline information
        historical_obs = db.get_animal_feeding_observations(animal_uuid, limit=5)
        
        baseline_available = False
        baseline_source = "none"
        baseline_intake = 100.0

        if historical_obs and len(historical_obs) > 1:
            # We have historical observations
            baseline_available = True
            baseline_source = "historical_observations"
            intake_history = [
                float(h.get("estimated_intake_percent") or 100) 
                for h in historical_obs[1:] # exclude current if already inserted
            ]
            if intake_history:
                baseline_intake = round(sum(intake_history) / len(intake_history), 1)
        else:
            # Normative species reference
            baseline_source = f"species_normative_reference ({species})"
            baseline_available = True
            baseline_intake = 100.0

        # Step 2: Evaluate Current Observation
        intake_pct = float(observation.get("estimated_intake_percent", 100.0))
        appetite = observation.get("appetite_change", "NORMAL").upper()
        missed = int(observation.get("missed_sessions", 0))
        water = observation.get("water_consumption", "NORMAL").upper()
        onset = observation.get("onset_timing", "TODAY")
        feed_change = observation.get("recent_feed_change", "No recent change")
        notes = observation.get("notes", "")

        evidence: List[str] = []
        limitations: List[str] = ["Intake estimate is farmer-reported rather than automated scale telemetry"]

        intake_diff = intake_pct - baseline_intake

        # Evidence accumulation
        if appetite == "REFUSING_FOOD":
            evidence.append("Acute refusal of feed ration reported by farmer")
        elif appetite == "MODERATE_DECREASE":
            evidence.append("Noticeable decline in appetite observed at feeding bunk")
        elif appetite == "SLIGHT_DECREASE":
            evidence.append("Mild appetite reluctance reported")
        elif appetite == "INCREASED":
            evidence.append("Reported appetite higher than usual")

        if intake_pct < 60:
            evidence.append(f"Reported intake ({intake_pct:.0f}%) is severely suppressed relative to expected ({baseline_intake:.0f}%)")
        elif intake_pct < 80:
            evidence.append(f"Reported intake ({intake_pct:.0f}%) is moderately suppressed ({intake_diff:.0f}% below baseline)")

        if missed > 0:
            evidence.append(f"Animal skipped {missed} scheduled feeding session(s)")

        if water == "DECREASED":
            evidence.append("Concomitant reduction in water trough consumption observed")
        elif water == "INCREASED":
            evidence.append("Compensatory elevated water consumption noted")

        if feed_change and "no recent" not in feed_change.lower():
            evidence.append(f"Recent ration adjustment noted: '{feed_change}'")
            limitations.append("Intake alteration may partially correlate with recent feed transition")

        # Step 3: Determine Feeding Status
        if intake_pct <= 50 or appetite == "REFUSING_FOOD" or missed >= 2:
            status = "POSSIBLE_REDUCED_INTAKE"
            confidence = "high"
            recommended_next_step = "Prompt veterinary assessment advised; severe appetite suppression is a primary clinical indicator of systemic illness, ketosis, or acute mastitis."
        elif intake_pct < 80 or appetite in ("MODERATE_DECREASE", "SLIGHT_DECREASE") or missed == 1:
            status = "POSSIBLE_REDUCED_INTAKE"
            confidence = "moderate"
            recommended_next_step = "Isolate for targeted observation over the next 12-24 hours; verify rumen fill, core temperature, and water intake."
        elif intake_pct > 120 or appetite == "INCREASED":
            status = "POSSIBLE_INCREASED_INTAKE"
            confidence = "moderate"
            recommended_next_step = "Monitor for digestive upset or rapid concentrate overconsumption."
        elif water in ("INCREASED", "DECREASED") and intake_pct >= 85:
            status = "UNUSUAL_FEEDING_PATTERN"
            confidence = "moderate"
            recommended_next_step = "Evaluate hydration station and inspect for subtle subclinical discomfort."
        elif not evidence:
            status = "NORMAL_PATTERN_REPORTED"
            confidence = "high"
            evidence.append(f"Feed consumption at {intake_pct:.0f}% conforms to normal herd expectations")
            recommended_next_step = "Continue standard herd feeding protocol and routine monitoring."
        else:
            status = "NORMAL_PATTERN_REPORTED"
            confidence = "moderate"
            recommended_next_step = "Continue monitoring with next scheduled group ration."

        # Step 4: Produce Structured Assessment
        result = {
            "animal_id": animal_code,
            "feeding_status": status,
            "baseline_available": baseline_available,
            "baseline_source": baseline_source,
            "current_observation": {
                "estimated_intake_percent": intake_pct,
                "appetite_change": appetite,
                "missed_sessions": missed,
                "water_consumption": water,
                "onset_timing": onset,
                "ration_notes": feed_change
            },
            "comparison": {
                "summary": f"Reported intake is {intake_pct:.0f}% (Baseline reference: {baseline_intake:.0f}%). Status: {status.replace('_', ' ')}.",
                "intake_difference_percent": round(intake_diff, 1)
            },
            "evidence": evidence,
            "confidence": confidence,
            "limitations": limitations,
            "recommended_next_step": recommended_next_step
        }

        # Step 5: Save to Database
        db.save_feeding_assessment({
            "animal_id": animal_uuid,
            "run_id": run_id,
            "observation_id": observation.get("id"),
            "feeding_status": status,
            "baseline_available": baseline_available,
            "baseline_source": baseline_source,
            "comparison": result["comparison"],
            "evidence": evidence,
            "confidence": confidence,
            "limitations": limitations,
            "recommended_next_step": recommended_next_step
        })

        elapsed_ms = round((time.time() - start_time) * 1000, 1)
        db.save_agent_run({
            "animal_id": animal_uuid,
            "agent_name": cls.name,
            "status": "COMPLETED",
            "input_data": {
                "intake_percent": intake_pct,
                "appetite": appetite,
                "missed_sessions": missed
            },
            "output_data": result,
            "execution_time_ms": elapsed_ms
        })

        return result
