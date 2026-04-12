import hashlib
import json
import logging
from typing import Any

from app.core.settings import get_settings

try:
    import redis
    import redis.asyncio as redis_async
except Exception:
    redis = None
    redis_async = None

logger = logging.getLogger(__name__)
settings = get_settings()

_redis_async_client = None
_redis_sync_client = None


def build_cache_key(namespace: str, payload: str) -> str:
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    return f"talentsync:{namespace}:{digest}"


async def connect_redis_cache() -> bool:
    global _redis_async_client

    if not settings.ENABLE_REDIS_CACHE:
        return False
    if redis_async is None:
        return False
    if _redis_async_client is not None:
        return True

    try:
        _redis_async_client = redis_async.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
        await _redis_async_client.ping()
        return True
    except Exception as error:
        logger.warning("Redis cache unavailable: %s", error)
        _redis_async_client = None
        return False


async def close_redis_cache() -> None:
    global _redis_async_client
    if _redis_async_client is None:
        return

    try:
        await _redis_async_client.aclose()
    except Exception:
        logger.debug("Redis async close failed", exc_info=True)
    finally:
        _redis_async_client = None


def _get_sync_client():
    global _redis_sync_client

    if not settings.ENABLE_REDIS_CACHE:
        return None
    if redis is None:
        return None
    if _redis_sync_client is not None:
        return _redis_sync_client

    try:
        _redis_sync_client = redis.Redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
        _redis_sync_client.ping()
        return _redis_sync_client
    except Exception as error:
        logger.warning("Redis sync cache unavailable: %s", error)
        _redis_sync_client = None
        return None


async def get_cached_json(cache_key: str) -> dict[str, Any] | None:
    if _redis_async_client is None and not await connect_redis_cache():
        return None

    try:
        raw = await _redis_async_client.get(cache_key)
    except Exception:
        logger.debug("Redis async get failed", exc_info=True)
        return None

    if not raw:
        return None

    try:
        loaded = json.loads(raw)
    except json.JSONDecodeError:
        return None

    if isinstance(loaded, dict):
        return loaded
    return None


async def set_cached_json(
    cache_key: str,
    value: dict[str, Any],
    *,
    ttl_seconds: int | None = None,
) -> None:
    if _redis_async_client is None and not await connect_redis_cache():
        return

    ttl = ttl_seconds or settings.REDIS_CACHE_TTL_SECONDS

    try:
        payload = json.dumps(value, ensure_ascii=True)
        await _redis_async_client.set(cache_key, payload, ex=ttl)
    except Exception:
        logger.debug("Redis async set failed", exc_info=True)


def get_cached_json_sync(cache_key: str) -> dict[str, Any] | None:
    client = _get_sync_client()
    if client is None:
        return None

    try:
        raw = client.get(cache_key)
    except Exception:
        logger.debug("Redis sync get failed", exc_info=True)
        return None

    if not raw:
        return None

    try:
        loaded = json.loads(raw)
    except json.JSONDecodeError:
        return None

    if isinstance(loaded, dict):
        return loaded
    return None


def set_cached_json_sync(
    cache_key: str,
    value: dict[str, Any],
    *,
    ttl_seconds: int | None = None,
) -> None:
    client = _get_sync_client()
    if client is None:
        return

    ttl = ttl_seconds or settings.REDIS_CACHE_TTL_SECONDS

    try:
        payload = json.dumps(value, ensure_ascii=True)
        client.set(cache_key, payload, ex=ttl)
    except Exception:
        logger.debug("Redis sync set failed", exc_info=True)


async def redis_health() -> dict[str, Any]:
    if not settings.ENABLE_REDIS_CACHE:
        return {"enabled": False, "connected": False}

    if _redis_async_client is None and not await connect_redis_cache():
        return {"enabled": True, "connected": False}

    try:
        pong = await _redis_async_client.ping()
    except Exception:
        return {"enabled": True, "connected": False}

    return {"enabled": True, "connected": bool(pong)}
