import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import settings

logger = logging.getLogger("vet_ai.database")

def safe_json_dumps(obj: Any) -> str:
    """Safely serialize JSON payloads containing datetime, UUID, Decimal, etc."""
    return json.dumps(obj, default=str)

def get_db_connection():
    """Establish and return a connection to Supabase PostgreSQL."""
    try:
        conn = psycopg2.connect(
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASS,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            sslmode="require",
            connect_timeout=10
        )
        conn.autocommit = True
        return conn
    except Exception as e:
        logger.error(f"Error connecting to Supabase PostgreSQL: {e}")
        raise e

# --- Reusable Database Service Functions ---

def get_animals(species: Optional[str] = None, status: Optional[str] = None, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = "SELECT * FROM animals WHERE 1=1"
            params = []
            if user_id:
                query += " AND (user_id = %s OR user_id IS NULL)"
                params.append(user_id)
            if species:
                query += " AND species = %s"
                params.append(species)
            if status:
                query += " AND status = %s"
                params.append(status)
            query += " ORDER BY current_risk_score DESC, updated_at DESC;"
            cur.execute(query, params)
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    finally:
        conn.close()

def get_animal(animal_id_or_uuid: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if it's UUID or string animal_id like COW-027
            cur.execute("""
                SELECT * FROM animals 
                WHERE id::text = %s OR animal_id = %s
                LIMIT 1;
            """, (animal_id_or_uuid, animal_id_or_uuid))
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()

def create_animal(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO animals (animal_id, species, breed, age, gender, farm, image_url, status, current_risk_score, current_risk_level, user_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                data["animal_id"],
                data["species"],
                data.get("breed", "Unknown"),
                data.get("age", 2.0),
                data.get("gender", "Female"),
                data.get("farm", "General Herd"),
                data.get("image_url", "https://images.unsplash.com/photo-1546445317-29f4545e9d53"),
                data.get("status", "Healthy"),
                data.get("current_risk_score", 0),
                data.get("current_risk_level", "LOW"),
                data.get("user_id")
            ))
            row = cur.fetchone()
            return dict(row)
    finally:
        conn.close()

def update_animal(animal_uuid: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            fields = []
            values = []
            for k, v in data.items():
                if k in ["status", "current_risk_score", "current_risk_level", "image_url", "farm", "age", "breed"]:
                    fields.append(f"{k} = %s")
                    values.append(v)
            if not fields:
                return get_animal(animal_uuid)
            values.append(animal_uuid)
            query = f"UPDATE animals SET {', '.join(fields)} WHERE id::text = %s RETURNING *;"
            cur.execute(query, values)
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()

def save_observation(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO health_observations (animal_id, temperature, feeding_percentage, activity_percentage, behavior_notes, observation_source)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                data["animal_id"],
                data.get("temperature", 38.5),
                data.get("feeding_percentage", 100.0),
                data.get("activity_percentage", 100.0),
                data.get("behavior_notes", ""),
                data.get("observation_source", "IoT Telemetry")
            ))
            row = cur.fetchone()
            return dict(row)
    finally:
        conn.close()

def save_image_analysis(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO image_analysis (animal_id, image_url, observations, risk_indicators, confidence, model_name)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                data["animal_id"],
                data.get("image_url", ""),
                json.dumps(data.get("observations", [])),
                json.dumps(data.get("risk_indicators", [])),
                data.get("confidence", 0.85),
                data.get("model_name", "VET-Vision Agent")
            ))
            row = cur.fetchone()
            return dict(row)
    finally:
        conn.close()

def save_risk_assessment(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO risk_assessments (animal_id, risk_score, risk_level, confidence, factors, evidence)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                data["animal_id"],
                data["risk_score"],
                data["risk_level"],
                data.get("confidence", 0.85),
                json.dumps(data.get("factors", [])),
                json.dumps(data.get("evidence", {}))
            ))
            row = cur.fetchone()
            # Also update animal current risk
            cur.execute("""
                UPDATE animals 
                SET current_risk_score = %s, 
                    current_risk_level = %s,
                    status = CASE 
                        WHEN %s >= 60 THEN 'High Risk'
                        WHEN %s >= 30 THEN 'Monitoring'
                        ELSE 'Healthy'
                    END
                WHERE id::text = %s;
            """, (data["risk_score"], data["risk_level"], data["risk_score"], data["risk_score"], str(data["animal_id"])))
            return dict(row)
    finally:
        conn.close()

def create_alert(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO alerts (animal_id, severity, title, message, status)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                data["animal_id"],
                data["severity"],
                data["title"],
                data["message"],
                data.get("status", "OPEN")
            ))
            row = cur.fetchone()
            return dict(row)
    finally:
        conn.close()

