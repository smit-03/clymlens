"""Request and response models — the wire contract (see docs/DESIGN.md §4).

Validation rules live here so there is one place to read them. Route handlers
receive already-validated models.
"""

from __future__ import annotations

import re
from datetime import UTC, date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, model_validator

# "range <= 31 days" is read as at most 31 distinct calendar days inclusive,
# i.e. end_date - start_date <= 30 days.
MAX_RANGE_DAYS = 31

_ISO_DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")


def _parse_iso_date(value: object) -> date:
    """Accept only a real date or a strict ``YYYY-MM-DD`` string.

    Pydantic's default ``date`` coercion also accepts unix timestamps and
    datetime strings; the case study asks specifically for ``YYYY-MM-DD``.
    """
    if isinstance(value, datetime):
        raise ValueError("must be a date in YYYY-MM-DD format, not a datetime")
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        if not _ISO_DATE_RE.fullmatch(value.strip()):
            raise ValueError("must be a date in YYYY-MM-DD format")
        try:
            return date.fromisoformat(value.strip())
        except ValueError as exc:
            raise ValueError("is not a valid calendar date") from exc
    raise ValueError("must be a date in YYYY-MM-DD format")


IsoDate = Annotated[date, BeforeValidator(_parse_iso_date)]


class StoreWeatherRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    latitude: float = Field(ge=-90, le=90, description="Degrees, -90..90")
    longitude: float = Field(ge=-180, le=180, description="Degrees, -180..180")
    start_date: IsoDate
    end_date: IsoDate

    @model_validator(mode="after")
    def _check_range(self) -> StoreWeatherRequest:
        if self.start_date > self.end_date:
            raise ValueError("start_date must be on or before end_date")
        if (self.end_date - self.start_date).days > MAX_RANGE_DAYS - 1:
            raise ValueError(f"date range must not exceed {MAX_RANGE_DAYS} days")
        if self.end_date > datetime.now(UTC).date():
            raise ValueError("end_date must not be in the future")
        return self


class StoreWeatherResponse(BaseModel):
    status: Literal["ok"] = "ok"
    file: str
    # Present and true only when an existing stored object was reused.
    cached: bool = False


class FileInfo(BaseModel):
    name: str
    size: int
    created_at: datetime


class ListFilesResponse(BaseModel):
    files: list[FileInfo]


class ErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    message: str
