"""GET /list-weather-files."""

from __future__ import annotations

from tests.conftest import TEST_BUCKET, TEST_PREFIX

_NAMES = [
    "weather_1.0000_1.0000_2024-01-01_2024-01-02_20240101T000000Z.json",
    "weather_2.0000_2.0000_2024-01-01_2024-01-02_20240102T000000Z.json",
    "weather_3.0000_3.0000_2024-01-01_2024-01-02_20240103T000000Z.json",
]


def test_empty_bucket_returns_empty_list(api):
    response = api.get("/list-weather-files")
    assert response.status_code == 200
    assert response.json() == {"files": []}


def test_lists_known_files_newest_first(api, s3_client):
    for name in _NAMES:
        s3_client.put_object(Bucket=TEST_BUCKET, Key=f"{TEST_PREFIX}{name}", Body=b"{}")
    s3_client.put_object(Bucket=TEST_BUCKET, Key=f"{TEST_PREFIX}ignore-me.txt", Body=b"x")

    response = api.get("/list-weather-files")

    assert response.status_code == 200
    files = response.json()["files"]
    assert [f["name"] for f in files] == _NAMES[::-1]
    assert all(set(f) == {"name", "size", "created_at"} for f in files)
    assert files[0]["created_at"].endswith("Z")


def test_limit_is_applied(api, s3_client):
    for name in _NAMES:
        s3_client.put_object(Bucket=TEST_BUCKET, Key=f"{TEST_PREFIX}{name}", Body=b"{}")

    response = api.get("/list-weather-files", params={"limit": 1})

    assert response.status_code == 200
    assert [f["name"] for f in response.json()["files"]] == [_NAMES[-1]]
