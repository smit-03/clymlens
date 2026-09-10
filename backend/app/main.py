"""FastAPI application factory."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.routes import router
from app.config import Settings, get_settings
from app.exception_handlers import register_exception_handlers
from app.logging_config import configure_logging
from app.middleware import register_middleware
from app.rate_limit import FixedWindowRateLimiter
from app.services.storage import S3Storage

logger = logging.getLogger("clymlens.startup")


def _lifespan(settings: Settings):
    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        # Convenience for local development against a fake S3 (moto / LocalStack).
        # Never runs on Lambda (Mangum is configured with lifespan="off").
        if settings.env == "local" and settings.s3_endpoint_url and settings.s3_bucket:
            try:
                storage = S3Storage(
                    bucket=settings.s3_bucket,
                    prefix=settings.s3_prefix,
                    region=settings.aws_region,
                    dedup_ttl_minutes=settings.dedup_ttl_minutes,
                    endpoint_url=settings.s3_endpoint_url,
                )
                await storage.ensure_bucket()
                logger.info(
                    "local S3 bucket ready",
                    extra={"context": {"bucket": settings.s3_bucket}},
                )
            except Exception as exc:  # pragma: no cover - dev-only best effort
                logger.warning(
                    "could not ensure local bucket",
                    extra={"context": {"error": str(exc)}},
                )
        yield

    return lifespan


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title="ClymLens API",
        version=__version__,
        description="Historical weather explorer — fetch, store, list, and serve daily weather.",
        lifespan=_lifespan(settings),
    )
    app.state.rate_limiter = FixedWindowRateLimiter(settings.rate_limit_per_minute)

    cors_kwargs: dict[str, object] = {
        "allow_origins": settings.cors_origin_list,
        "allow_methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "allow_credentials": False,
    }
    if settings.cors_origin_regex:
        cors_kwargs["allow_origin_regex"] = settings.cors_origin_regex
    app.add_middleware(CORSMiddleware, **cors_kwargs)

    register_middleware(app)
    register_exception_handlers(app)
    app.include_router(router)
    return app


app = create_app()
