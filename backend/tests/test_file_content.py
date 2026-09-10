"""GET /weather-file-content/{file}."""

from __future__ import annotations

import pytest

from tests.conftest import TEST_BUCKET, TEST_PREFIX

VALID_NAME = "weather_19.0760_72.8777_2024-06-01_2024-06-10_20260910T101500Z.json"


def test_returns_stored_json_verbatim(api, s3_client):
    raw = b'{"daily": {"time": ["2024-06-01"], "temperature_2m_max": [30.1]}}'
    s3_client.put_object(Bucket=TEST_BUCKET, Key=f"{TEST_PREFIX}{VALID_NAME}", Body=raw)

    response = api.get(f"/weather-file-content/{VALID_NAME}")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert response.content == raw


def test_missing_file_returns_404(api):
    response = api.get(f"/weather-file-content/{VALID_NAME}")

    assert response.status_code == 404
    assert response.json() == {"status": "error", "message": "not found"}


@pytest.mark.parametrize(
    "bad",
    [
        "../../etc/passwd",
        "..%2f..%2fsecret",
        "weather-data/other.json",
        "not-a-weather-file.json",
        "weather_19.076_72.8777_2024-06-01_2024-06-10_20260910T101500Z.json",
        "%2e%2e/evil.json",
    ],
)
def test_invalid_identifiers_return_404_without_touching_s3(api, bad):
    response = api.get(f"/weather-file-content/{bad}")

    assert response.status_code == 404
    assert response.json() == {"status": "error", "message": "not found"}
