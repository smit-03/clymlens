"""FastAPI dependency providers.

Keeping construction here (rather than in route modules) makes the external
clients easy to override in tests via ``app.dependency_overrides``.
"""

from __future__ import annotations

from fastapi import Depends

from app.config import Settings, get_settings
from app.services.weather import OpenMeteoClient


def get_weather_client(settings: Settings = Depends(get_settings)) -> OpenMeteoClient:
    return OpenMeteoClient(
        base_url=settings.open_meteo_base_url,
        timeout_seconds=settings.http_timeout_seconds,
    )
