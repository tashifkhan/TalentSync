import base64

from app.core.celery_app import celery_app
from app.services.process_resume import process_document_local


@celery_app.task(name="app.tasks.document_tasks.process_document_task")
def process_document_task(file_bytes_b64: str, file_name: str) -> str:
    file_bytes = base64.b64decode(file_bytes_b64.encode("ascii"))
    result = process_document_local(file_bytes, file_name)
    return result or ""
