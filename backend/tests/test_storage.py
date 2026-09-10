"""S3Storage behavior against a mocked bucket."""

from __future__ import annotations

from datetime import date

import pytest

from app.errors import StoredFileNotFound
from app.services.storage import S3Storage
from tests.conftest import TEST_BUCKET, TEST_PREFIX, TEST_REGION

VALID_NAME = "weather_19.0760_72.8777_2024-06-01_2024-06-10_20260910T101500Z.json"


def _storage(s3_client, dedup_ttl_minutes: int = 360) -> S3Storage:
    return S3Storage(
        bucket=TEST_BUCKET,
        prefix=TEST_PREFIX,
        region=TEST_REGION,
        dedup_ttl_minutes=dedup_ttl_minutes,
        client=s3_client,
    )


async def test_put_then_get_round_trips_bytes(s3_client):
    storage = _storage(s3_client)
    body = b'{"daily": {"time": ["2024-06-01"]}}'

    await storage.put_json(VALID_NAME, body)

    assert await storage.get_json(VALID_NAME) == body
    head = s3_client.head_object(Bucket=TEST_BUCKET, Key=f"{TEST_PREFIX}{VALID_NAME}")
    assert head["ContentType"] == "application/json"


async def test_get_missing_file_raises_not_found(s3_client):
    with pytest.raises(StoredFileNotFound):
        await _storage(s3_client).get_json(VALID_NAME)


async def test_get_invalid_filename_raises_not_found_without_s3_call(s3_client):
    with pytest.raises(StoredFileNotFound):
        await _storage(s3_client).get_json("../../etc/passwd")


async def test_list_files_empty(s3_client):
    assert await _storage(s3_client).list_files(limit=50) == []


async def test_list_files_filters_sorts_and_limits(s3_client):
    names = [
        "weather_1.0000_1.0000_2024-01-01_2024-01-02_20240101T000000Z.json",
        "weather_2.0000_2.0000_2024-01-01_2024-01-02_20240102T000000Z.json",
        "weather_3.0000_3.0000_2024-01-01_2024-01-02_20240103T000000Z.json",
    ]
    for name in names:
        s3_client.put_object(Bucket=TEST_BUCKET, Key=f"{TEST_PREFIX}{name}", Body=b"{}")
    # Noise that must be excluded.
    s3_client.put_object(Bucket=TEST_BUCKET, Key=f"{TEST_PREFIX}notes.txt", Body=b"x")
    s3_client.put_object(Bucket=TEST_BUCKET, Key=f"{TEST_PREFIX}subdir/thing.json", Body=b"x")

    files = await _storage(s3_client).list_files(limit=2)

    assert [f.name for f in files] == names[::-1][:2]
    assert all(f.size == 2 for f in files)


async def test_find_recent_duplicate_hit_and_miss(s3_client):
    s3_client.put_object(Bucket=TEST_BUCKET, Key=f"{TEST_PREFIX}{VALID_NAME}", Body=b"{}")
    args = (19.076, 72.8777, date(2024, 6, 1), date(2024, 6, 10))

    hit = await _storage(s3_client, dedup_ttl_minutes=360).find_recent_duplicate(*args)
    assert hit == VALID_NAME

    # Different coordinates → no match.
    miss = await _storage(s3_client).find_recent_duplicate(
        1.0, 2.0, date(2024, 6, 1), date(2024, 6, 10)
    )
    assert miss is None


async def test_find_recent_duplicate_respects_ttl(s3_client):
    s3_client.put_object(Bucket=TEST_BUCKET, Key=f"{TEST_PREFIX}{VALID_NAME}", Body=b"{}")

    # TTL of 0 minutes → even a just-created object is already stale.
    result = await _storage(s3_client, dedup_ttl_minutes=0).find_recent_duplicate(
        19.076, 72.8777, date(2024, 6, 1), date(2024, 6, 10)
    )
    assert result is None
