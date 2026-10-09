from fastapi import APIRouter, HTTPException, Query, Response, Depends
from typing import List, Dict, Any, Optional
from app.database import supabase_client as db
from app.services.pdf_service import generate_veterinary_report_pdf
from app.services.auth_service import get_current_user_optional
from psycopg2.extras import RealDictCursor

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("", response_model=List[Dict[str, Any]])
def list_reports(
    limit: int = Query(30, ge=1, le=100),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    List reports for the authenticated farmer or demo records.
    """
    conn = db.get_db_connection()
    try:
        user_id = current_user.get("id") if current_user else None
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if user_id:
                cur.execute("""
                    SELECT r.*, a.animal_id, a.species, a.breed, a.farm, a.image_url
                    FROM reports r
                    JOIN animals a ON r.animal_id = a.id
                    WHERE r.user_id = %s OR r.user_id IS NULL
                    ORDER BY r.created_at DESC
                    LIMIT %s;
                """, (user_id, limit))
            else:
                cur.execute("""
                    SELECT r.*, a.animal_id, a.species, a.breed, a.farm, a.image_url
                    FROM reports r
                    JOIN animals a ON r.animal_id = a.id
                    ORDER BY r.created_at DESC
                    LIMIT %s;
                """, (limit,))
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()

@router.get("/{report_id}", response_model=Dict[str, Any])
def get_report(
    report_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    conn = db.get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT r.*, a.animal_id, a.species, a.breed, a.farm, a.image_url, a.age, a.gender
                FROM reports r
                JOIN animals a ON r.animal_id = a.id
                WHERE r.id::text = %s
                LIMIT 1;
            """, (report_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Veterinary clinical report not found")
            return dict(row)
    finally:
        conn.close()

@router.get("/{report_id}/download")
def download_report_pdf(
    report_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Generates and returns an official printable PDF veterinary assessment report.
    """
    conn = db.get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT r.*, a.animal_id, a.species, a.breed, a.farm, a.image_url, a.age, a.gender
                FROM reports r
                JOIN animals a ON r.animal_id = a.id
                WHERE r.id::text = %s
                LIMIT 1;
            """, (report_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Veterinary report not found for PDF export")
            
            report_data = dict(row)
            pdf_bytes = generate_veterinary_report_pdf(report_data)
            
            animal_code = report_data.get("animal_id", "ANIMAL")
            clean_id = str(report_data.get("id", "REPORT"))[:8]
            filename = f"VET-AI_Report_{animal_code}_{clean_id}.pdf"
            
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                    "Content-Type": "application/pdf"
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate veterinary report PDF: {str(e)}")
    finally:
        conn.close()
