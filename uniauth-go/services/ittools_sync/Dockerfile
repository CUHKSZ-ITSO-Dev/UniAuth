FROM python:3.13

RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip config set global.index-url https://mirrors.cloud.tencent.com/pypi/simple && \
    pip install --no-cache-dir \
    aiohttp>=3.12.15 \
    asyncio>=4.0.0 \
    asyncpg>=0.30.0 \
    requests>=2.32.4

WORKDIR /app

COPY sync.py /app/sync.py

CMD ["python3", "sync.py"]