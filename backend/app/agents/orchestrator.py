import time
import logging
from typing import Dict, Any, Optional, List
from app.agents.vision_agent import VisionAgent
from app.agents.behavior_agent import BehaviorAgent
from app.agents.sensor_agent import SensorAgent
from app.agents.risk_agent import RiskAgent
from app.agents.knowledge_agent import KnowledgeAgent
from app.agents.report_agent import ReportAgent
from app.services.alert_service import AlertService
from app.database.supabase_client import get_animal, save_agent_run

logger = logging.getLogger("vet_ai.orchestrator")

class OrchestratorAgent:
    name: str = "Orchestrator Agent"

    @classmethod
    async def run_full_analysis(
        cls,
        animal_id_or_uuid: str,
        temperature: float = 38.5,
        feeding_percentage: float = 100.0,
        activity_percentage: float = 100.0,
        behavior_notes: str = "",
        image_url: Optional[str] = None,
        sample_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Coordinates the multi-agent workflow:
        1. Orchestrator initializes
        2. Dispatches Vision Agent (with YOLO26 screening if manure/urine), Behavior Agent, Sensor Agent
        3. Dispatches Risk Agent
        4. Dispatches Knowledge Agent (RAG)
        5. Dispatches Report Agent (Generative AI)
        6. Dispatches Alert System (if High/Critical)
        7. Returns unified multi-agent response
        """
        start_time = time.time()
        
        # 1. Fetch Animal from Supabase
        animal = get_animal(animal_id_or_uuid)
        if not animal:
            raise ValueError(f"Animal {animal_id_or_uuid} not found in Supabase database")

        animal_uuid = str(animal["id"])
        logger.info(f"Orchestrator starting analysis for animal {animal.get('animal_id')} ({animal_uuid})")

        # 2. Run Sensor Agent (saves observation to health_observations)
        sensor_data = await SensorAgent.run(
            animal=animal,
            temperature=temperature,
            feeding_percentage=feeding_percentage,
            activity_percentage=activity_percentage,
            behavior_notes=behavior_notes
        )

        # 3. Run Behavior Agent (compares against historical baseline in Supabase)
        behavior_data = await BehaviorAgent.run(
            animal=animal,
            current_feeding=feeding_percentage,
            current_activity=activity_percentage,
            behavior_notes=behavior_notes
        )

        # 4. Run Vision Agent (analyzes image, runs YOLO26 if manure/urine, saves to image_analysis)
        vision_data = await VisionAgent.run(
            animal=animal,
            image_url=image_url,
            temperature=temperature,
            behavior_notes=behavior_notes,
            sample_type=sample_type
        )

        # 5. Run Risk Agent (synthesizes multi-modal inputs, updates animal risk in Supabase)
        risk_data = await RiskAgent.run(
            animal=animal,
            sensor_data=sensor_data,
            behavior_data=behavior_data,
            vision_data=vision_data
        )

        # 6. Run Knowledge / RAG Agent (retrieves from knowledge_documents)
        knowledge_data = await KnowledgeAgent.run(
            animal=animal,
            risk_data=risk_data,
            sensor_data=sensor_data,
            behavior_notes=behavior_notes
        )

        # 7. Run Report Agent (Generative AI report with veterinary disclaimer)
        report_data = await ReportAgent.run(
            animal=animal,
            risk_data=risk_data,
            knowledge_data=knowledge_data,
            sensor_data=sensor_data,
            behavior_data=behavior_data,
            vision_data=vision_data
        )

        # 8. Alert System
        alert_record = AlertService.process_risk_alert(animal=animal, risk_data=risk_data)

        # Refetch updated animal
        updated_animal = get_animal(animal_uuid) or animal

        total_elapsed_ms = round((time.time() - start_time) * 1000, 1)

        # 9. Log Orchestrator Execution
        orchestrator_summary = {
            "workflow_status": "COMPLETED",
            "agents_executed": [
                "Sensor Agent",
                "Behavior Agent",
                "Vision Agent",
                "Risk Agent",
                "Knowledge Agent",
                "Report Agent"
            ],
            "risk_score": risk_data.get("risk_score"),
            "risk_level": risk_data.get("risk_level"),
            "alert_created": alert_record is not None,
            "total_execution_time_ms": total_elapsed_ms
        }

        save_agent_run({
            "animal_id": animal_uuid,
            "agent_name": cls.name,
            "status": "COMPLETED",
            "input_data": {
                "animal_id": animal.get("animal_id"),
                "input_temperature": temperature,
                "input_feeding": feeding_percentage,
                "input_activity": activity_percentage,
                "image_present": image_url is not None
            },
            "output_data": orchestrator_summary,
            "execution_time_ms": total_elapsed_ms
        })

        return {
            "animal": updated_animal,
            "risk": risk_data,
            "sensor": sensor_data,
            "behavior": behavior_data,
            "vision": vision_data,
            "knowledge": knowledge_data,
            "report": report_data,
            "alert": alert_record,
            "orchestrator": orchestrator_summary
        }

    @classmethod
    async def run_herd_screening(
        cls,
        run_id: str,
        animal_ids: List[str],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Coordinates batch multi-agent screening across multiple selected herd animals.
        Tracks per-animal status, handles failures gracefully, performs automatic categorization,
        and generates a preliminary Herd Summary Report.
        """
        from app.agents.appearance_agent import AppearanceAgent
        from app.database import supabase_client as db

        run = db.get_screening_run(run_id)
        if not run:
            raise ValueError(f"Screening run {run_id} not found")

        db.update_screening_run(run_id, {"status": "IN_PROGRESS"})

        screened_count = 0
        failed_count = 0
        cat_counts = {
            "LOW RISK": 0,
            "NEEDS MORE INFORMATION": 0,
            "MEDIUM RISK": 0,
            "HIGH RISK": 0,
            "CRITICAL CONCERN": 0
        }

        for animal_id_or_uuid in animal_ids:
            animal = db.get_animal(animal_id_or_uuid)
            if not animal:
                failed_count += 1
                continue

            animal_uuid = str(animal["id"])
            animal_code = animal.get("animal_id", "UNKNOWN")

            # Update status to PROCESSING
            db.update_screening_run_animal(run_id, animal_uuid, {"status": "PROCESSING"})

            try:
                # 1. Fetch available observations & history
                history = db.get_animal_history(animal_uuid)
                latest_obs = (history.get("observations") or [{}])[0] if history.get("observations") else {}
                
                has_image = bool(animal.get("image_url"))
                has_obs = bool(latest_obs)
                
                # Extract telemetry if available
                temp = float(latest_obs.get("temperature") or 38.5) if has_obs else 38.5
                feeding_pct = float(latest_obs.get("feeding_percentage") or 100.0) if has_obs else 100.0
                activity_pct = float(latest_obs.get("activity_percentage") or 100.0) if has_obs else 100.0
                behavior_notes = str(latest_obs.get("behavior_notes") or animal.get("notes") or "")

                # 2. Run specialist agents based on available provenance
                sensor_data = {}
                if has_obs:
                    sensor_data = await SensorAgent.run(
                        animal=animal,
                        temperature=temp,
                        feeding_percentage=feeding_pct,
                        activity_percentage=activity_pct,
                        behavior_notes=behavior_notes
                    )

                behavior_data = {}
                if has_obs:
                    behavior_data = await BehaviorAgent.run(
                        animal=animal,
                        current_feeding=feeding_pct,
                        current_activity=activity_pct,
                        behavior_notes=behavior_notes
                    )

                vision_data = {}
                appearance_data = {}
                if has_image:
                    vision_data = await VisionAgent.run(
                        animal=animal,
                        image_url=animal.get("image_url"),
                        temperature=temp,
                        behavior_notes=behavior_notes
                    )
                    appearance_data = await AppearanceAgent.analyze(
                        animal=animal,
                        vision_data=vision_data
                    )

                # 3. Risk Assessment Agent in preliminary screening mode
                risk_data = await RiskAgent.run(
                    animal=animal,
                    sensor_data=sensor_data,
                    behavior_data=behavior_data,
                    vision_data=vision_data,
                    appearance_data=appearance_data,
                    is_preliminary=True
                )

                category = risk_data.get("category", "NEEDS MORE INFORMATION")
                score = risk_data.get("risk_score", 0.0)

                # Identify missing information explicitly
                missing_info = []
                if not has_obs:
                    missing_info.append("Historical feeding and temperature telemetry absent")
                if not has_image:
                    missing_info.append("Visual appraisal image missing")
                if category in ("NEEDS MORE INFORMATION", "MEDIUM RISK", "HIGH RISK", "CRITICAL CONCERN"):
                    missing_info.append("Recent farmer feeding and appetite observation recommended")

                # Compile main observed findings
                observed_findings = []
                for factor in risk_data.get("factors", []):
                    if factor.get("numeric_weight", 0) > 0:
                        observed_findings.append(factor.get("detail", factor.get("name")))
                if not observed_findings:
                    observed_findings.append("No overt clinical distress observed in available parameters")

                # Determine recommended next step
                if category == "CRITICAL CONCERN":
                    next_step = "Urgent on-farm veterinary triage required."
                    feeding_req = "REQUESTED"
                elif category == "HIGH RISK":
                    next_step = "Prompt veterinary assessment advised; complete feeding questionnaire."
                    feeding_req = "REQUESTED"
                elif category == "MEDIUM RISK":
                    next_step = "Monitor closely; input detailed feeding observations."
                    feeding_req = "REQUESTED"
                elif category == "NEEDS MORE INFORMATION":
                    next_step = "Provide feeding questionnaire observations to finalize screening."
                    feeding_req = "REQUESTED"
                else:
                    next_step = "Maintain standard herd nutrition and pasture management."
                    feeding_req = "NOT_REQUESTED"

                cat_counts[category] = cat_counts.get(category, 0) + 1
                screened_count += 1

                # Update animal screening record
                db.update_screening_run_animal(run_id, animal_uuid, {
                    "status": "COMPLETED",
                    "initial_category": category,
                    "final_category": category if category == "LOW RISK" else None,
                    "initial_risk_score": score,
                    "observed_findings": observed_findings,
                    "missing_information": missing_info,
                    "feeding_status": feeding_req,
                    "recommended_next_step": next_step
                })
                # Update run progress in real time and yield to event loop
                db.update_screening_run(run_id, {
                    "screened_animals": screened_count,
                    "failed_animals": failed_count
                })
                await asyncio.sleep(0.05)

            except Exception as e:
                logger.error(f"Error screening animal {animal_code}: {e}")
                failed_count += 1
                cat_counts["NEEDS MORE INFORMATION"] += 1
                db.update_screening_run_animal(run_id, animal_uuid, {
                    "status": "FAILED",
                    "error_message": str(e),
                    "initial_category": "NEEDS MORE INFORMATION",
                    "recommended_next_step": "Screening interrupted; retry assessment."
                })

        # 4. Generate Herd Summary Report
        summary_content = {
            "run_id": run_id,
            "farm": run.get("farm", "General Herd"),
            "date": str(run.get("created_at") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())),
            "total_animals": len(animal_ids),
            "screened_animals": screened_count,
            "failed_animals": failed_count,
            "category_counts": cat_counts,
            "prompt_attention_count": cat_counts["HIGH RISK"] + cat_counts["CRITICAL CONCERN"],
            "awaiting_feeding_count": cat_counts["NEEDS MORE INFORMATION"] + cat_counts["MEDIUM RISK"],
            "limitations": [
                "Screening is a decision-support heuristic, not a definitive veterinary diagnosis.",
                "IoT telemetry and image availability vary across individual herd members."
            ]
        }

        recommendations = (
            f"Of {screened_count} screened livestock, {cat_counts['CRITICAL CONCERN']} require urgent veterinary triage "
            f"and {cat_counts['HIGH RISK']} warrant prompt evaluation. "
            f"{cat_counts['NEEDS MORE INFORMATION']} animals await feeding observations to resolve ambiguous risk indicators."
        )

        db.save_herd_summary_report(run_id, run.get("farm", "General Herd"), summary_content, recommendations)

        # 5. Finalize Screening Run Record
        db.update_screening_run(run_id, {
            "status": "COMPLETED",
            "screened_animals": screened_count,
            "failed_animals": failed_count,
            "needs_info_count": cat_counts["NEEDS MORE INFORMATION"],
            "low_risk_count": cat_counts["LOW RISK"],
            "medium_risk_count": cat_counts["MEDIUM RISK"],
            "high_risk_count": cat_counts["HIGH RISK"],
            "critical_count": cat_counts["CRITICAL CONCERN"],
            "completed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        })

        return summary_content

    @classmethod
    async def process_feeding_and_finalize_assessment(
        cls,
        run_id: str,
        animal_id: str,
        feeding_data_input: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Farmer follow-up: saves feeding observation, runs Feeding Intelligence Agent,
        updates final risk score and final category, and updates Herd Summary Report.
        """
        from app.agents.feeding_agent import FeedingIntelligenceAgent
        from app.agents.appearance_agent import AppearanceAgent
        from app.database import supabase_client as db

        animal = db.get_animal(animal_id)
        if not animal:
            raise ValueError(f"Animal {animal_id} not found")

        animal_uuid = str(animal["id"])
        animal_code = animal.get("animal_id")

        # 1. Save feeding observation
        feeding_obs = db.save_feeding_observation({
            "animal_id": animal_uuid,
            "run_id": run_id,
            "user_id": user_id,
            "usual_routine": feeding_data_input.get("usual_routine", "Standard pasture and ration"),
            "estimated_intake_percent": float(feeding_data_input.get("estimated_intake_percent", 100)),
            "appetite_change": feeding_data_input.get("appetite_change", "NORMAL"),
            "missed_sessions": int(feeding_data_input.get("missed_sessions", 0)),
            "feed_type": feeding_data_input.get("feed_type", "Mixed ration"),
            "recent_feed_change": feeding_data_input.get("recent_feed_change", "No recent change"),
            "water_consumption": feeding_data_input.get("water_consumption", "NORMAL"),
            "onset_timing": feeding_data_input.get("onset_timing", "TODAY"),
            "notes": feeding_data_input.get("notes", "")
        })

        # 2. Run Feeding Intelligence Agent
        feeding_result = await FeedingIntelligenceAgent.evaluate_feeding(
            animal=animal,
            observation=feeding_obs,
            run_id=run_id
        )

        # 3. Retrieve prior telemetry and vision data
        history = db.get_animal_history(animal_uuid)
        latest_obs = (history.get("observations") or [{}])[0] if history.get("observations") else {}
        sensor_data = {}
        if latest_obs:
            sensor_data = {
                "temperature": float(latest_obs.get("temperature", 38.5)),
                "baseline_temperature": 38.5,
                "temperature_deviation": float(latest_obs.get("temperature", 38.5)) - 38.5
            }

        vision_data = {}
        appearance_data = {}
        if animal.get("image_url"):
            vision_data = await VisionAgent.run(animal=animal, image_url=animal.get("image_url"))
            appearance_data = await AppearanceAgent.analyze(animal=animal, vision_data=vision_data)

        # 4. Final Risk Assessment with Feeding Evidence
        from app.services.risk_service import RiskService
        final_risk = RiskService.calculate_risk(
            sensor_data=sensor_data,
            vision_data=vision_data,
            appearance_data=appearance_data,
            feeding_data=feeding_result,
            is_preliminary=False
        )

        final_cat = final_risk.get("category", "LOW RISK")
        final_score = final_risk.get("risk_score", 0.0)

        # Update screening_run_animal
        db.update_screening_run_animal(run_id, animal_uuid, {
            "final_category": final_cat,
            "final_risk_score": final_score,
            "feeding_status": "ANALYZED",
            "recommended_next_step": feeding_result.get("recommended_next_step")
        })

        # Trigger alert if High / Critical
        if final_cat in ("HIGH RISK", "CRITICAL CONCERN"):
            AlertService.process_risk_alert(animal, final_risk)

        return {
            "animal_id": animal_code,
            "feeding_assessment": feeding_result,
            "final_risk": final_risk,
            "final_category": final_cat,
            "final_risk_score": final_score
        }

