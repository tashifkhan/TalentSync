from fastapi import APIRouter

from app.core.cache import redis_health
from app.core.streaming import kafka_health

router = APIRouter(prefix="/infra", tags=["Infrastructure"])


@router.get("/health")
async def infrastructure_health() -> dict:
    redis_status = await redis_health()
    kafka_status = await kafka_health()

    status = "healthy"
    if (redis_status.get("enabled") and not redis_status.get("connected")) or (
        kafka_status.get("enabled") and not kafka_status.get("connected")
    ):
        status = "degraded"

    return {
        "status": status,
        "redis": redis_status,
        "kafka": kafka_status,
    }
