"""FastAPI application factory."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.routes import router
from app.config import get_settings
from app.exception_handlers import register_exception_handlers
from app.logging_config import configure_logging
from app.middleware import register_middleware
from app.rate_limit import FixedWindowRateLimiter


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title="ClymLens API",
        version=__version__,
        description="Historical weather explorer — fetch, store, list, and serve daily weather.",
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
