"""Input validation for POST /store-weather-data and query params.

A valid body is expected to pass validation and reach the (not-yet-implemented)
handler; every invalid body must produce a 400 with the unified error shape.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

ENDPOINT = "/store-weather-data"


def _valid_body(**overrides):
    body = {
        "latitude": 19.076,
        "longitude": 72.8777,
        "start_date": "2024-06-01",
        "end_date": "2024-06-10",
    }
    body.update(overrides)
    return body


def _assert_error_shape(payload):
    assert payload["status"] == "error"
    assert isinstance(payload["message"], str) and payload["message"]


def test_valid_body_passes_validation(client):
    response = client.post(ENDPOINT, json=_valid_body())
    # Handler is stubbed until M5; the point is that validation did not reject it.
    assert response.status_code != 400
    assert response.status_code != 422


def test_boundary_values_pass_validation(client):
    response = client.post(
        ENDPOINT,
        json=_valid_body(
            latitude=-90, longitude=180, start_date="2024-01-01", end_date="2024-01-31"
        ),
    )
    assert response.status_code not in (400, 422)


def test_end_date_today_is_allowed(client):
    today = datetime.now(UTC).date()
    response = client.post(
        ENDPOINT,
        json=_valid_body(start_date=str(today - timedelta(days=3)), end_date=str(today)),
    )
    assert response.status_code not in (400, 422)


@pytest.mark.parametrize(
    ("overrides", "hint"),
    [
        ({"latitude": 90.01}, "latitude"),
        ({"latitude": -90.01}, "latitude"),
        ({"longitude": 180.1}, "longitude"),
        ({"longitude": -180.1}, "longitude"),
        ({"latitude": "not-a-number"}, "latitude"),
        ({"start_date": "2024-13-01"}, "start_date"),
        ({"start_date": "2024-06-31"}, "start_date"),
        ({"start_date": "01-06-2024"}, "start_date"),
        ({"start_date": "2024/06/01"}, "start_date"),
        ({"start_date": "2024-06-01T00:00:00"}, "start_date"),
        ({"start_date": 1704067200}, "start_date"),
        ({"start_date": "2024-06-20", "end_date": "2024-06-10"}, "start_date"),
        ({"start_date": "2024-06-01", "end_date": "2024-07-02"}, "range"),
        ({"extra_field": "nope"}, "extra"),
    ],
)
def test_invalid_body_returns_400(client, overrides, hint):
    response = client.post(ENDPOINT, json=_valid_body(**overrides))

    assert response.status_code == 400
    payload = response.json()
    _assert_error_shape(payload)
    assert hint.lower() in payload["message"].lower()


def test_missing_required_field_returns_400(client):
    body = _valid_body()
    del body["latitude"]

    response = client.post(ENDPOINT, json=body)

    assert response.status_code == 400
    _assert_error_shape(response.json())


def test_exactly_31_days_passes_but_32_days_fails(client):
    ok = client.post(ENDPOINT, json=_valid_body(start_date="2024-03-01", end_date="2024-03-31"))
    assert ok.status_code not in (400, 422)

    too_long = client.post(
        ENDPOINT, json=_valid_body(start_date="2024-03-01", end_date="2024-04-01")
    )
    assert too_long.status_code == 400


def test_future_end_date_returns_400(client):
    future = datetime.now(UTC).date() + timedelta(days=5)
    response = client.post(
        ENDPOINT, json=_valid_body(start_date=str(future - timedelta(days=1)), end_date=str(future))
    )

    assert response.status_code == 400
    assert "future" in response.json()["message"].lower()


def test_non_json_body_returns_400(client):
    response = client.post(
        ENDPOINT, content="not json", headers={"Content-Type": "application/json"}
    )

    assert response.status_code == 400
    _assert_error_shape(response.json())


def test_empty_body_returns_400(client):
    response = client.post(ENDPOINT)

    assert response.status_code == 400
    _assert_error_shape(response.json())


@pytest.mark.parametrize("limit", ["0", "1001", "-5", "abc"])
def test_list_files_rejects_bad_limit(client, limit):
    response = client.get("/list-weather-files", params={"limit": limit})

    assert response.status_code == 400
    _assert_error_shape(response.json())


def test_validation_error_is_400_not_422(client):
    response = client.post(ENDPOINT, json=_valid_body(latitude=999))

    assert response.status_code == 400
