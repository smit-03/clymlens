"""In-process fixed-window rate limiting for the fetch/store endpoint.

Limitation (see docs/DESIGN.md §4.7): Lambda containers do not share memory, so
the effective limit is per warm container, not global. This is an abuse
dampener, not a quota.
"""

from __future__ import annotations

import asyncio
import time

from fastapi import Request

from app.errors import RateLimited

_WINDOW_SECONDS = 60.0
_MAX_TRACKED_KEYS = 10_000


class FixedWindowRateLimiter:
    def __init__(self, per_minute: int):
        self._limit = per_minute
        self._hits: dict[str, tuple[float, int]] = {}
        self._lock = asyncio.Lock()

    @property
    def enabled(self) -> bool:
        return self._limit > 0

    async def check(self, key: str) -> None:
        if not self.enabled:
            return
        now = time.monotonic()
        async with self._lock:
            if len(self._hits) > _MAX_TRACKED_KEYS:
                self._evict_stale(now)
            start, count = self._hits.get(key, (now, 0))
            if now - start >= _WINDOW_SECONDS:
                start, count = now, 0
            count += 1
            self._hits[key] = (start, count)
            if count > self._limit:
                retry_after = int(_WINDOW_SECONDS - (now - start)) + 1
                raise RateLimited(retry_after=retry_after)

    def _evict_stale(self, now: float) -> None:
        self._hits = {
            key: value for key, value in self._hits.items() if now - value[0] < _WINDOW_SECONDS
        }


def client_key(request: Request) -> str:
    """Best-effort client identity: first X-Forwarded-For hop, else peer address."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
