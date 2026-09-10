"""Application error types and their HTTP mapping.

Services raise these; a single set of exception handlers (app.main) turns them
into the ``{"status": "error", "message": ...}`` response shape with the right
status code.
"""

from __future__ import annotations


class AppError(Exception):
    """Base class for expected, mapped errors."""

    status_code: int = 500
    default_message: str = "internal error"

    def __init__(self, message: str | None = None):
        self.message = message or self.default_message
        super().__init__(self.message)


class AppValidationError(AppError):
    status_code = 400
    default_message = "invalid request"


class UpstreamError(AppError):
    """Open-Meteo returned an error or an unexpected payload."""

    status_code = 502
    default_message = "weather provider error"


class UpstreamTimeout(AppError):
    status_code = 504
    default_message = "weather provider timed out"


class StoredFileNotFound(AppError):
    status_code = 404
    default_message = "not found"


class RateLimited(AppError):
    status_code = 429
    default_message = "rate limit exceeded, try again shortly"

    def __init__(self, message: str | None = None, retry_after: int = 60):
        super().__init__(message)
        self.retry_after = retry_after


class StorageError(AppError):
    status_code = 500
    default_message = "storage error"
