"""Shared test fixtures.

The S3 (moto) and Open-Meteo (respx) fixtures are introduced with the milestones
that need them; for now we provide a configured TestClient with safe defaults.
"""

from __future__ import annotations

import os

# Deterministic environment for every test run (set before app modules import).
os.environ.setdefault("ENV", "local")
os.environ.setdefault("AWS_REGION", "ap-south-1")
os.environ.setdefault("S3_BUCKET", "clymlens-test-bucket")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_SESSION_TOKEN", "testing")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
os.environ.setdefault("OPEN_METEO_BASE_URL", "https://weather.test/v1/archive")
# High enough that endpoint tests are never throttled; the rate-limit test sets its own.
os.environ.setdefault("RATE_LIMIT_PER_MINUTE", "1000")

import boto3  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from moto import mock_aws  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.main import create_app  # noqa: E402

TEST_BUCKET = "clymlens-test-bucket"
TEST_REGION = "ap-south-1"
TEST_PREFIX = "weather-data/"


@pytest.fixture
def client():
    get_settings.cache_clear()
    with TestClient(create_app()) as test_client:
        yield test_client


@pytest.fixture
def s3_client():
    """A mocked S3 with the test bucket already created."""
    with mock_aws():
        client = boto3.client("s3", region_name=TEST_REGION)
        client.create_bucket(
            Bucket=TEST_BUCKET,
            CreateBucketConfiguration={"LocationConstraint": TEST_REGION},
        )
        yield client


@pytest.fixture
def api(s3_client):
    """TestClient with storage backed by the mocked S3 bucket.

    Open-Meteo calls still go through the real httpx path and are stubbed per
    test with respx against OPEN_METEO_BASE_URL.
    """
    from app.api.dependencies import get_storage
    from app.services.storage import S3Storage

    get_settings.cache_clear()
    app = create_app()
    app.dependency_overrides[get_storage] = lambda: S3Storage(
        bucket=TEST_BUCKET,
        prefix=TEST_PREFIX,
        region=TEST_REGION,
        dedup_ttl_minutes=360,
        client=s3_client,
    )
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
