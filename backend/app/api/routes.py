"""HTTP routes.

Handlers stay thin: validate (via the models), call services, shape the
response. All business logic lives in ``app.services``.
"""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query, Response

from app.api.dependencies import enforce_rate_limit, get_storage, get_weather_client
from app.config import Settings, get_settings
from app.errors import StoredFileNotFound
from app.models.schemas import ListFilesResponse, StoreWeatherRequest, StoreWeatherResponse
from app.services import naming
from app.services.storage import S3Storage
from app.services.weather import OpenMeteoClient

router = APIRouter()


@router.get("/health", tags=["ops"])
def health(settings: Settings = Depends(get_settings)) -> dict[str, str]:
    """Liveness check. No S3 or upstream calls."""
    return {
        "status": "ok",
        "env": settings.env,
        "time": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
    }


@router.post(
    "/store-weather-data",
    response_model=StoreWeatherResponse,
    dependencies=[Depends(enforce_rate_limit)],
    tags=["weather"],
)
async def store_weather_data(
    payload: StoreWeatherRequest,
    storage: S3Storage = Depends(get_storage),
    weather: OpenMeteoClient = Depends(get_weather_client),
) -> StoreWeatherResponse:
    """Fetch daily history from Open-Meteo and store the raw JSON in S3.

    If an object for the exact same query already exists and is fresh, it is
    reused and no upstream call is made.
    """
    coords = (payload.latitude, payload.longitude, payload.start_date, payload.end_date)

    existing = await storage.find_recent_duplicate(*coords)
    if existing:
        return StoreWeatherResponse(file=existing, cached=True)

    result = await weather.fetch_daily_archive(*coords)
    filename = naming.build_filename(*coords)
    await storage.put_json(filename, result.raw_bytes)
    return StoreWeatherResponse(file=filename)


@router.get("/list-weather-files", response_model=ListFilesResponse, tags=["weather"])
async def list_weather_files(
    limit: int = Query(default=200, ge=1, le=1000),
    storage: S3Storage = Depends(get_storage),
) -> ListFilesResponse:
    """List stored weather files, newest first."""
    return ListFilesResponse(files=await storage.list_files(limit))


@router.get("/weather-file-content/{file:path}", tags=["weather"])
async def weather_file_content(
    file: str,
    storage: S3Storage = Depends(get_storage),
) -> Response:
    """Return the stored JSON for ``file`` verbatim; 404 if missing or invalid."""
    if not naming.is_valid_filename(file):
        raise StoredFileNotFound()
    raw = await storage.get_json(file)
    return Response(content=raw, media_type="application/json")
