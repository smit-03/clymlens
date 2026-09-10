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
