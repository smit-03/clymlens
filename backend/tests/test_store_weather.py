"""POST /store-weather-data: happy path, de-duplication, and upstream failures."""

from __future__ import annotations

import json

import httpx
import pytest
import respx

from app.services.naming import FILENAME_RE
from tests.conftest import TEST_BUCKET, TEST_PREFIX

OPEN_METEO = "https://weather.test/v1/archive"

_PAYLOAD = {
    "latitude": 19.076,
    "longitude": 72.8777,
    "start_date": "2024-06-01",
    "end_date": "2024-06-05",
}

_ARCHIVE_JSON = {
    "latitude": 19.07,
    "longitude": 72.88,
    "timezone": "UTC",
    "daily_units": {"temperature_2m_max": "°C"},
    "daily": {
        "time": ["2024-06-01", "2024-06-02"],
        "temperature_2m_max": [31.2, 30.9],
        "temperature_2m_min": [26.0, 25.7],
        "apparent_temperature_max": [35.1, 34.8],
        "apparent_temperature_min": [27.0, 26.5],
        "temperature_2m_mean": [28.4, 28.0],
    },
}


@pytest.fixture
def open_meteo():
    with respx.mock(assert_all_called=False) as router:
        router.route(host="testserver").pass_through()
        yield router


def test_store_fetches_and_persists_raw_json(api, s3_client, open_meteo):
    raw = json.dumps(_ARCHIVE_JSON).encode()
    route = open_meteo.get(OPEN_METEO).mock(return_value=httpx.Response(200, content=raw))

    response = api.post("/store-weather-data", json=_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body.get("cached") is False
    assert FILENAME_RE.match(body["file"])
    assert route.called

    stored = s3_client.get_object(Bucket=TEST_BUCKET, Key=f"{TEST_PREFIX}{body['file']}")
    assert stored["Body"].read() == raw
    assert stored["ContentType"] == "application/json"


def test_store_deduplicates_without_calling_upstream(api, s3_client, open_meteo):
    existing = "weather_19.0760_72.8777_2024-06-01_2024-06-05_20260101T000000Z.json"
    s3_client.put_object(Bucket=TEST_BUCKET, Key=f"{TEST_PREFIX}{existing}", Body=b"{}")
    route = open_meteo.get(OPEN_METEO).mock(return_value=httpx.Response(200, json=_ARCHIVE_JSON))

    response = api.post("/store-weather-data", json=_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body == {"status": "ok", "file": existing, "cached": True}
    assert not route.called


def test_upstream_error_envelope_returns_502(api, open_meteo):
    open_meteo.get(OPEN_METEO).mock(
        return_value=httpx.Response(400, json={"error": True, "reason": "bad range"})
    )

    response = api.post("/store-weather-data", json=_PAYLOAD)

    assert response.status_code == 502
    assert response.json()["status"] == "error"


def test_upstream_timeout_returns_504(api, open_meteo):
    open_meteo.get(OPEN_METEO).mock(side_effect=httpx.ReadTimeout("slow"))

    response = api.post("/store-weather-data", json=_PAYLOAD)

    assert response.status_code == 504


def test_malformed_upstream_body_returns_502(api, open_meteo):
    open_meteo.get(OPEN_METEO).mock(return_value=httpx.Response(200, content=b"<html/>"))

    response = api.post("/store-weather-data", json=_PAYLOAD)

    assert response.status_code == 502


def test_storage_failure_returns_500(api, open_meteo, monkeypatch):
    open_meteo.get(OPEN_METEO).mock(return_value=httpx.Response(200, json=_ARCHIVE_JSON))

    from app.services.storage import S3Storage

    async def boom(self, *args, **kwargs):
        from app.errors import StorageError

        raise StorageError()

    monkeypatch.setattr(S3Storage, "put_json", boom)

    response = api.post("/store-weather-data", json=_PAYLOAD)

    assert response.status_code == 500
    assert response.json() == {"status": "error", "message": "storage error"}
