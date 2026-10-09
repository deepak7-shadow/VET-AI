from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from app.database import supabase_client as db

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("", response_model=List[Dict[str, Any]])
def list_alerts(
    status: Optional[str] = Query(None, description="Filter by status (OPEN, ACKNOWLEDGED, RESOLVED)"),
    limit: int = Query(25, ge=1, le=100)
):
    try:
        return db.get_recent_alerts(limit=limit, status=status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    conn = db.get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE alerts 
                SET status = 'ACKNOWLEDGED', acknowledged_at = NOW() 
                WHERE id::text = %s
                RETURNING *;
            """, (alert_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Alert not found")
            return {"status": "success", "alert_id": alert_id, "state": "ACKNOWLEDGED"}
    finally:
        conn.close()

@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    conn = db.get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE alerts 
                SET status = 'RESOLVED' 
                WHERE id::text = %s
                RETURNING *;
            """, (alert_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Alert not found")
            return {"status": "success", "alert_id": alert_id, "state": "RESOLVED"}
    finally:
        conn.close()
