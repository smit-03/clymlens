"""S3 storage layer.

All keys are built as ``<prefix> + <validated filename>``; user input is never
used as a raw key. boto3 is synchronous, so calls run in a threadpool to keep the
local uvicorn event loop responsive (on Lambda it is one request per invocation).
"""

from __future__ import annotations

import logging
from datetime import UTC, date, datetime, timedelta

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from starlette.concurrency import run_in_threadpool

from app.errors import StorageError, StoredFileNotFound
from app.models.schemas import FileInfo
from app.services import naming

logger = logging.getLogger("clymlens.storage")

_MISSING_KEY_CODES = {"NoSuchKey", "404", "NoSuchBucket"}


class S3Storage:
    def __init__(
        self,
        bucket: str,
        prefix: str,
        region: str,
        dedup_ttl_minutes: int,
        client=None,
        endpoint_url: str = "",
    ):
        self._bucket = bucket
        self._prefix = prefix
        self._dedup_ttl = timedelta(minutes=dedup_ttl_minutes)
        if client is not None:
            self._client = client
        elif endpoint_url:
            # Local S3 fake (moto / LocalStack): use dummy credentials so boto3 does
            # not fail looking for a real AWS identity.
            self._client = boto3.client(
                "s3",
                region_name=region,
                endpoint_url=endpoint_url,
                aws_access_key_id="local",
                aws_secret_access_key="local",
            )
        else:
            self._client = boto3.client("s3", region_name=region)
        self._region = region

    async def ensure_bucket(self) -> None:
        """Create the bucket if it is missing. Intended for local S3 only."""
        try:
            await run_in_threadpool(self._client.head_bucket, Bucket=self._bucket)
            return
        except (ClientError, BotoCoreError):
            pass
        kwargs: dict = {"Bucket": self._bucket}
        if self._region and self._region != "us-east-1":
            kwargs["CreateBucketConfiguration"] = {"LocationConstraint": self._region}
        await run_in_threadpool(lambda: self._client.create_bucket(**kwargs))

    # --- key helpers ---------------------------------------------------------

    def _key(self, filename: str) -> str:
        return f"{self._prefix}{filename}"

    def _basename(self, key: str) -> str:
        return key[len(self._prefix) :] if key.startswith(self._prefix) else key

    # --- operations --------------------------------------------------------

    async def put_json(self, filename: str, body: bytes) -> None:
        try:
            await run_in_threadpool(
                self._client.put_object,
                Bucket=self._bucket,
                Key=self._key(filename),
                Body=body,
                ContentType="application/json",
                ServerSideEncryption="AES256",
            )
        except (ClientError, BotoCoreError) as exc:
            logger.error("s3 put_object failed", exc_info=exc)
            raise StorageError() from exc

    async def get_json(self, filename: str) -> bytes:
        if not naming.is_valid_filename(filename):
            raise StoredFileNotFound()
        try:
            response = await run_in_threadpool(
                self._client.get_object, Bucket=self._bucket, Key=self._key(filename)
            )
            return await run_in_threadpool(response["Body"].read)
        except ClientError as exc:
            if exc.response.get("Error", {}).get("Code") in _MISSING_KEY_CODES:
                raise StoredFileNotFound() from exc
            logger.error("s3 get_object failed", exc_info=exc)
            raise StorageError() from exc
        except BotoCoreError as exc:
            logger.error("s3 get_object failed", exc_info=exc)
            raise StorageError() from exc

    async def list_files(self, limit: int) -> list[FileInfo]:
        objects = await self._list_objects(self._prefix)
        files = [
            FileInfo(
                name=self._basename(obj["Key"]),
                size=obj["Size"],
                created_at=obj["LastModified"],
            )
            for obj in objects
            if naming.is_valid_filename(self._basename(obj["Key"]))
        ]
        # Newest first; the name embeds the UTC timestamp so it is a stable
        # tie-breaker when two objects share a LastModified second.
        files.sort(key=lambda f: (f.created_at, f.name), reverse=True)
        return files[:limit]

    async def find_recent_duplicate(
        self, lat: float, lon: float, start: date, end: date
    ) -> str | None:
        prefix = f"{self._prefix}{naming.dedup_prefix(lat, lon, start, end)}"
        objects = await self._list_objects(prefix)
        if not objects:
            return None
        newest = max(objects, key=lambda obj: obj["LastModified"])
        age = datetime.now(UTC) - newest["LastModified"]
        if age <= self._dedup_ttl:
            return self._basename(newest["Key"])
        return None

    # --- internal ---------------------------------------------------------

    async def _list_objects(self, prefix: str) -> list[dict]:
        def _fetch() -> list[dict]:
            paginator = self._client.get_paginator("list_objects_v2")
            collected: list[dict] = []
            for page in paginator.paginate(Bucket=self._bucket, Prefix=prefix):
                collected.extend(page.get("Contents", []))
            return collected

        try:
            return await run_in_threadpool(_fetch)
        except (ClientError, BotoCoreError) as exc:
            logger.error("s3 list_objects_v2 failed", exc_info=exc)
            raise StorageError() from exc
