import time
from typing import Dict, Any, List
from app.services.rag_service import RAGService
from app.database.supabase_client import save_agent_run

class KnowledgeAgent:
    name: str = "Knowledge Agent"

    @classmethod
    async def run(
        cls,
        animal: Dict[str, Any],
        risk_data: Dict[str, Any],
        sensor_data: Dict[str, Any],
        behavior_notes: str = ""
    ) -> Dict[str, Any]:
        start_time = time.time()
        animal_uuid = str(animal["id"])

        # Extract search tokens from findings
        query_terms = [animal.get("species", "Cattle")]
        if sensor_data.get("temperature_deviation", 0) > 0.5:
            query_terms.extend(["pyrexia", "fever", "temperature", "hyperthermia", "respiratory", "brd"])
        if sensor_data.get("feeding_change", 0) < -15:
            query_terms.extend(["feeding", "anorexia", "intake", "rumen", "acidosis"])
        if sensor_data.get("activity_change", 0) < -20:
            query_terms.extend(["lameness", "locomotion", "lethargy", "mastitis"])
        
        if behavior_notes:
            query_terms.extend(behavior_notes.lower().split())

        # Retrieve relevant veterinary knowledge from Supabase
        retrieved_docs = RAGService.retrieve_relevant_knowledge(query_terms, top_k=3)

        output_data = {
            "query_terms": list(set(query_terms)),
            "retrieved_documents": retrieved_docs,
            "match_count": len(retrieved_docs),
            "summary": f"Retrieved {len(retrieved_docs)} authoritative veterinary reference documents matching observed symptoms."
        }

        elapsed_ms = round((time.time() - start_time) * 1000, 1)

        # Log agent run
        save_agent_run({
            "animal_id": animal_uuid,
            "agent_name": cls.name,
            "status": "COMPLETED",
            "input_data": {"query_terms": query_terms},
            "output_data": output_data,
            "execution_time_ms": elapsed_ms
        })

        return output_data
