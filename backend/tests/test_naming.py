"""Object naming and filename-safety unit tests."""

from __future__ import annotations

from datetime import UTC, date, datetime

import pytest

from app.services import naming

VALID_NAME = "weather_19.0760_72.8777_2024-06-01_2024-06-10_20260910T101500Z.json"


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (19.076, "19.0760"),
        (-72.8777, "-72.8777"),
        (0.0, "0.0000"),
        (-0.0, "0.0000"),
        (90, "90.0000"),
        (-180, "-180.0000"),
        (12.34567, "12.3457"),
    ],
)
def test_format_coord(value, expected):
    assert naming.format_coord(value) == expected


def test_build_filename_is_deterministic():
    now = datetime(2026, 9, 10, 10, 15, 0, tzinfo=UTC)
    name = naming.build_filename(19.076, 72.8777, date(2024, 6, 1), date(2024, 6, 10), now=now)
    assert name == VALID_NAME


def test_dedup_prefix_normalizes_precision():
    a = naming.dedup_prefix(19.076, 72.8777, date(2024, 6, 1), date(2024, 6, 10))
    b = naming.dedup_prefix(19.0760, 72.87770, date(2024, 6, 1), date(2024, 6, 10))
    assert a == b == "weather_19.0760_72.8777_2024-06-01_2024-06-10_"


def test_build_filename_matches_regex():
    now = datetime(2026, 1, 2, 3, 4, 5, tzinfo=UTC)
    name = naming.build_filename(-1.5, -2.25, date(2023, 1, 1), date(2023, 1, 2), now=now)
    assert naming.is_valid_filename(name)


@pytest.mark.parametrize(
    "name",
    [
        "",
        "notes.txt",
        "weather.json",
        "weather_19.076_72.8777_2024-06-01_2024-06-10_20260910T101500Z.json",  # 3 dp
        "../weather_19.0760_72.8777_2024-06-01_2024-06-10_20260910T101500Z.json",
        "weather-data/weather_19.0760_72.8777_2024-06-01_2024-06-10_20260910T101500Z.json",
        "weather_19.0760_72.8777_2024-06-01_2024-06-10_20260910T101500Z.json/",
        "weather_19.0760_72.8777_2024-06-01_2024-06-10_2026-09-10T10:15:00Z.json",
        VALID_NAME.replace(".json", ".txt"),
    ],
)
def test_is_valid_filename_rejects(name):
    assert naming.is_valid_filename(name) is False


def test_is_valid_filename_accepts():
    assert naming.is_valid_filename(VALID_NAME) is True
