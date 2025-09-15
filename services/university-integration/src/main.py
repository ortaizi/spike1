#!/usr/bin/env python3
"""
University Integration Service - Phase 2 Microservice
מיקרושירות לאינטגרציה עם מערכות האוניברסיטה

This service handles:
- Multi-university scraping (BGU, TAU, HUJI)
- Rate limiting per university
- Job orchestration with Celery
- Credential validation and security
- Event-driven notifications
"""

import os
import sys
import asyncio
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
import aioredis
import httpx
from celery import Celery

# Configure Hebrew-compatible logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Environment configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost/university_integration')
AUTH_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://localhost:8001')
NOTIFICATION_SERVICE_URL = os.getenv('NOTIFICATION_SERVICE_URL', 'http://localhost:8003')
RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://localhost:5672')

# Initialize FastAPI app
app = FastAPI(
    title="University Integration Service",
    description="Multi-tenant university data scraping and integration service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for multi-tenant access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Celery for background tasks
celery = Celery(
    'university_integration',
    broker=RABBITMQ_URL,
    backend=REDIS_URL,
    include=['src.tasks.scraping_tasks']
)

# Configure Celery for Hebrew support
celery.conf.update(
    timezone='Asia/Jerusalem',
    enable_utc=True,
    result_expires=3600,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    task_routes={
        'src.tasks.scraping_tasks.sync_user_data': {'queue': 'scraping'},
        'src.tasks.scraping_tasks.validate_credentials': {'queue': 'validation'},
        'src.tasks.scraping_tasks.bulk_sync': {'queue': 'bulk_operations'}
    }
)

# Pydantic models
class UniversityCredentials(BaseModel):
    university_id: str  # 'bgu', 'tau', 'huji'
    username: str
    password: str
    tenant_id: str

class SyncJobRequest(BaseModel):
    user_id: str
    tenant_id: str
    university_id: str
    job_type: str = "full_sync"  # full_sync, courses_only, grades_only
    priority: int = 1  # 1-5, 5 being highest

class CredentialValidationRequest(BaseModel):
    credentials: UniversityCredentials
    validation_type: str = "quick"  # quick, full

@dataclass
class SyncJobStatus:
    job_id: str
    status: str  # pending, running, completed, failed
    progress_percentage: int
    message_he: str
    message_en: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_details: Optional[str] = None

class UniversityIntegrationService:
    """מיקרושירות לאינטגרציה עם אוניברסיטאות"""

    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self.http_client: Optional[httpx.AsyncClient] = None
        self.university_configs = self._load_university_configs()

    async def startup(self):
        """Initialize service connections"""
        try:
            # Initialize Redis for caching and rate limiting
            self.redis = await aioredis.from_url(REDIS_URL)

            # Initialize HTTP client for service communication
            self.http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0),
                headers={
                    'User-Agent': 'Spike-UniversityIntegration/1.0',
                    'Accept-Language': 'he-IL,he,en-US,en'
                }
            )

            logger.info("🚀 University Integration Service initialized successfully")

        except Exception as e:
            logger.error(f"❌ Failed to initialize service: {e}")
            raise

    async def shutdown(self):
        """Cleanup service connections"""
        try:
            if self.redis:
                await self.redis.close()
            if self.http_client:
                await self.http_client.aclose()

            logger.info("🧹 University Integration Service shutdown completed")

        except Exception as e:
            logger.warning(f"⚠️ Error during shutdown: {e}")

    def _load_university_configs(self) -> Dict[str, Dict[str, Any]]:
        """Load configuration for all supported universities"""
        return {
            'bgu': {
                'name': 'אוניברסיטת בן-גוריון בנגב',
                'name_en': 'Ben-Gurion University of the Negev',
                'moodle_url': 'https://moodle.bgu.ac.il',
                'scraper_class': 'BGUScraper',
                'rate_limits': {
                    'requests_per_minute': 30,
                    'concurrent_sessions': 5,
                    'retry_delay': 60,
                    'max_retries': 3
                },
                'supported_features': ['courses', 'grades', 'assignments', 'calendar'],
                'timezone': 'Asia/Jerusalem',
                'locale': 'he-IL'
            },
            'tau': {
                'name': 'אוניברסיטת תל אביב',
                'name_en': 'Tel Aviv University',
                'moodle_url': 'https://moodle.tau.ac.il',
                'scraper_class': 'TAUScraper',
                'rate_limits': {
                    'requests_per_minute': 25,
                    'concurrent_sessions': 3,
                    'retry_delay': 90,
                    'max_retries': 3
                },
                'supported_features': ['courses', 'grades', 'assignments'],
                'timezone': 'Asia/Jerusalem',
                'locale': 'he-IL'
            },
            'huji': {
                'name': 'האוניברסיטה העברית בירושלים',
                'name_en': 'Hebrew University of Jerusalem',
                'moodle_url': 'https://moodle.huji.ac.il',
                'scraper_class': 'HUJIScraper',
                'rate_limits': {
                    'requests_per_minute': 20,
                    'concurrent_sessions': 2,
                    'retry_delay': 120,
                    'max_retries': 3
                },
                'supported_features': ['courses', 'grades'],
                'timezone': 'Asia/Jerusalem',
                'locale': 'he-IL'
            }
        }

    async def validate_tenant_access(self, tenant_id: str, user_id: str) -> bool:
        """Validate tenant access via Auth Service"""
        try:
            async with self.http_client as client:
                response = await client.post(
                    f"{AUTH_SERVICE_URL}/auth/validate-tenant",
                    json={
                        'tenant_id': tenant_id,
                        'user_id': user_id
                    }
                )
                return response.status_code == 200

        except Exception as e:
            logger.error(f"❌ Failed to validate tenant access: {e}")
            return False

    async def check_rate_limits(self, tenant_id: str, university_id: str) -> bool:
        """Check if rate limits allow new requests"""
        try:
            config = self.university_configs.get(university_id)
            if not config:
                return False

            rate_key = f"rate_limit:{tenant_id}:{university_id}"
            current_requests = await self.redis.get(rate_key)

            if current_requests is None:
                # First request in this window
                await self.redis.setex(rate_key, 60, 1)
                return True

            requests_count = int(current_requests)
            max_requests = config['rate_limits']['requests_per_minute']

            if requests_count >= max_requests:
                logger.warning(f"⚠️ Rate limit exceeded for {tenant_id}:{university_id}")
                return False

            # Increment counter
            await self.redis.incr(rate_key)
            return True

        except Exception as e:
            logger.error(f"❌ Rate limit check failed: {e}")
            return False

    async def queue_sync_job(self, sync_request: SyncJobRequest) -> Dict[str, Any]:
        """Queue a new synchronization job"""
        try:
            # Validate tenant access
            if not await self.validate_tenant_access(sync_request.tenant_id, sync_request.user_id):
                raise HTTPException(status_code=403, detail="Tenant access denied")

            # Check rate limits
            if not await self.check_rate_limits(sync_request.tenant_id, sync_request.university_id):
                raise HTTPException(status_code=429, detail="Rate limit exceeded")

            # Create job ID
            job_id = f"sync_{sync_request.tenant_id}_{sync_request.user_id}_{int(datetime.utcnow().timestamp())}"

            # Queue Celery task
            task = celery.send_task(
                'src.tasks.scraping_tasks.sync_user_data',
                args=[
                    job_id,
                    sync_request.user_id,
                    sync_request.tenant_id,
                    sync_request.university_id,
                    sync_request.job_type
                ],
                kwargs={
                    'priority': sync_request.priority
                }
            )

            # Store job metadata
            job_metadata = {
                'job_id': job_id,
                'task_id': task.id,
                'user_id': sync_request.user_id,
                'tenant_id': sync_request.tenant_id,
                'university_id': sync_request.university_id,
                'job_type': sync_request.job_type,
                'status': 'queued',
                'created_at': datetime.utcnow().isoformat(),
                'priority': sync_request.priority
            }

            await self.redis.setex(
                f"job_metadata:{job_id}",
                3600,  # 1 hour expiry
                str(job_metadata)
            )

            logger.info(f"✅ Sync job queued: {job_id} for {sync_request.tenant_id}:{sync_request.user_id}")

            return {
                'job_id': job_id,
                'task_id': task.id,
                'status': 'queued',
                'message_he': 'המשימה נוספה לתור בהצלחה',
                'message_en': 'Job successfully queued',
                'estimated_completion': '5-10 minutes'
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Failed to queue sync job: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to queue job: {str(e)}")

# Initialize service
service = UniversityIntegrationService()

# FastAPI event handlers
@app.on_event("startup")
async def startup_event():
    await service.startup()

@app.on_event("shutdown")
async def shutdown_event():
    await service.shutdown()

# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'service': 'university-integration',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat(),
        'supported_universities': list(service.university_configs.keys())
    }

