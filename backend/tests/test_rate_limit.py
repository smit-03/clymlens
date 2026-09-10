"""Rate limiting on POST /store-weather-data."""

from __future__ import annotations

import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from app.api.dependencies import get_storage
from app.config import get_settings
from app.main import create_app
from app.services.storage import S3Storage
from tests.conftest import TEST_BUCKET, TEST_PREFIX, TEST_REGION

_PAYLOAD = {
    "latitude": 10.0,
    "longitude": 20.0,
    "start_date": "2024-06-01",
    "end_date": "2024-06-03",
}
_ARCHIVE = {"daily": {"time": ["2024-06-01"], "temperature_2m_max": [30.0]}}


@pytest.fixture
def limited_api(s3_client, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_PER_MINUTE", "2")
    get_settings.cache_clear()
    app = create_app()
    app.dependency_overrides[get_storage] = lambda: S3Storage(
        bucket=TEST_BUCKET,
        prefix=TEST_PREFIX,
        region=TEST_REGION,
        dedup_ttl_minutes=0,  # never dedup, so every call does the full pipeline
        client=s3_client,
    )
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    get_settings.cache_clear()


def test_requests_over_the_limit_get_429(limited_api):
    with respx.mock(assert_all_called=False) as router:
        router.route(host="testserver").pass_through()
        router.get("https://weather.test/v1/archive").mock(
            return_value=httpx.Response(200, json=_ARCHIVE)
        )

        first = limited_api.post("/store-weather-data", json=_PAYLOAD)
        second = limited_api.post("/store-weather-data", json=_PAYLOAD)
        third = limited_api.post("/store-weather-data", json=_PAYLOAD)

    assert first.status_code == 200
    assert second.status_code == 200
    assert third.status_code == 429
    assert third.json()["status"] == "error"
    assert "Retry-After" in third.headers