def save_report(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO reports (animal_id, summary, recommendations, evidence, risk_score, risk_level, report_content)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                data["animal_id"],
                data.get("summary", ""),
                data.get("recommendations", ""),
                json.dumps(data.get("evidence", {})),
                data.get("risk_score", 0),
                data.get("risk_level", "LOW"),
                data.get("report_content", "")
            ))
            row = cur.fetchone()
            return dict(row)
    finally:
        conn.close()

def save_agent_run(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO agent_runs (animal_id, agent_name, status, input_data, output_data, execution_time_ms)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                data.get("animal_id"),
                data["agent_name"],
                data.get("status", "COMPLETED"),
                json.dumps(data.get("input_data", {})),
                json.dumps(data.get("output_data", {})),
                data.get("execution_time_ms", 0)
            ))
            row = cur.fetchone()
            return dict(row)
    finally:
        conn.close()

def get_animal_history(animal_id_or_uuid: str) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            animal = get_animal(animal_id_or_uuid)
            if not animal:
                return {}
            a_id = str(animal["id"])
            
            cur.execute("SELECT * FROM health_observations WHERE animal_id = %s ORDER BY created_at ASC;", (a_id,))
            observations = [dict(r) for r in cur.fetchall()]
            
            cur.execute("SELECT * FROM image_analysis WHERE animal_id = %s ORDER BY created_at DESC LIMIT 5;", (a_id,))
            analyses = [dict(r) for r in cur.fetchall()]
            
            cur.execute("SELECT * FROM risk_assessments WHERE animal_id = %s ORDER BY created_at DESC LIMIT 10;", (a_id,))
            assessments = [dict(r) for r in cur.fetchall()]
            
            cur.execute("SELECT * FROM alerts WHERE animal_id = %s ORDER BY created_at DESC LIMIT 10;", (a_id,))
            alerts = [dict(r) for r in cur.fetchall()]
            
            cur.execute("SELECT * FROM reports WHERE animal_id = %s ORDER BY created_at DESC LIMIT 10;", (a_id,))
            reports = [dict(r) for r in cur.fetchall()]

            cur.execute("SELECT * FROM agent_runs WHERE animal_id = %s ORDER BY created_at DESC LIMIT 20;", (a_id,))
            agent_runs = [dict(r) for r in cur.fetchall()]

            return {
                "animal": animal,
                "observations": observations,
                "image_analysis": analyses,
                "risk_assessments": assessments,
                "alerts": alerts,
                "reports": reports,
                "agent_runs": agent_runs
            }
    finally:
        conn.close()

def get_recent_alerts(limit: int = 20, status: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
                SELECT al.*, an.animal_id, an.species, an.breed, an.farm
                FROM alerts al
                JOIN animals an ON al.animal_id = an.id
                WHERE 1=1
            """
            params = []
            if status:
                query += " AND al.status = %s"
                params.append(status)
            query += " ORDER BY al.created_at DESC LIMIT %s;"
            params.append(limit)
            cur.execute(query, params)
            return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

def get_agent_activity(animal_id_or_uuid: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if animal_id_or_uuid:
                animal = get_animal(animal_id_or_uuid)
                a_id = str(animal["id"]) if animal else animal_id_or_uuid
                cur.execute("""
                    SELECT ar.*, an.animal_id as animal_code, an.species
                    FROM agent_runs ar
                    LEFT JOIN animals an ON ar.animal_id = an.id
                    WHERE ar.animal_id::text = %s
                    ORDER BY ar.created_at DESC
                    LIMIT %s;
                """, (a_id, limit))
            else:
                cur.execute("""
                    SELECT ar.*, an.animal_id as animal_code, an.species
                    FROM agent_runs ar
                    LEFT JOIN animals an ON ar.animal_id = an.id
                    ORDER BY ar.created_at DESC
                    LIMIT %s;
                """, (limit,))
            return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

def get_knowledge_documents(category: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if category:
                cur.execute("SELECT * FROM knowledge_documents WHERE category = %s ORDER BY created_at DESC;", (category,))
            else:
                cur.execute("SELECT * FROM knowledge_documents ORDER BY created_at DESC;")
            return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

def get_dashboard_stats() -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    COUNT(*) as total_animals,
                    COUNT(*) FILTER (WHERE status = 'Healthy') as healthy_count,
                    COUNT(*) FILTER (WHERE status = 'Monitoring') as monitoring_count,
                    COUNT(*) FILTER (WHERE status = 'High Risk') as high_risk_count,
                    AVG(current_risk_score) as avg_risk_score
                FROM animals;
            """)
            counts = dict(cur.fetchone() or {})
            
            # Risk distribution groups
            cur.execute("""
                SELECT 
                    COUNT(*) FILTER (WHERE current_risk_score < 30) as low_count,
                    COUNT(*) FILTER (WHERE current_risk_score >= 30 AND current_risk_score < 60) as moderate_count,
                    COUNT(*) FILTER (WHERE current_risk_score >= 60 AND current_risk_score < 80) as high_count,
                    COUNT(*) FILTER (WHERE current_risk_score >= 80) as critical_count
                FROM animals;
            """)
            dist = dict(cur.fetchone() or {})

            # Recent alerts count
            cur.execute("SELECT COUNT(*) FROM alerts WHERE status = 'OPEN';")
            open_alerts = cur.fetchone()["count"]

            return {
                "total_animals": counts.get("total_animals", 0),
                "healthy_count": counts.get("healthy_count", 0),
                "monitoring_count": counts.get("monitoring_count", 0),
                "high_risk_count": counts.get("high_risk_count", 0),
                "avg_risk_score": round(float(counts.get("avg_risk_score") or 0), 1),
                "open_alerts": open_alerts,
                "distribution": {
                    "low": dist.get("low_count", 0),
                    "moderate": dist.get("moderate_count", 0),
                    "high": dist.get("high_count", 0),
                    "critical": dist.get("critical_count", 0)
                }
            }
    finally:
        conn.close()

