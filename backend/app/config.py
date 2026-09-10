"""Application configuration.

All settings come from environment variables (or a local ``.env`` file). Nothing
here has a hard-coded endpoint, bucket, or origin so the same image runs locally
and on Lambda with only env differences.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    env: Literal["local", "production"] = "local"

    # --- AWS / storage ---
    aws_region: str = "ap-south-1"
    s3_bucket: str = Field(default="", description="Target S3 bucket name")
    s3_prefix: str = "weather-data/"
    # Point at a local S3 (moto / LocalStack / MinIO) for development. Empty = real AWS.
    s3_endpoint_url: str = ""

    # --- Open-Meteo ---
    open_meteo_base_url: str = "https://archive-api.open-meteo.com/v1/archive"
    http_timeout_seconds: float = 10.0

    # --- Behavior ---
    dedup_ttl_minutes: int = 360
    rate_limit_per_minute: int = 20

    # --- CORS ---
    cors_origins: str = "http://localhost:5173"
    cors_origin_regex: str = ""

    # --- Logging ---
    log_level: str = "INFO"

    @field_validator("s3_prefix")
    @classmethod
    def _normalize_prefix(cls, value: str) -> str:
        value = value.strip().lstrip("/")
        if value and not value.endswith("/"):
            value += "/"
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings accessor (also the FastAPI dependency)."""
    return Settings()
