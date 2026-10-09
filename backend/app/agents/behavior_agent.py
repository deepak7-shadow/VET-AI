import time
from typing import Dict, Any, List
from app.database.supabase_client import get_db_connection, save_agent_run
from psycopg2.extras import RealDictCursor

class BehaviorAgent:
    name: str = "Behavior Agent"

    @classmethod
    async def run(
        cls,
        animal: Dict[str, Any],
        current_feeding: float,
        current_activity: float,
        behavior_notes: str = ""
    ) -> Dict[str, Any]:
        start_time = time.time()
        animal_uuid = str(animal["id"])

        # Fetch historical baseline from Supabase
        conn = get_db_connection()
        baseline_feeding = 100.0
        baseline_activity = 100.0
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT 
                        AVG(feeding_percentage) as avg_feed,
                        AVG(activity_percentage) as avg_act
                    FROM health_observations
                    WHERE animal_id = %s
                    LIMIT 20;
                """, (animal_uuid,))
                hist = cur.fetchone()
                if hist and hist["avg_feed"] is not None:
                    baseline_feeding = float(hist["avg_feed"])
                    baseline_activity = float(hist["avg_act"])
        finally:
            conn.close()

        feeding_change = round(current_feeding - baseline_feeding, 1)
        activity_change = round(current_activity - baseline_activity, 1)

        behavior_indicators: List[str] = []
        if feeding_change <= -25:
            behavior_indicators.append(f"Severe anorexia: bunk consumption dropped {abs(feeding_change)}% below baseline")
        elif feeding_change <= -10:
            behavior_indicators.append(f"Depressed appetite: feed intake reduced {abs(feeding_change)}%")

        if activity_change <= -30:
            behavior_indicators.append(f"Locomotion suppression: motion index plummeted {abs(activity_change)}% with elevated recumbency")
        elif activity_change <= -10:
            behavior_indicators.append(f"Reduced daily activity: down {abs(activity_change)}%")

        if behavior_notes:
            behavior_indicators.append(f"Observed behavioral notes: {behavior_notes}")

        output_data = {
            "baseline_feeding": round(baseline_feeding, 1),
            "current_feeding": round(current_feeding, 1),
            "feeding_change": feeding_change,
            "baseline_activity": round(baseline_activity, 1),
            "current_activity": round(current_activity, 1),
            "activity_change": activity_change,
            "behavior_indicators": behavior_indicators,
            "notes": behavior_notes,
            "summary": (
                f"Feeding intake changed by {feeding_change:+}% (from baseline {baseline_feeding:.1f}% to {current_feeding:.1f}%) "
                f"and herd activity changed by {activity_change:+}% (from baseline {baseline_activity:.1f}% to {current_activity:.1f}%)."
            )
        }

        elapsed_ms = round((time.time() - start_time) * 1000, 1)

        # Log agent run
        save_agent_run({
            "animal_id": animal_uuid,
            "agent_name": cls.name,
            "status": "COMPLETED",
            "input_data": {
                "current_feeding": current_feeding,
                "current_activity": current_activity,
                "notes": behavior_notes
            },
            "output_data": output_data,
            "execution_time_ms": elapsed_ms
        })

        return output_data
