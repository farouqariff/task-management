"""
One-time migration: decouple audit_logs from users.

What it does:
  1. Drops the FK constraint audit_logs.user_id -> users.id
  2. Adds user_email column (VARCHAR 120, nullable)
  3. Adds resource_label column (VARCHAR 255, nullable)

Run once:
    cd backend
    python migrate_audit.py
"""
import sys
from sqlalchemy import inspect, text
from app import create_app, db


def migrate():
    app = create_app()
    with app.app_context():
        engine = db.engine
        insp = inspect(engine)

        existing_cols = {col["name"] for col in insp.get_columns("audit_logs")}

        with engine.connect() as conn:
            # 1. Drop FK constraint if it still exists
            fks = insp.get_foreign_keys("audit_logs")
            for fk in fks:
                if "user_id" in fk.get("constrained_columns", []):
                    name = fk.get("name")
                    if name:
                        conn.execute(text(f'ALTER TABLE audit_logs DROP CONSTRAINT "{name}"'))
                        print(f"[ok] dropped FK constraint: {name}")
                    else:
                        print("[skip] FK has no name — may already be gone or unnamed")

            # 2. Add user_email column
            if "user_email" not in existing_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN user_email VARCHAR(120)"))
                print("[ok] added column: user_email")
            else:
                print("[skip] user_email already exists")

            # 3. Add resource_label column
            if "resource_label" not in existing_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN resource_label VARCHAR(255)"))
                print("[ok] added column: resource_label")
            else:
                print("[skip] resource_label already exists")

            conn.commit()

        print("\nMigration complete. Restart the backend.")


if __name__ == "__main__":
    sys.exit(migrate())