@app.get("/universities")
async def get_supported_universities():
    """Get list of supported universities"""
    universities = []
    for uni_id, config in service.university_configs.items():
        universities.append({
            'id': uni_id,
            'name_he': config['name'],
            'name_en': config['name_en'],
            'features': config['supported_features']
        })

    return {'universities': universities}

@app.post("/validate-credentials")
async def validate_credentials(request: CredentialValidationRequest):
    """Validate university credentials"""
    try:
        # Queue credential validation task
        task = celery.send_task(
            'src.tasks.scraping_tasks.validate_credentials',
            args=[
                request.credentials.dict(),
                request.validation_type
            ]
        )

        return {
            'task_id': task.id,
            'status': 'validating',
            'message_he': 'מבצע אימות פרטי התחברות',
            'message_en': 'Validating credentials'
        }

    except Exception as e:
        logger.error(f"❌ Credential validation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sync")
async def create_sync_job(request: SyncJobRequest):
    """Create new synchronization job"""
    return await service.queue_sync_job(request)

@app.get("/sync/{job_id}/status")
async def get_job_status(job_id: str):
    """Get synchronization job status"""
    try:
        # Get job metadata from Redis
        metadata = await service.redis.get(f"job_metadata:{job_id}")
        if not metadata:
            raise HTTPException(status_code=404, detail="Job not found")

        # Get task status from Celery
        task_result = celery.AsyncResult(job_id)

        return {
            'job_id': job_id,
            'status': task_result.status.lower(),
            'result': task_result.result if task_result.ready() else None,
            'metadata': eval(metadata.decode()) if isinstance(metadata, bytes) else metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get job status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tenant/{tenant_id}/stats")
async def get_tenant_stats(tenant_id: str):
    """Get synchronization statistics for tenant"""
    try:
        # Get rate limit status for all universities
        stats = {
            'tenant_id': tenant_id,
            'rate_limits': {},
            'active_jobs': 0,
            'total_syncs_today': 0
        }

        for uni_id in service.university_configs.keys():
            rate_key = f"rate_limit:{tenant_id}:{uni_id}"
            current_requests = await service.redis.get(rate_key)
            max_requests = service.university_configs[uni_id]['rate_limits']['requests_per_minute']

            stats['rate_limits'][uni_id] = {
                'current': int(current_requests) if current_requests else 0,
                'limit': max_requests,
                'remaining': max_requests - (int(current_requests) if current_requests else 0)
            }

        return stats

    except Exception as e:
        logger.error(f"❌ Failed to get tenant stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_config={
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "level": "INFO",
                "handlers": ["default"],
            },
        }
    )