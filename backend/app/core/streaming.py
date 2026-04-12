import logging
from datetime import datetime, timezone
from typing import Any

from faststream.kafka import KafkaBroker

from app.core.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

broker = KafkaBroker(settings.KAFKA_BOOTSTRAP_SERVERS)
_kafka_started = False


async def connect_kafka() -> bool:
    global _kafka_started

    if not settings.ENABLE_KAFKA_EVENTS:
        return False
    if _kafka_started:
        return True

    try:
        await broker.connect()
        _kafka_started = True
        return True
    except Exception as error:
        logger.warning("Kafka broker unavailable: %s", error)
        _kafka_started = False
        return False


async def close_kafka() -> None:
    global _kafka_started
    if not _kafka_started:
        return

    try:
        await broker.close()
    except Exception:
        logger.debug("Kafka close failed", exc_info=True)
    finally:
        _kafka_started = False


async def publish_event(event_type: str, payload: dict[str, Any]) -> None:
    if not settings.ENABLE_KAFKA_EVENTS:
        return
    if not await connect_kafka():
        return

    message = {
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": payload,
    }

    try:
        await broker.publish(message, topic=settings.KAFKA_EVENTS_TOPIC)
    except Exception:
        logger.debug("Kafka publish failed", exc_info=True)


async def kafka_health() -> dict[str, Any]:
    if not settings.ENABLE_KAFKA_EVENTS:
        return {"enabled": False, "connected": False}

    connected = _kafka_started or await connect_kafka()
    return {
        "enabled": True,
        "connected": connected,
        "topic": settings.KAFKA_EVENTS_TOPIC,
    }
