import os
import psycopg2
from pathlib import Path

from app.config import settings

DB_HOST = settings.DB_HOST
DB_NAME = settings.DB_NAME
DB_USER = settings.DB_USER
DB_PASS = settings.DB_PASS
DB_PORT = settings.DB_PORT

def run_migrations():
    print(f"Connecting to Supabase PostgreSQL at {DB_HOST}:{DB_PORT}...")
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
        sslmode="require",
        connect_timeout=15
    )
    conn.autocommit = True
    cur = conn.cursor()

    migration_dir = Path(__file__).parent.parent / "supabase" / "migrations"
    migrations = sorted(migration_dir.glob("*.sql"))

    for migration in migrations:
        print(f"\n--- Applying migration: {migration.name} ---")
        sql = migration.read_text(encoding="utf-8")
        cur.execute(sql)
        print(f"Successfully applied {migration.name}")

    print("\n--- Verifying Database Tables & Counts ---")
    tables = [
        "animals",
        "health_observations",
        "image_analysis",
        "risk_assessments",
        "alerts",
        "reports",
        "agent_runs",
        "knowledge_documents"
    ]
    for table in tables:
        cur.execute(f"SELECT count(*) FROM {table};")
        count = cur.fetchone()[0]
        print(f"Table '{table}': {count} rows")

    cur.close()
    conn.close()
    print("\nAll Supabase migrations successfully applied and verified!")

if __name__ == "__main__":
    run_migrations()
