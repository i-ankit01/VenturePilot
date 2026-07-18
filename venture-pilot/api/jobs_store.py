"""
Redis-backed job store.

Replaces the old in-memory `jobs = {}` dict. That dict lived only in the
FastAPI process's RAM, so:
  - a server restart / crash / redeploy wiped every job's status + results
  - it can't be shared across multiple uvicorn workers or instances
  - "resuming" a job after a crash was impossible from the API's point of
    view, because there was nothing left telling it the job ever existed —
    even though the LangGraph checkpoint in Redis was still sitting there.

This stores the same job dict shape you already had, just in Redis, keyed
by job_id, so job metadata survives restarts the same way the LangGraph
checkpoints do.
"""

import os
import json
import redis

REDIS_URL = os.getenv("REDIS_URL")
JOB_PREFIX = "vp:job:"
JOB_TTL_SECONDS = 60 * 60 * 24 * 3  # 3 days — tune, or drop `ex=` to never expire

_client: redis.Redis | None = None


def get_client() -> redis.Redis:
    global _client
    if _client is None:
        if not REDIS_URL:
            raise RuntimeError("REDIS_URL is not set")
        _client = redis.from_url(REDIS_URL, decode_responses=True)
    return _client


def _key(job_id: str) -> str:
    return f"{JOB_PREFIX}{job_id}"


def save_job(job_id: str, data: dict) -> None:
    get_client().set(_key(job_id), json.dumps(data), ex=JOB_TTL_SECONDS)


def get_job(job_id: str) -> dict | None:
    raw = get_client().get(_key(job_id))
    return json.loads(raw) if raw else None


def update_job(job_id: str, **updates) -> dict:
    """
    Read-modify-write. Fine here because only one worker writes to a given
    job_id at a time. If you later run multiple processes pushing updates
    to the SAME job_id concurrently, swap this for a Lua script or
    WATCH/MULTI to avoid lost updates.
    """
    job = get_job(job_id) or {}
    job.update(updates)
    save_job(job_id, job)
    return job


def list_job_ids_by_status(*statuses: str) -> list[str]:
    """
    Scan for jobs currently sitting in one of the given statuses. Used on
    startup to find jobs that were mid-flight when the server went down.
    """
    ids = []
    for key in get_client().scan_iter(f"{JOB_PREFIX}*"):
        raw = get_client().get(key)
        if not raw:
            continue
        job = json.loads(raw)
        if job.get("status") in statuses:
            ids.append(key[len(JOB_PREFIX):])
    return ids