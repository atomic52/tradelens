FROM python:3.12-slim

WORKDIR /app

# Install system deps needed by pdfplumber
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpoppler-cpp-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps via pip (exported from poetry)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Run migrations then start the server
CMD alembic upgrade head && \
    uvicorn app.main:app --host 0.0.0.0 --port 8080
