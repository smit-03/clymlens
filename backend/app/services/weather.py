"""Open-Meteo archive client.

One method: fetch daily historical weather for a coordinate + date range. The
raw response body is preserved verbatim for storage; a parsed copy is returned
only for sanity checks and logging.
"""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import date
from typing import Any

import httpx

from app.errors import UpstreamError, UpstreamTimeout

logger = logging.getLogger("clymlens.weather")

# The four variables the case study requires, plus mean for a third chart line.
DAILY_VARIABLES: tuple[str, ...] = (
    "temperature_2m_max",
    "temperature_2m_min",
    "apparent_temperature_max",
    "apparent_temperature_min",
    "temperature_2m_mean",
)

_MAX_ATTEMPTS = 2
_RETRY_BACKOFF_SECONDS = 0.5


@dataclass(frozen=True)
class WeatherFetchResult:
    raw_bytes: bytes
    parsed: dict[str, Any]


class OpenMeteoClient:
    def __init__(self, base_url: str, timeout_seconds: float):
        self._base_url = base_url
        self._timeout = timeout_seconds

    def _params(self, lat: float, lon: float, start: date, end: date) -> dict[str, str]:
        return {
            "latitude": str(lat),
            "longitude": str(lon),
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "daily": ",".join(DAILY_VARIABLES),
            "timezone": "UTC",
        }

    async def fetch_daily_archive(
        self, lat: float, lon: float, start: date, end: date
    ) -> WeatherFetchResult:
        params = self._params(lat, lon, start, end)
        response = await self._get_with_retry(params)
        return self._interpret(response)

    async def _get_with_retry(self, params: dict[str, str]) -> httpx.Response:
        last_error: Exception | None = None
        async with httpx.AsyncClient(timeout=self._timeout) as http:
            for attempt in range(1, _MAX_ATTEMPTS + 1):
                try:
                    response = await http.get(self._base_url, params=params)
                except httpx.TimeoutException as exc:
                    logger.warning("open-meteo timeout", extra={"context": {"attempt": attempt}})
                    raise UpstreamTimeout() from exc
                except httpx.TransportError as exc:
                    last_error = exc
                else:
                    if response.status_code < 500:
                        return response
                    last_error = UpstreamError(f"weather provider returned {response.status_code}")

                if attempt < _MAX_ATTEMPTS:
                    await asyncio.sleep(_RETRY_BACKOFF_SECONDS)

        logger.warning("open-meteo unreachable", extra={"context": {"error": str(last_error)}})
        raise UpstreamError("weather provider is unavailable")

    @staticmethod
    def _interpret(response: httpx.Response) -> WeatherFetchResult:
        raw = response.content

        try:
            parsed = json.loads(raw)
        except ValueError as exc:
            raise UpstreamError("weather provider returned a non-JSON response") from exc

        if not isinstance(parsed, dict):
            raise UpstreamError("weather provider returned an unexpected payload")

        # Open-Meteo signals problems with {"error": true, "reason": "..."}.
        if parsed.get("error"):
            reason = str(parsed.get("reason", "unknown error"))
            raise UpstreamError(f"weather provider error: {reason}")

        if response.status_code != httpx.codes.OK:
            raise UpstreamError(f"weather provider returned {response.status_code}")

        daily = parsed.get("daily")
        if not isinstance(daily, dict) or not isinstance(daily.get("time"), list):
            raise UpstreamError("weather provider response is missing daily data")

        return WeatherFetchResult(raw_bytes=raw, parsed=parsed)
