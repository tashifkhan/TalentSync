import logging
import sys

from app.core.settings import get_settings

settings = get_settings()


def setup_logging() -> None:
    """Configure logging for the application."""
    # Basic configuration for standard logging
    logging.basicConfig(
        level=logging.DEBUG if settings.DEBUG else logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    logging.captureWarnings(True)

    # Set log levels for third-party libraries
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_access_logger = logging.getLogger("uvicorn.access")
    uvicorn_error_logger = logging.getLogger("uvicorn.error")
    fastapi_logger = logging.getLogger("fastapi")

    for logger in (
        uvicorn_logger,
        uvicorn_access_logger,
        uvicorn_error_logger,
        fastapi_logger,
    ):
        logger.setLevel(logging.INFO)
        logger.handlers.clear()
        logger.propagate = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