# --- Herd Screening & Feeding Intelligence Database Methods ---

def bulk_create_animals(animals_list: List[Dict[str, Any]], user_id: Optional[str] = None) -> Dict[str, Any]:
    """Bulk inserts animals, skipping duplicates, enforcing user ownership."""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            created = []
            skipped = []
            errors = []

            for item in animals_list:
                animal_code = str(item.get("animal_id", "")).strip().upper()
                if not animal_code:
                    errors.append({"item": item, "reason": "Missing animal_id"})
                    continue

                # Check existence
                cur.execute("SELECT id, animal_id FROM animals WHERE animal_id = %s;", (animal_code,))
                existing = cur.fetchone()
                if existing:
                    skipped.append(animal_code)
                    continue

                try:
                    cur.execute("""
                        INSERT INTO animals (
                            animal_id, species, breed, age, gender, farm, herd_group, notes,
                            image_url, status, current_risk_score, current_risk_level, user_id
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING *;
                    """, (
                        animal_code,
                        item.get("species", "Cattle").strip(),
                        item.get("breed", "Unknown").strip(),
                        float(item.get("age") or 2.0),
                        item.get("gender", "Female").strip(),
                        item.get("farm", "General Herd").strip(),
                        item.get("herd_group", "General").strip(),
                        item.get("notes", "").strip(),
                        item.get("image_url") or "https://images.unsplash.com/photo-1546445317-29f4545e9d53",
                        item.get("status", "Healthy"),
                        float(item.get("current_risk_score") or 0.0),
                        item.get("current_risk_level", "LOW"),
                        user_id
                    ))
                    created_row = cur.fetchone()
                    created.append(dict(created_row))
                except Exception as ex:
                    errors.append({"animal_id": animal_code, "reason": str(ex)})

            return {
                "created_count": len(created),
                "skipped_count": len(skipped),
                "error_count": len(errors),
                "created": created,
                "skipped": skipped,
                "errors": errors
            }
    finally:
        conn.close()

def create_screening_run(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO screening_runs (
                    farm, species_filter, user_id, status, total_animals, metadata
                ) VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                data.get("farm", "General Herd"),
                data.get("species_filter", "ALL"),
                data.get("user_id"),
                data.get("status", "IN_PROGRESS"),
                data.get("total_animals", 0),
                json.dumps(data.get("metadata", {}))
            ))
            return dict(cur.fetchone())
    finally:
        conn.close()

