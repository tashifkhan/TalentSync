# Use an official Python runtime as a parent image
FROM python:3.13-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PIP_NO_CACHE_DIR=1
ENV NLTK_DATA=/app/model/nltk_data

# Set the working directory in the container
WORKDIR /app

# Install uv (Python package installer)
RUN pip install --no-cache-dir uv

# Copy dependency manifests first for layer caching
COPY pyproject.toml uv.lock ./

# Install project dependencies using CPU-only torch wheels to avoid CUDA packages
# Using --system to install in the global environment
# Using --no-cache to reduce image size
RUN uv pip install --system --no-cache \
    --index-url https://download.pytorch.org/whl/cpu \
    --extra-index-url https://pypi.org/simple \
    . uvicorn

# Copy the entire app directory into the container
COPY app ./app

# Expose port 8000 to the outside world
EXPOSE 8000

# Command to run the application
# Using python -m uvicorn for more robust path handling
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
