"""HTTP middleware: oversized-body rejection and one structured log line per request."""

from __future__ import annotations

import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("clymlens.request")

# A valid store-weather body is ~120 bytes; this is deliberately generous.
MAX_BODY_BYTES = 4096


def register_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def _observe(request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and content_length.isdigit() and int(content_length) > MAX_BODY_BYTES:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "request body too large"},
            )

        request_id = request.headers.get("x-amzn-trace-id") or uuid.uuid4().hex[:16]
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            logger.exception(
                "request failed",
                extra={
                    "context": {
                        "method": request.method,
                        "path": request.url.path,
                        "request_id": request_id,
                    }
                },
            )
            raise

        duration_ms = round((time.perf_counter() - started) * 1000, 1)
        logger.info(
            "request",
            extra={
                "context": {
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "duration_ms": duration_ms,
                    "request_id": request_id,
                }
            },
        )
        response.headers["x-request-id"] = request_id
        return response
