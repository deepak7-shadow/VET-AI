"""
Script to wipe all seed/demo data from VET-AI database.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.database.supabase_client import get_db_connection

TABLES_TO_CLEAR = [
    "herd_summary_reports",
    "feeding_assessments",
    "screening_run_animals",
    "screening_runs",
    "agent_runs",
    "reports",
    "risk_assessments",
    "alerts",
    "image_analyses",
    "health_observations",
    "animals",
]

print("Clearing all demo/seed data from VET-AI database...\n")

try:
    conn = get_db_connection()
    cur = conn.cursor()

    for table in TABLES_TO_CLEAR:
        try:
            cur.execute(f'DELETE FROM "{table}";')
            print(f"  [OK] Cleared table: {table} ({cur.rowcount} rows deleted)")
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"  [SKIP] Table {table}: {e}")

    cur.close()
    conn.close()
    print("\nDone -- database is clean. You can now add your own livestock data.")
except Exception as e:
    print(f"\n[ERROR] Connection failed: {e}")
