from collections import defaultdict, deque
from threading import Lock
from time import time

from fastapi import HTTPException, Request, status

from app.config import RATE_LIMIT_BACKEND, REDIS_URL

try:
    from redis import Redis
except Exception:  # pragma: no cover
    Redis = None


_requests = defaultdict(deque)
_lock = Lock()
_redis_client = Redis.from_url(REDIS_URL) if (RATE_LIMIT_BACKEND == "redis" and Redis and REDIS_URL) else None


def _client_ip(request: Request) -> str:
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def enforce_rate_limit(
    request: Request,
    key_prefix: str,
    limit: int,
    window_seconds: int,
) -> None:
    now = time()
    key = f"{key_prefix}:{_client_ip(request)}"

    if _redis_client:
        _redis_enforce_limit(key=key, limit=limit, window_seconds=window_seconds)
        return

    with _lock:
        queue = _requests[key]
        cutoff = now - window_seconds
        while queue and queue[0] < cutoff:
            queue.popleft()

        if len(queue) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for {key_prefix}. Try again later.",
            )

        queue.append(now)


def _redis_enforce_limit(key: str, limit: int, window_seconds: int) -> None:
    # Sliding window approximation with sorted set per client key.
    now = time()
    min_score = now - window_seconds
    pipeline = _redis_client.pipeline()  # type: ignore[union-attr]
    pipeline.zremrangebyscore(key, 0, min_score)
    pipeline.zcard(key)
    removed_count, current_count = pipeline.execute()
    _ = removed_count

    if int(current_count) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Try again later.",
        )

    member = f"{now}"
    pipeline = _redis_client.pipeline()  # type: ignore[union-attr]
    pipeline.zadd(key, {member: now})
    pipeline.expire(key, window_seconds)
    pipeline.execute()
