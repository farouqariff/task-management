#!/bin/sh
set -e

echo "[entrypoint] waiting for MySQL to be ready..."
until python - <<'EOF'
import os, sys, re
try:
    import pymysql
    url = os.environ.get("DATABASE_URL", "")
    m = re.match(r"mysql\+pymysql://([^:]+):([^@]+)@([^:/]+):?(\d+)?/(.+)", url)
    if not m:
        sys.exit(1)
    user, password, host, port, db = m.groups()
    conn = pymysql.connect(host=host, port=int(port or 3306), user=user, password=password, database=db)
    conn.close()
    sys.exit(0)
except Exception as e:
    print(f"  not ready: {e}", file=sys.stderr)
    sys.exit(1)
EOF
do
    echo "[entrypoint] database not ready, retrying in 3s..."
    sleep 3
done

echo "[entrypoint] seeding database..."
python seed_admin.py

echo "[entrypoint] starting gunicorn..."
exec gunicorn --bind 0.0.0.0:5000 --workers 2 run:app
