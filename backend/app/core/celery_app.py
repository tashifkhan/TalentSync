from celery import Celery
from kombu import Queue

from app.core.settings import get_settings

settings = get_settings()

celery_app = Celery(
    "talentsync_backend",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    task_track_started=True,
    task_time_limit=settings.CELERY_TASK_TIMEOUT_SECONDS,
    result_expires=settings.CELERY_TASK_RESULT_EXPIRES_SECONDS,
    task_always_eager=settings.CELERY_TASK_ALWAYS_EAGER,
    worker_prefetch_multiplier=settings.CELERY_WORKER_PREFETCH_MULTIPLIER,
    task_default_queue=settings.CELERY_QUEUE_DEFAULT,
    task_queues=(
        Queue(settings.CELERY_QUEUE_DEFAULT),
        Queue(settings.CELERY_QUEUE_DOCUMENT),
        Queue(settings.CELERY_QUEUE_ANALYSIS),
    ),
    task_routes={
        "app.tasks.document_tasks.*": {"queue": settings.CELERY_QUEUE_DOCUMENT},
    },
)

celery_app.autodiscover_tasks(["app.tasks"])


def is_celery_enabled() -> bool:
    broker = settings.CELERY_BROKER_URL.strip().lower()
    return bool(broker)
