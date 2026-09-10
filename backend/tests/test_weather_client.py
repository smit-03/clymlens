"""OpenMeteoClient: request shape, success parsing, and error mapping."""

from __future__ import annotations

from datetime import date

import httpx
import pytest
import respx

from app.errors import UpstreamError, UpstreamTimeout
from app.services.weather import DAILY_VARIABLES, OpenMeteoClient

BASE_URL = "https://weather.test/v1/archive"

_VALID_PAYLOAD = {
    "latitude": 19.07,
    "longitude": 72.88,
    "timezone": "UTC",
    "daily_units": {"temperature_2m_max": "°C"},
    "daily": {
        "time": ["2024-06-01", "2024-06-02"],
        "temperature_2m_max": [31.2, 30.8],
        "temperature_2m_min": [26.1, 25.9],
    },
}


def _client() -> OpenMeteoClient:
    return OpenMeteoClient(base_url=BASE_URL, timeout_seconds=5)


@respx.mock
async def test_builds_expected_request():
    route = respx.get(BASE_URL).mock(return_value=httpx.Response(200, json=_VALID_PAYLOAD))

    await _client().fetch_daily_archive(19.076, 72.8777, date(2024, 6, 1), date(2024, 6, 2))

    params = route.calls.last.request.url.params
    assert params["latitude"] == "19.076"
    assert params["longitude"] == "72.8777"
    assert params["start_date"] == "2024-06-01"
    assert params["end_date"] == "2024-06-02"
    assert params["timezone"] == "UTC"
    assert params["daily"] == ",".join(DAILY_VARIABLES)


@respx.mock
async def test_success_preserves_raw_bytes():
    raw = b'{"daily": {"time": ["2024-06-01"], "temperature_2m_max": [30.0]}}'
    respx.get(BASE_URL).mock(return_value=httpx.Response(200, content=raw))

    result = await _client().fetch_daily_archive(1.0, 2.0, date(2024, 6, 1), date(2024, 6, 1))

    assert result.raw_bytes == raw
    assert result.parsed["daily"]["time"] == ["2024-06-01"]


@respx.mock
async def test_open_meteo_error_envelope_maps_to_502():
    respx.get(BASE_URL).mock(
        return_value=httpx.Response(400, json={"error": True, "reason": "Invalid date range"})
    )

    with pytest.raises(UpstreamError) as excinfo:
        await _client().fetch_daily_archive(1.0, 2.0, date(2024, 6, 1), date(2024, 6, 2))

    assert "Invalid date range" in str(excinfo.value)


@respx.mock
async def test_non_json_response_maps_to_502():
    respx.get(BASE_URL).mock(return_value=httpx.Response(200, content=b"<html>oops</html>"))

    with pytest.raises(UpstreamError):
        await _client().fetch_daily_archive(1.0, 2.0, date(2024, 6, 1), date(2024, 6, 2))


@respx.mock
async def test_missing_daily_time_maps_to_502():
    respx.get(BASE_URL).mock(return_value=httpx.Response(200, json={"latitude": 1.0}))

    with pytest.raises(UpstreamError):
        await _client().fetch_daily_archive(1.0, 2.0, date(2024, 6, 1), date(2024, 6, 2))


@respx.mock
async def test_timeout_maps_to_504():
    respx.get(BASE_URL).mock(side_effect=httpx.ReadTimeout("slow"))

    with pytest.raises(UpstreamTimeout):
        await _client().fetch_daily_archive(1.0, 2.0, date(2024, 6, 1), date(2024, 6, 2))


@respx.mock
async def test_retries_once_on_server_error_then_gives_up():
    route = respx.get(BASE_URL).mock(return_value=httpx.Response(503, text="unavailable"))

    with pytest.raises(UpstreamError):
        await _client().fetch_daily_archive(1.0, 2.0, date(2024, 6, 1), date(2024, 6, 2))

    assert route.call_count == 2


@respx.mock
async def test_retries_transport_error_then_succeeds():
    route = respx.get(BASE_URL).mock(
        side_effect=[
            httpx.ConnectError("reset"),
            httpx.Response(200, json=_VALID_PAYLOAD),
        ]
    )

    result = await _client().fetch_daily_archive(1.0, 2.0, date(2024, 6, 1), date(2024, 6, 2))

    assert route.call_count == 2
    assert result.parsed["daily"]["time"]
