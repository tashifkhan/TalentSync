# syntax=docker/dockerfile:1.7

FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    NLTK_DATA=/app/model/nltk_data

WORKDIR /app

# Install uv (and keep it cached when possible)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir uv

# Copy only dependency manifests first (better caching)
COPY pyproject.toml uv.lock ./

# Install dependencies (cache uv downloads)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system --no-cache . uvicorn

# Copy application code
COPY app ./app

# Create required runtime dirs
RUN mkdir -p /app/uploads "$NLTK_DATA"

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
