"""HTTP routes.

Route handlers stay thin: parse input, call a service, shape the response.
Business logic lives in ``app.services``.
"""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends

from app.config import Settings, get_settings

router = APIRouter()


@router.get("/health", tags=["ops"])
def health(settings: Settings = Depends(get_settings)) -> dict[str, str]:
    """Liveness check. No S3 or upstream calls."""
    return {
        "status": "ok",
        "env": settings.env,
        "time": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
    }
