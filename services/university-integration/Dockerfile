# University Integration Service Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for Playwright and Hebrew support
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    git \
    fonts-liberation \
    fonts-noto \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    fonts-dejavu \
    locales \
    && rm -rf /var/lib/apt/lists/*

# Set up Hebrew locale
RUN sed -i '/he_IL.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen
ENV LANG he_IL.UTF-8
ENV LANGUAGE he_IL:he
ENV LC_ALL he_IL.UTF-8

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN playwright install chromium
RUN playwright install-deps

# Copy application code
COPY src/ ./src/
COPY config/ ./config/

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8002/health')"

# Start command
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8002"]