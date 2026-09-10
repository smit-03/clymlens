"""Exception handlers: every error leaves the API as ``{"status": "error", "message": ...}``.

FastAPI's default 422 for body validation is remapped to 400 so the contract
matches the case study's "400/404/5xx".
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.errors import AppError, RateLimited

logger = logging.getLogger("clymlens.errors")


def _error_body(message: str) -> dict[str, str]:
    return {"status": "error", "message": message}


def _humanize(error: dict) -> str:
    location = ".".join(str(part) for part in error.get("loc", ()) if part != "body")
    message = error.get("msg", "invalid value")
    return f"{location}: {message}" if location else message


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def _on_request_validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        errors = exc.errors()
        message = _humanize(errors[0]) if errors else "invalid request"
        return JSONResponse(status_code=400, content=_error_body(message))

    @app.exception_handler(AppError)
    async def _on_app_error(_: Request, exc: AppError) -> JSONResponse:
        if exc.status_code >= 500:
            logger.error("app error", extra={"context": {"error": str(exc)}}, exc_info=exc)
        headers = {}
        if isinstance(exc, RateLimited):
            headers["Retry-After"] = str(exc.retry_after)
        return JSONResponse(
            status_code=exc.status_code, content=_error_body(exc.message), headers=headers
        )

    @app.exception_handler(StarletteHTTPException)
    async def _on_http_exception(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else "request failed"
        return JSONResponse(status_code=exc.status_code, content=_error_body(detail))

    @app.exception_handler(Exception)
    async def _on_unhandled(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled error")
        return JSONResponse(status_code=500, content=_error_body("internal error"))