def get_screening_run(run_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM screening_runs WHERE id = %s;", (run_id,))
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()

def list_screening_runs(limit: int = 20) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM screening_runs 
                ORDER BY created_at DESC 
                LIMIT %s;
            """, (limit,))
            return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

def update_screening_run(run_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            set_clauses = []
            params = []
            for k, v in updates.items():
                if k == "metadata":
                    set_clauses.append("metadata = %s")
                    params.append(json.dumps(v))
                else:
                    set_clauses.append(f"{k} = %s")
                    params.append(v)
            if not set_clauses:
                return get_screening_run(run_id)
            params.append(run_id)
            query = f"UPDATE screening_runs SET {', '.join(set_clauses)} WHERE id = %s RETURNING *;"
            cur.execute(query, params)
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()

def add_screening_run_animals(run_id: str, animals_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            records = []
            for item in animals_data:
                cur.execute("""
                    INSERT INTO screening_run_animals (
                        run_id, animal_id, animal_code, species, breed, farm, status,
                        initial_category, initial_risk_score, observed_findings, missing_information,
                        feeding_status, recommended_next_step
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (run_id, animal_id) DO UPDATE SET
                        status = EXCLUDED.status,
                        initial_category = EXCLUDED.initial_category,
                        initial_risk_score = EXCLUDED.initial_risk_score,
                        updated_at = NOW()
                    RETURNING *;
                """, (
                    run_id,
                    item["animal_id"],
                    item["animal_code"],
                    item.get("species", "Cattle"),
                    item.get("breed", "Unknown"),
                    item.get("farm", "General Herd"),
                    item.get("status", "PENDING"),
                    item.get("initial_category", "NEEDS MORE INFORMATION"),
                    item.get("initial_risk_score", 0),
                    json.dumps(item.get("observed_findings", [])),
                    json.dumps(item.get("missing_information", [])),
                    item.get("feeding_status", "NOT_REQUESTED"),
                    item.get("recommended_next_step", "Awaiting preliminary screening")
                ))
                records.append(dict(cur.fetchone()))
            return records
    finally:
        conn.close()

def get_screening_run_animals(run_id: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
                SELECT sra.*, a.image_url, a.age, a.gender, a.herd_group, a.notes
                FROM screening_run_animals sra
                JOIN animals a ON sra.animal_id = a.id
                WHERE sra.run_id = %s
            """
            params = [run_id]
            if category and category != "ALL":
                query += " AND (sra.final_category = %s OR (sra.final_category IS NULL AND sra.initial_category = %s))"
                params.extend([category, category])
            query += " ORDER BY COALESCE(sra.final_risk_score, sra.initial_risk_score) DESC, sra.animal_code ASC;"
            cur.execute(query, params)
            return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

def update_screening_run_animal(run_id: str, animal_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            set_clauses = ["updated_at = NOW()"]
            params = []
            for k, v in updates.items():
                if k in ("observed_findings", "missing_information"):
                    set_clauses.append(f"{k} = %s")
                    params.append(json.dumps(v))
                else:
                    set_clauses.append(f"{k} = %s")
                    params.append(v)
            params.extend([run_id, animal_id])
            query = f"""
                UPDATE screening_run_animals 
                SET {', '.join(set_clauses)}
                WHERE run_id = %s AND (animal_id = %s OR animal_code = %s)
                RETURNING *;
            """
            params_full = params[:-1] + [animal_id, animal_id]
            cur.execute(query, params_full)
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()

def save_feeding_observation(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO feeding_observations (
                    animal_id, run_id, user_id, observation_time, usual_routine,
                    estimated_intake_percent, appetite_change, missed_sessions,
                    feed_type, recent_feed_change, water_consumption, onset_timing,
                    behavior_notes, notes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                data["animal_id"],
                data.get("run_id"),
                data.get("user_id"),
                data.get("observation_time", datetime.utcnow().isoformat()),
                data.get("usual_routine", "Twice daily pasture and silage"),
                float(data.get("estimated_intake_percent", 100)),
                data.get("appetite_change", "NORMAL"),
                int(data.get("missed_sessions", 0)),
                data.get("feed_type", "Mixed ration"),
                data.get("recent_feed_change", "No recent change"),
                data.get("water_consumption", "NORMAL"),
                data.get("onset_timing", "TODAY"),
                data.get("behavior_notes", ""),
                data.get("notes", "")
            ))
            return dict(cur.fetchone())
    finally:
        conn.close()

def get_animal_feeding_observations(animal_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM feeding_observations
                WHERE animal_id = %s OR animal_id IN (SELECT id FROM animals WHERE animal_id = %s)
                ORDER BY created_at DESC
                LIMIT %s;
            """, (animal_id, animal_id, limit))
            return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

def save_feeding_assessment(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO feeding_assessments (
                    animal_id, run_id, observation_id, feeding_status, baseline_available,
                    baseline_source, comparison, evidence, confidence, limitations, recommended_next_step
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                data["animal_id"],
                data.get("run_id"),
                data.get("observation_id"),
                data.get("feeding_status", "INSUFFICIENT_DATA"),
                data.get("baseline_available", False),
                data.get("baseline_source", "none"),
                safe_json_dumps(data.get("comparison", {})),
                safe_json_dumps(data.get("evidence", [])),
                data.get("confidence", "moderate"),
                safe_json_dumps(data.get("limitations", [])),
                data.get("recommended_next_step", "")
            ))
            return dict(cur.fetchone())
    finally:
        conn.close()

def save_herd_summary_report(run_id: str, farm: str, summary_content: Dict[str, Any], recommendations: str = "") -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO herd_summary_reports (run_id, farm, summary_content, recommendations)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (run_id) DO UPDATE SET
                    summary_content = EXCLUDED.summary_content,
                    recommendations = EXCLUDED.recommendations
                RETURNING *;
            """, (run_id, farm, safe_json_dumps(summary_content), recommendations))
            return dict(cur.fetchone())
    finally:
        conn.close()

def get_herd_summary_report(run_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM herd_summary_reports WHERE run_id = %s;", (run_id,))
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()

