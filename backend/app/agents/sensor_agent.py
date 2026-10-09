import time
from typing import Dict, Any
from app.database.supabase_client import get_db_connection, save_observation, save_agent_run
from psycopg2.extras import RealDictCursor

class SensorAgent:
    name: str = "Sensor Agent"

    @classmethod
    async def run(
        cls,
        animal: Dict[str, Any],
        temperature: float,
        feeding_percentage: float,
        activity_percentage: float,
        behavior_notes: str = ""
    ) -> Dict[str, Any]:
        start_time = time.time()
        animal_uuid = str(animal["id"])

        # Retrieve baseline temperature from Supabase
        conn = get_db_connection()
        baseline_temp = 38.5
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT AVG(temperature) as avg_temp
                    FROM health_observations
                    WHERE animal_id = %s
                    LIMIT 20;
                """, (animal_uuid,))
                row = cur.fetchone()
                if row and row["avg_temp"] is not None:
                    baseline_temp = float(row["avg_temp"])
        finally:
            conn.close()

        temp_dev = round(temperature - baseline_temp, 2)
        feeding_change = round(feeding_percentage - 100.0, 1)
        activity_change = round(activity_percentage - 100.0, 1)

        # Save this health observation into Supabase
        save_observation({
            "animal_id": animal_uuid,
            "temperature": temperature,
            "feeding_percentage": feeding_percentage,
            "activity_percentage": activity_percentage,
            "behavior_notes": behavior_notes,
            "observation_source": "IoT Collar Sensor Telemetry"
        })

        output_data = {
            "temperature": round(temperature, 1),
            "baseline_temperature": round(baseline_temp, 1),
            "temperature_deviation": temp_dev,
            "feeding_change": feeding_change,
            "activity_change": activity_change,
            "status_flag": "HIGH_PYREXIA" if temp_dev >= 1.5 else ("ELEVATED_TEMP" if temp_dev >= 0.7 else "NORMAL_VITALS")
        }

        elapsed_ms = round((time.time() - start_time) * 1000, 1)

        # Log agent run
        save_agent_run({
            "animal_id": animal_uuid,
            "agent_name": cls.name,
            "status": "COMPLETED",
            "input_data": {
                "raw_temperature": temperature,
                "feeding": feeding_percentage,
                "activity": activity_percentage
            },
            "output_data": output_data,
            "execution_time_ms": elapsed_ms
        })

        return output_data
