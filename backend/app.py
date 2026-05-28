from __future__ import annotations

from server import create_app


# Render entry point: uvicorn app:app --host 0.0.0.0 --port 10000
app = create_app()
