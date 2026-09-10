"""Object naming and filename safety.

Stored object name (case study spec):

    weather_<lat>_<lon>_<start>_<end>_<timestamp>.json

- lat/lon are formatted to a fixed 4 decimal places so the name is deterministic
  and the de-duplication prefix is stable (19.076 and 19.0760 collide).
- timestamp is compact UTC (``YYYYMMDDTHHMMSSZ``) — no colons, safe as an S3 key
  and as a downloaded file name.
"""

from __future__ import annotations

import re
from datetime import UTC, date, datetime

_COORD_PLACES = 4

# Full, anchored pattern for a name this service could have produced.
FILENAME_RE = re.compile(
    r"^weather_"
    r"-?\d{1,3}\.\d{4}_"  # latitude
    r"-?\d{1,3}\.\d{4}_"  # longitude
    r"\d{4}-\d{2}-\d{2}_"  # start date
    r"\d{4}-\d{2}-\d{2}_"  # end date
    r"\d{8}T\d{6}Z"  # timestamp
    r"\.json$"
)

_UNSAFE_FRAGMENTS = ("/", "\\", "..", "\x00", "%")


def format_coord(value: float) -> str:
    text = f"{value:.{_COORD_PLACES}f}"
    return "0.0000" if text == "-0.0000" else text


def timestamp(now: datetime | None = None) -> str:
    return (now or datetime.now(UTC)).strftime("%Y%m%dT%H%M%SZ")


def build_filename(
    lat: float, lon: float, start: date, end: date, now: datetime | None = None
) -> str:
    return (
        f"weather_{format_coord(lat)}_{format_coord(lon)}_"
        f"{start.isoformat()}_{end.isoformat()}_{timestamp(now)}.json"
    )


def dedup_prefix(lat: float, lon: float, start: date, end: date) -> str:
    """Key fragment (without the bucket prefix) shared by every file for this query."""
    return (
        f"weather_{format_coord(lat)}_{format_coord(lon)}_"
        f"{start.isoformat()}_{end.isoformat()}_"
    )


def is_valid_filename(name: str) -> bool:
    if not name or any(fragment in name for fragment in _UNSAFE_FRAGMENTS):
        return False
    return FILENAME_RE.match(name) is not None
