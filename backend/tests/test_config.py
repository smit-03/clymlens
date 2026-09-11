"""Configuration defaults and production safeguards."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.config import Settings


def test_local_storage_defaults_to_moto_server(monkeypatch):
    monkeypatch.delenv("S3_BUCKET", raising=False)
    monkeypatch.delenv("S3_ENDPOINT_URL", raising=False)
    settings = Settings(_env_file=None)

    assert settings.env == "local"
    assert settings.s3_bucket == "clymlens-dev"
    assert settings.s3_endpoint_url == "http://localhost:5000"


def test_production_requires_storage_bucket():
    with pytest.raises(ValidationError, match="S3_BUCKET must be set when ENV=production"):
        Settings(_env_file=None, env="production", s3_bucket="")
