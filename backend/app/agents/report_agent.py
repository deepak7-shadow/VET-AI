import time
from typing import Dict, Any
from app.services.ai_service import generate_text
from app.database.supabase_client import save_report, save_agent_run

SAFETY_DISCLAIMER = (
    "VET-AI provides AI-assisted health-risk monitoring and decision support. "
    "It does not provide a definitive veterinary diagnosis. "
    "Consult a qualified veterinarian for clinical evaluation."
)

class ReportAgent:
    name: str = "Report Agent"

    @classmethod
    async def run(
        cls,
        animal: Dict[str, Any],
        risk_data: Dict[str, Any],
        knowledge_data: Dict[str, Any],
        sensor_data: Dict[str, Any],
        behavior_data: Dict[str, Any],
        vision_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        start_time = time.time()
        animal_uuid = str(animal["id"])
        animal_code = animal.get("animal_id", "ANIMAL")
        breed = animal.get("breed", "Livestock")
        risk_score = risk_data.get("risk_score", 0)
        risk_level = risk_data.get("risk_level", "LOW")

        # Check for excreta screening evidence
        excreta = vision_data.get("excreta_screening")
        excreta_evidence = ""
        if excreta:
            top_ind = excreta.get("top_indication", "N/A")
            top_p = float(excreta.get("top_probability", 0.0))
            s_type = (excreta.get("sample_type") or "manure_closeup").replace("_", " ").title()
            triage_rep = excreta.get("veterinary_triage_report", {})
            req_tests = ", ".join(triage_rep.get("mandatory_confirmatory_tests", ["Fecal/urine diagnostic test"]))
            excreta_evidence = (
                f"\n- Visual Excreta Screening ({s_type}): Primary visual indication is {top_ind} ({top_p:.1f}% probability, {excreta.get('risk_tier')}).\n"
                f"  * Mandatory Confirmatory Lab Diagnostics: {req_tests}\n"
                f"  * Clinical Note: Visual appearance alone cannot reliably diagnose this disease. Veterinary examination and laboratory confirmation required."
            )

        # Try Generative AI via Gemini
        prompt = f"""
        Generate a professional veterinary health assessment report:
        Animal: {animal_code} ({animal.get('species')}, Breed: {breed}, Age: {animal.get('age')} yrs)
        Risk Score: {risk_score}/100 ({risk_level} RISK)
        Sensor Evidence: Core Temp {sensor_data.get('temperature')}°C (Deviation: {sensor_data.get('temperature_deviation')}°C)
        Behavior Evidence: Feeding {behavior_data.get('feeding_change')}%, Activity {behavior_data.get('activity_change')}%
        Vision Evidence: {vision_data.get('summary')}{excreta_evidence}
        Veterinary Knowledge References: {[d['document'] for d in knowledge_data.get('retrieved_documents', [])]}

        MANDATORY CLINICAL SAFETY RULES:
        - Do NOT claim a definitive disease diagnosis.
        - Do NOT prescribe medications or specify dosages.
        - Use phrases like "Potential health risk detected." and "Veterinary evaluation recommended."
        - Format with:
          1. FARMER SUMMARY
          2. DETAILED EVIDENCE
          3. RISK EXPLANATION
          4. RECOMMENDED NEXT STEPS
          5. VETERINARY REVIEW RECOMMENDATION
        """

        sys_inst = (
            "You are a veterinary clinical intelligence reporter for VET-AI. "
            "Write concise, clear, and safety-compliant decision support reports."
        )

        gen_ai_text = await generate_text(prompt, system_instruction=sys_inst)

        if not gen_ai_text:
            # High-fidelity deterministic template complying strictly with clinical guidelines
            docs_summary = "\n".join([f"- {d['document']} (Source: {d['source']})" for d in knowledge_data.get("retrieved_documents", [])])
            gen_ai_text = f"""VET-AI CLINICAL DECISION SUPPORT ASSESSMENT
==================================================
Animal ID: {animal_code} | Breed: {breed} | Farm: {animal.get('farm', 'Herd')}
Assessment Time: Immediate Real-Time Analysis
Overall Risk Score: {risk_score}/100 [{risk_level} RISK]

1. FARMER SUMMARY
Potential health risk detected in animal {animal_code}. Telemetry and multimodal camera screening indicate deviation from historical norms across body temperature (+{sensor_data.get('temperature_deviation')}°C deviation), feed intake ({behavior_data.get('feeding_change'):+}%), and daily activity ({behavior_data.get('activity_change'):+}%).

2. DETAILED EVIDENCE
- Thermal Telemetry: Core temperature {sensor_data.get('temperature')}°C against baseline {sensor_data.get('baseline_temperature')}°C. Status: {sensor_data.get('status_flag', 'ALERT')}.
- Bunk Feeding Behavior: {behavior_data.get('current_feeding')}% current capacity vs {behavior_data.get('baseline_feeding')}% historical baseline ({behavior_data.get('feeding_change'):+}% shift).
- Collar Activity Index: {behavior_data.get('current_activity')}% motion rate vs {behavior_data.get('baseline_activity')}% normal ({behavior_data.get('activity_change'):+}% drop).
- Vision Inspection: {vision_data.get('summary')}{excreta_evidence}

3. RISK EXPLANATION
The multi-agent consensus weighted temperature elevation and visual indicators as primary contributors, aggravated by concurrent appetite depression and locomotion decline. This pattern corresponds with systemic stress or gastrointestinal/infectious involvement.

4. RETRIEVED VETERINARY KNOWLEDGE
{docs_summary}

5. RECOMMENDED NEXT STEPS
- Separate animal {animal_code} into a quiet, clean, and sheltered observation pen.
- Ensure constant access to fresh water and palatable roughage.
- Collect sterile manure/urine samples for laboratory confirmation (flotation, culture, or PCR).
- Re-check core temperature every 3 to 4 hours.

6. VETERINARY REVIEW RECOMMENDATION
Immediate veterinary evaluation recommended for clinical auscultation and laboratory diagnostic confirmation.

DISCLAIMER:
{SAFETY_DISCLAIMER}"""

        excreta_note = f" Visual screening noted possible {excreta.get('top_indication')}." if excreta else ""
        summary_snippet = (
            f"Potential health risk detected for {animal_code} ({risk_level} Risk - {risk_score}/100). "
            f"Multi-agent indicators show temperature deviation of +{sensor_data.get('temperature_deviation')}°C, "
            f"feeding drop of {abs(behavior_data.get('feeding_change'))}%, and mobility drop of {abs(behavior_data.get('activity_change'))}%.{excreta_note} "
            f"Veterinary evaluation recommended."
        )


        recommendations_snippet = (
            "1. Isolate in observation pen. "
            "2. Request immediate clinical veterinary evaluation. "
            "3. Ensure clean water availability. "
            "4. Monitor rectal temperature every 4 hours."
        )

        # Save to reports table in Supabase
        report_record = save_report({
            "animal_id": animal_uuid,
            "summary": summary_snippet,
            "recommendations": recommendations_snippet,
            "evidence": {
                "risk_score": risk_score,
                "risk_level": risk_level,
                "factors": risk_data.get("factors", []),
                "retrieved_docs": [d["document"] for d in knowledge_data.get("retrieved_documents", [])]
            },
            "risk_score": risk_score,
            "risk_level": risk_level,
            "report_content": gen_ai_text
        })

        elapsed_ms = round((time.time() - start_time) * 1000, 1)

        output_data = {
            "report_id": str(report_record.get("id")),
            "summary": summary_snippet,
            "recommendations": recommendations_snippet,
            "report_content": gen_ai_text,
            "disclaimer": SAFETY_DISCLAIMER
        }

        # Log agent run
        save_agent_run({
            "animal_id": animal_uuid,
            "agent_name": cls.name,
            "status": "COMPLETED",
            "input_data": {"risk_score": risk_score, "risk_level": risk_level},
            "output_data": output_data,
            "execution_time_ms": elapsed_ms
        })

        return output_data
