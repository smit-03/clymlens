"""HTTP routes.

Route handlers stay thin: parse input, call a service, shape the response.
Business logic lives in ``app.services`` (wired in later milestones).
"""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.config import Settings, get_settings
from app.models.schemas import (
    ListFilesResponse,
    StoreWeatherRequest,
    StoreWeatherResponse,
)

router = APIRouter()

_NOT_IMPLEMENTED = "endpoint not implemented yet"


@router.get("/health", tags=["ops"])
def health(settings: Settings = Depends(get_settings)) -> dict[str, str]:
    """Liveness check. No S3 or upstream calls."""
    return {
        "status": "ok",
        "env": settings.env,
        "time": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
    }


@router.post("/store-weather-data", response_model=StoreWeatherResponse, tags=["weather"])
async def store_weather_data(payload: StoreWeatherRequest) -> StoreWeatherResponse:
    """Validate, fetch from Open-Meteo, store the raw JSON, return the file name.

    Input is fully validated by :class:`StoreWeatherRequest`. The fetch/store
    pipeline is wired in M5.
    """
    _ = payload
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, _NOT_IMPLEMENTED)


@router.get("/list-weather-files", response_model=ListFilesResponse, tags=["weather"])
async def list_weather_files(
    limit: int = Query(default=200, ge=1, le=1000),
) -> ListFilesResponse:
    """List stored weather files, newest first. Wired in M5."""
    _ = limit
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, _NOT_IMPLEMENTED)


@router.get("/weather-file-content/{file}", tags=["weather"])
async def weather_file_content(file: str) -> dict:
    """Return the stored JSON for ``file``; 404 if missing or invalid. Wired in M5."""
    _ = file
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, _NOT_IMPLEMENTED)
