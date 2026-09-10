"""AWS Lambda entrypoint.

The same FastAPI app that runs under uvicorn locally is served on Lambda through
Mangum. Configured in the SAM template as ``app.lambda_handler.handler``.
"""

from __future__ import annotations

from mangum import Mangum

from app.main import app

handler = Mangum(app, lifespan="off")
