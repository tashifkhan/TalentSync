from __future__ import annotations

import logging
import logging.config
from contextvars import ContextVar
from typing import Any, Dict, Optional
from uuid import uuid4

from app.core.settings import get_settings

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get()
        return True


def bind_request_id(request_id: str) -> Any:
    return request_id_ctx.set(request_id)


def reset_request_id(token: Any) -> None:
    request_id_ctx.reset(token)


def _get_log_level() -> str:
    settings = get_settings()
    if settings.DEBUG:
        return "DEBUG"
    return settings.LOG_LEVEL.upper()


def get_logging_config() -> Dict[str, Any]:
    log_level = _get_log_level()

    return {
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {
            "request_id": {
                "()": "app.core.logging.RequestIdFilter",
            },
        },
        "formatters": {
            "standard": {
                "format": "%(asctime)s %(levelname)s %(name)s [%(request_id)s] %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "access": {
                "()": "uvicorn.logging.AccessFormatter",
                "format": '%(asctime)s %(levelname)s %(name)s [%(request_id)s] %(client_addr)s - "%(request_line)s" %(status_code)s',
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "standard",
                "filters": ["request_id"],
                "stream": "ext://sys.stdout",
            },
            "access": {
                "class": "logging.StreamHandler",
                "formatter": "access",
                "filters": ["request_id"],
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "uvicorn": {
                "handlers": ["console"],
                "level": log_level,
                "propagate": False,
            },
            "uvicorn.error": {
                "handlers": ["console"],
                "level": log_level,
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["access"],
                "level": "INFO",
                "propagate": False,
            },
            "fastapi": {
                "handlers": ["console"],
                "level": log_level,
                "propagate": False,
            },
        },
        "root": {
            "handlers": ["console"],
            "level": log_level,
        },
    }


def setup_logging() -> None:
    logging.config.dictConfig(get_logging_config())
    logging.captureWarnings(True)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def get_request_id() -> str:
    return request_id_ctx.get()


def build_request_id(existing: Optional[str] = None) -> str:
    if existing:
        return existing
    return str(uuid4())
