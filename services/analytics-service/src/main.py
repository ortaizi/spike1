#!/usr/bin/env python3
"""
Analytics Service - Phase 2 Microservice
שירות אנליטיקה - מיקרושירות שלב 2

This service handles:
- CQRS for dashboard queries
- Event sourcing for user actions
- Performance analytics
- Academic performance tracking
- Usage metrics collection
- Real-time dashboards
- Multi-tenant analytics isolation
"""

import os
import sys
import asyncio
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import json
import uuid
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
import aioredis
import httpx
import asyncpg
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import pandas as pd
import numpy as np
from collections import defaultdict, Counter

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
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost/analytics_service')
ASYNC_DATABASE_URL = os.getenv('ASYNC_DATABASE_URL', 'postgresql+asyncpg://user:pass@localhost/analytics_service')
RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://localhost:5672')
AUTH_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://localhost:8001')

# Initialize FastAPI app
app = FastAPI(
    title="Analytics Service",
    description="Multi-tenant analytics service with CQRS and event sourcing",
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

# Enums
class EventType(str, Enum):
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    SYNC_STARTED = "sync_started"
    SYNC_COMPLETED = "sync_completed"
    SYNC_FAILED = "sync_failed"
    GRADE_VIEWED = "grade_viewed"
    COURSE_ACCESSED = "course_accessed"
    ASSIGNMENT_VIEWED = "assignment_viewed"
    NOTIFICATION_SENT = "notification_sent"
    NOTIFICATION_CLICKED = "notification_clicked"

class AggregationType(str, Enum):
    COUNT = "count"
    SUM = "sum"
    AVERAGE = "average"
    MIN = "min"
    MAX = "max"
    DISTINCT_COUNT = "distinct_count"

class TimeWindow(str, Enum):
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"

# Pydantic models
class AnalyticsEvent(BaseModel):
    event_id: str = None
    event_type: EventType
    tenant_id: str
    user_id: str
    session_id: Optional[str] = None
    timestamp: datetime = None
    data: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}

    def __init__(self, **data):
        if 'event_id' not in data or not data['event_id']:
            data['event_id'] = str(uuid.uuid4())
        if 'timestamp' not in data or not data['timestamp']:
            data['timestamp'] = datetime.utcnow()
        super().__init__(**data)

class QueryRequest(BaseModel):
    tenant_id: str
    metric: str
    aggregation: AggregationType
    time_window: TimeWindow
    start_date: datetime
    end_date: datetime
    filters: Dict[str, Any] = {}
    group_by: List[str] = []

class DashboardQuery(BaseModel):
    tenant_id: str
    user_id: Optional[str] = None
    dashboard_type: str = "overview"  # overview, academic, usage
    time_range: str = "7d"  # 1h, 24h, 7d, 30d, 90d

class UserMetrics(BaseModel):
    user_id: str
    tenant_id: str
    total_logins: int
    total_syncs: int
    successful_syncs: int
    failed_syncs: int
    average_session_duration: float
    courses_accessed: int
    grades_viewed: int
    assignments_viewed: int
    last_activity: datetime

class TenantMetrics(BaseModel):
    tenant_id: str
    total_users: int
    active_users_today: int
    active_users_week: int
    total_syncs_today: int
    successful_sync_rate: float
    average_response_time: float
    top_courses: List[Dict[str, Any]]
    peak_usage_hours: List[int]

@dataclass
class MaterializedView:
    """Materialized view for optimized queries"""
    name: str
    query: str
    refresh_interval: int  # seconds
    last_refreshed: datetime
    tenant_specific: bool = True

class AnalyticsService:
    """שירות אנליטיקה עם CQRS ו-Event Sourcing"""

    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self.http_client: Optional[httpx.AsyncClient] = None
        self.db_engine = None
        self.async_db_engine = None
        self.materialized_views: Dict[str, MaterializedView] = {}

    async def startup(self):
        """Initialize service connections"""
        try:
            # Initialize Redis for caching and real-time data
            self.redis = await aioredis.from_url(REDIS_URL)

            # Initialize HTTP client for service communication
            self.http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0),
                headers={
                    'User-Agent': 'Spike-AnalyticsService/1.0',
                    'Accept-Language': 'he-IL,he,en-US,en'
                }
            )

            # Initialize database connections
            self.db_engine = create_engine(DATABASE_URL, pool_size=20, max_overflow=30)
            self.async_db_engine = create_async_engine(ASYNC_DATABASE_URL, pool_size=20, max_overflow=30)

            # Create database tables
            await self._create_tables()

            # Initialize materialized views
            await self._setup_materialized_views()

            # Start background tasks
            asyncio.create_task(self._refresh_materialized_views_loop())
            asyncio.create_task(self._process_event_stream())

            logger.info("📊 Analytics Service initialized successfully")

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
            if self.async_db_engine:
                await self.async_db_engine.dispose()

            logger.info("🧹 Analytics Service shutdown completed")

        except Exception as e:
            logger.warning(f"⚠️ Error during shutdown: {e}")

    async def _create_tables(self):
        """Create database tables for event sourcing"""
        create_tables_sql = """
        -- Events table for event sourcing
        CREATE TABLE IF NOT EXISTS analytics_events (
            event_id UUID PRIMARY KEY,
            event_type VARCHAR(50) NOT NULL,
            tenant_id VARCHAR(50) NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            session_id VARCHAR(255),
            timestamp TIMESTAMP DEFAULT NOW(),
            data JSONB DEFAULT '{}',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW()
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_events_tenant_time ON analytics_events(tenant_id, timestamp);
        CREATE INDEX IF NOT EXISTS idx_events_user_time ON analytics_events(user_id, timestamp);
        CREATE INDEX IF NOT EXISTS idx_events_type_time ON analytics_events(event_type, timestamp);
        CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);

        -- Materialized view for user metrics
        CREATE MATERIALIZED VIEW IF NOT EXISTS user_metrics AS
        SELECT
            tenant_id,
            user_id,
            COUNT(*) FILTER (WHERE event_type = 'user_login') as total_logins,
            COUNT(*) FILTER (WHERE event_type = 'sync_started') as total_syncs,
            COUNT(*) FILTER (WHERE event_type = 'sync_completed') as successful_syncs,
            COUNT(*) FILTER (WHERE event_type = 'sync_failed') as failed_syncs,
            COUNT(DISTINCT session_id) as total_sessions,
            COUNT(*) FILTER (WHERE event_type = 'course_accessed') as courses_accessed,
            COUNT(*) FILTER (WHERE event_type = 'grade_viewed') as grades_viewed,
            COUNT(*) FILTER (WHERE event_type = 'assignment_viewed') as assignments_viewed,
            MAX(timestamp) as last_activity
        FROM analytics_events
        GROUP BY tenant_id, user_id;

        -- Materialized view for tenant metrics
        CREATE MATERIALIZED VIEW IF NOT EXISTS tenant_metrics AS
        SELECT
            tenant_id,
            COUNT(DISTINCT user_id) as total_users,
            COUNT(DISTINCT user_id) FILTER (WHERE timestamp >= NOW() - INTERVAL '1 day') as active_users_today,
            COUNT(DISTINCT user_id) FILTER (WHERE timestamp >= NOW() - INTERVAL '7 days') as active_users_week,
            COUNT(*) FILTER (WHERE event_type = 'sync_started' AND timestamp >= NOW() - INTERVAL '1 day') as total_syncs_today,
            CASE
                WHEN COUNT(*) FILTER (WHERE event_type = 'sync_started') > 0
                THEN COUNT(*) FILTER (WHERE event_type = 'sync_completed') * 100.0 / COUNT(*) FILTER (WHERE event_type = 'sync_started')
                ELSE 0
            END as successful_sync_rate
        FROM analytics_events
        GROUP BY tenant_id;

        -- Materialized view for hourly usage patterns
        CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_usage AS
        SELECT
            tenant_id,
            EXTRACT(hour FROM timestamp) as hour_of_day,
            COUNT(*) as event_count,
            COUNT(DISTINCT user_id) as unique_users
        FROM analytics_events
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY tenant_id, EXTRACT(hour FROM timestamp);
        """

        try:
            async with self.async_db_engine.begin() as conn:
                await conn.execute(text(create_tables_sql))
                logger.info("📋 Database tables created successfully")

        except Exception as e:
            logger.error(f"❌ Failed to create database tables: {e}")
            raise

    async def _setup_materialized_views(self):
        """Setup materialized views for optimized queries"""
        self.materialized_views = {
            'user_metrics': MaterializedView(
                name='user_metrics',
                query='REFRESH MATERIALIZED VIEW CONCURRENTLY user_metrics',
                refresh_interval=300,  # 5 minutes
                last_refreshed=datetime.utcnow(),
                tenant_specific=True
            ),
            'tenant_metrics': MaterializedView(
                name='tenant_metrics',
                query='REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_metrics',
                refresh_interval=600,  # 10 minutes
                last_refreshed=datetime.utcnow(),
                tenant_specific=True
            ),
            'hourly_usage': MaterializedView(
                name='hourly_usage',
                query='REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_usage',
                refresh_interval=3600,  # 1 hour
                last_refreshed=datetime.utcnow(),
                tenant_specific=True
            )
        }

    async def _refresh_materialized_views_loop(self):
        """Background task to refresh materialized views"""
        while True:
            try:
                for view_name, view in self.materialized_views.items():
                    if (datetime.utcnow() - view.last_refreshed).seconds >= view.refresh_interval:
                        await self._refresh_materialized_view(view_name)

                await asyncio.sleep(60)  # Check every minute

            except Exception as e:
                logger.error(f"❌ Error in materialized view refresh loop: {e}")
                await asyncio.sleep(60)

    async def _refresh_materialized_view(self, view_name: str):
        """Refresh a specific materialized view"""
        try:
            view = self.materialized_views[view_name]

            async with self.async_db_engine.begin() as conn:
                await conn.execute(text(view.query))
                view.last_refreshed = datetime.utcnow()

                logger.info(f"🔄 Refreshed materialized view: {view_name}")

        except Exception as e:
            logger.error(f"❌ Failed to refresh materialized view {view_name}: {e}")

    async def _process_event_stream(self):
        """Background task to process incoming events from Redis stream"""
        while True:
            try:
                # Process events from Redis streams
                streams = await self.redis.xread({
                    'analytics_events': '$'
                }, count=100, block=5000)

                for stream_name, events in streams:
                    for event_id, fields in events:
                        await self._process_single_event(fields)

                await asyncio.sleep(1)

            except Exception as e:
                logger.error(f"❌ Error in event stream processing: {e}")
                await asyncio.sleep(5)

    async def _process_single_event(self, event_fields: Dict):
        """Process a single event and update real-time metrics"""
        try:
            # Decode event data
            event_data = json.loads(event_fields.get('data', '{}'))
            event_type = event_fields.get('event_type')
            tenant_id = event_fields.get('tenant_id')
            user_id = event_fields.get('user_id')

            # Update real-time counters in Redis
            await self._update_real_time_metrics(tenant_id, user_id, event_type, event_data)

        except Exception as e:
            logger.error(f"❌ Failed to process event: {e}")

    async def _update_real_time_metrics(self, tenant_id: str, user_id: str, event_type: str, event_data: Dict):
        """Update real-time metrics in Redis"""
        try:
            current_hour = datetime.utcnow().strftime('%Y-%m-%d:%H')

            # Increment hourly counters
            await self.redis.hincrby(f"hourly_stats:{tenant_id}:{current_hour}", event_type, 1)
            await self.redis.hincrby(f"hourly_stats:{tenant_id}:{current_hour}", "total_events", 1)

            # Track active users
            await self.redis.sadd(f"active_users:{tenant_id}:{current_hour}", user_id)

            # Set expiry for Redis keys (30 days)
            await self.redis.expire(f"hourly_stats:{tenant_id}:{current_hour}", 2592000)
            await self.redis.expire(f"active_users:{tenant_id}:{current_hour}", 2592000)

            # Update user session data
            if event_type in ['user_login', 'user_logout']:
                session_key = f"user_session:{tenant_id}:{user_id}"
                await self.redis.hset(session_key, event_type, datetime.utcnow().isoformat())
                await self.redis.expire(session_key, 86400)  # 24 hours

        except Exception as e:
            logger.error(f"❌ Failed to update real-time metrics: {e}")

    async def validate_tenant_access(self, tenant_id: str, user_id: str = None) -> bool:
        """Validate tenant access via Auth Service"""
        try:
            if not user_id:
                return True  # Allow tenant-wide analytics for admin users

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

    async def ingest_event(self, event: AnalyticsEvent) -> Dict[str, Any]:
        """Ingest analytics event into the system"""
        try:
            # Store in PostgreSQL (event sourcing)
            insert_sql = """
            INSERT INTO analytics_events
            (event_id, event_type, tenant_id, user_id, session_id, timestamp, data, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """

            async with self.async_db_engine.begin() as conn:
                await conn.execute(text(insert_sql), {
                    'event_id': event.event_id,
                    'event_type': event.event_type.value,
                    'tenant_id': event.tenant_id,
                    'user_id': event.user_id,
                    'session_id': event.session_id,
                    'timestamp': event.timestamp,
                    'data': json.dumps(event.data),
                    'metadata': json.dumps(event.metadata)
                })

            # Add to Redis stream for real-time processing
            await self.redis.xadd(
                'analytics_events',
                {
                    'event_id': event.event_id,
                    'event_type': event.event_type.value,
                    'tenant_id': event.tenant_id,
                    'user_id': event.user_id,
                    'session_id': event.session_id or '',
                    'timestamp': event.timestamp.isoformat(),
                    'data': json.dumps(event.data),
                    'metadata': json.dumps(event.metadata)
                }
            )

            # Update real-time metrics
            await self._update_real_time_metrics(
                event.tenant_id,
                event.user_id,
                event.event_type.value,
                event.data
            )

            logger.info(f"📈 Event ingested: {event.event_type.value} for {event.tenant_id}:{event.user_id}")

            return {
                'success': True,
                'event_id': event.event_id,
                'message_he': 'האירוע נקלט בהצלחה',
                'message_en': 'Event ingested successfully'
            }

        except Exception as e:
            logger.error(f"❌ Failed to ingest event: {e}")
            return {
                'success': False,
                'error': str(e),
                'message_he': f'שגיאה בקליטת האירוע: {str(e)}',
                'message_en': f'Event ingestion failed: {str(e)}'
            }

    async def execute_query(self, query_request: QueryRequest) -> Dict[str, Any]:
        """Execute analytics query with CQRS pattern"""
        try:
            # Build SQL query based on request
            base_query = f"""
            SELECT
                {self._build_select_clause(query_request)},
                {self._build_group_by_clause(query_request)}
            FROM analytics_events
            WHERE tenant_id = $1
            AND timestamp BETWEEN $2 AND $3
            {self._build_filters_clause(query_request)}
            {f"GROUP BY {', '.join(query_request.group_by)}" if query_request.group_by else ""}
            ORDER BY timestamp DESC
            LIMIT 1000
            """

            # Execute query
            async with self.async_db_engine.begin() as conn:
                result = await conn.execute(text(base_query), {
                    'tenant_id': query_request.tenant_id,
                    'start_date': query_request.start_date,
                    'end_date': query_request.end_date
                })

                rows = result.fetchall()

            # Process results
            processed_data = []
            for row in rows:
                processed_data.append(dict(row))

            return {
                'success': True,
                'data': processed_data,
                'count': len(processed_data),
                'query_time': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Query execution failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'message_he': f'שגיאה בביצוע השאילתה: {str(e)}',
                'message_en': f'Query execution failed: {str(e)}'
            }

    def _build_select_clause(self, query_request: QueryRequest) -> str:
        """Build SELECT clause based on aggregation type"""
        metric = query_request.metric
        aggregation = query_request.aggregation

        if aggregation == AggregationType.COUNT:
            return f"COUNT(*) as {metric}"
        elif aggregation == AggregationType.DISTINCT_COUNT:
            return f"COUNT(DISTINCT {metric}) as distinct_{metric}"
        elif aggregation == AggregationType.SUM:
            return f"SUM(CAST(data->>'{metric}' AS NUMERIC)) as sum_{metric}"
        elif aggregation == AggregationType.AVERAGE:
            return f"AVG(CAST(data->>'{metric}' AS NUMERIC)) as avg_{metric}"
        elif aggregation == AggregationType.MIN:
            return f"MIN(CAST(data->>'{metric}' AS NUMERIC)) as min_{metric}"
        elif aggregation == AggregationType.MAX:
            return f"MAX(CAST(data->>'{metric}' AS NUMERIC)) as max_{metric}"
        else:
            return "COUNT(*) as count"

    def _build_group_by_clause(self, query_request: QueryRequest) -> str:
        """Build time window grouping clause"""
        time_window = query_request.time_window

        if time_window == TimeWindow.HOUR:
            return "DATE_TRUNC('hour', timestamp) as time_bucket"
        elif time_window == TimeWindow.DAY:
            return "DATE_TRUNC('day', timestamp) as time_bucket"
        elif time_window == TimeWindow.WEEK:
            return "DATE_TRUNC('week', timestamp) as time_bucket"
        elif time_window == TimeWindow.MONTH:
            return "DATE_TRUNC('month', timestamp) as time_bucket"
        elif time_window == TimeWindow.YEAR:
            return "DATE_TRUNC('year', timestamp) as time_bucket"
        else:
            return "timestamp as time_bucket"

    def _build_filters_clause(self, query_request: QueryRequest) -> str:
        """Build WHERE clause filters"""
        if not query_request.filters:
            return ""

        filters = []
        for key, value in query_request.filters.items():
            if key in ['event_type', 'user_id']:
                filters.append(f"AND {key} = '{value}'")
            else:
                filters.append(f"AND data->>'{key}' = '{value}'")

        return " ".join(filters)

    async def get_dashboard_data(self, dashboard_query: DashboardQuery) -> Dict[str, Any]:
        """Get optimized dashboard data using materialized views"""
        try:
            if dashboard_query.dashboard_type == "overview":
                return await self._get_overview_dashboard(dashboard_query)
            elif dashboard_query.dashboard_type == "academic":
                return await self._get_academic_dashboard(dashboard_query)
            elif dashboard_query.dashboard_type == "usage":
                return await self._get_usage_dashboard(dashboard_query)
            else:
                raise HTTPException(status_code=400, detail="Invalid dashboard type")

        except Exception as e:
            logger.error(f"❌ Dashboard data retrieval failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'message_he': f'שגיאה בטעינת נתוני הדשבורד: {str(e)}',
                'message_en': f'Dashboard data retrieval failed: {str(e)}'
            }

    async def _get_overview_dashboard(self, query: DashboardQuery) -> Dict[str, Any]:
        """Get overview dashboard data"""
        tenant_metrics_sql = """
        SELECT * FROM tenant_metrics WHERE tenant_id = $1
        """

        real_time_sql = """
        SELECT
            COUNT(*) as total_events_today,
            COUNT(DISTINCT user_id) as active_users_today
        FROM analytics_events
        WHERE tenant_id = $1
        AND timestamp >= NOW() - INTERVAL '1 day'
        """

        try:
            async with self.async_db_engine.begin() as conn:
                # Get tenant metrics
                tenant_result = await conn.execute(text(tenant_metrics_sql), {'tenant_id': query.tenant_id})
                tenant_data = tenant_result.fetchone()

                # Get real-time metrics
                realtime_result = await conn.execute(text(real_time_sql), {'tenant_id': query.tenant_id})
                realtime_data = realtime_result.fetchone()

            # Get hourly usage from Redis
            current_hour = datetime.utcnow().strftime('%Y-%m-%d:%H')
            hourly_stats = await self.redis.hgetall(f"hourly_stats:{query.tenant_id}:{current_hour}")

            return {
                'success': True,
                'tenant_metrics': dict(tenant_data) if tenant_data else {},
                'realtime_metrics': dict(realtime_data) if realtime_data else {},
                'hourly_stats': {k.decode(): int(v.decode()) for k, v in hourly_stats.items()} if hourly_stats else {},
                'generated_at': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Overview dashboard error: {e}")
            raise

    async def _get_academic_dashboard(self, query: DashboardQuery) -> Dict[str, Any]:
        """Get academic performance dashboard data"""
        academic_sql = """
        SELECT
            data->>'course_id' as course_id,
            data->>'course_name' as course_name,
            COUNT(*) FILTER (WHERE event_type = 'course_accessed') as course_views,
            COUNT(*) FILTER (WHERE event_type = 'grade_viewed') as grade_views,
            COUNT(*) FILTER (WHERE event_type = 'assignment_viewed') as assignment_views,
            COUNT(DISTINCT user_id) as unique_users
        FROM analytics_events
        WHERE tenant_id = $1
        AND timestamp >= NOW() - INTERVAL '30 days'
        AND event_type IN ('course_accessed', 'grade_viewed', 'assignment_viewed')
        GROUP BY data->>'course_id', data->>'course_name'
        ORDER BY course_views DESC
        LIMIT 20
        """

        try:
            async with self.async_db_engine.begin() as conn:
                result = await conn.execute(text(academic_sql), {'tenant_id': query.tenant_id})
                rows = result.fetchall()

            academic_data = [dict(row) for row in rows]

            return {
                'success': True,
                'top_courses': academic_data,
                'total_courses': len(academic_data),
                'generated_at': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Academic dashboard error: {e}")
            raise

    async def _get_usage_dashboard(self, query: DashboardQuery) -> Dict[str, Any]:
        """Get usage patterns dashboard data"""
        usage_sql = """
        SELECT * FROM hourly_usage WHERE tenant_id = $1 ORDER BY hour_of_day
        """

        try:
            async with self.async_db_engine.begin() as conn:
                result = await conn.execute(text(usage_sql), {'tenant_id': query.tenant_id})
                rows = result.fetchall()

            usage_data = [dict(row) for row in rows]

            return {
                'success': True,
                'hourly_patterns': usage_data,
                'peak_hours': sorted(usage_data, key=lambda x: x['event_count'], reverse=True)[:3],
                'generated_at': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Usage dashboard error: {e}")
            raise

# Initialize service
service = AnalyticsService()

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
        'service': 'analytics-service',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat(),
        'features': ['event_sourcing', 'cqrs', 'materialized_views', 'real_time_metrics']
    }

@app.post("/events")
async def ingest_event(event: AnalyticsEvent):
    """Ingest analytics event"""
    return await service.ingest_event(event)

@app.post("/events/bulk")
async def ingest_bulk_events(events: List[AnalyticsEvent]):
    """Ingest multiple analytics events"""
    try:
        results = []
        for event in events:
            result = await service.ingest_event(event)
            results.append(result)

        successful = sum(1 for r in results if r['success'])
        total = len(results)

        return {
            'success': True,
            'total_processed': total,
            'successful': successful,
            'failed': total - successful,
            'results': results,
            'message_he': f'עובדו {successful} מתוך {total} אירועים',
            'message_en': f'Processed {successful} out of {total} events'
        }

    except Exception as e:
        logger.error(f"❌ Bulk event ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def execute_analytics_query(query_request: QueryRequest):
    """Execute analytics query"""
    try:
        # Validate tenant access
        if not await service.validate_tenant_access(query_request.tenant_id):
            raise HTTPException(status_code=403, detail="Tenant access denied")

        return await service.execute_query(query_request)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Analytics query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard/{dashboard_type}")
async def get_dashboard(
    dashboard_type: str,
    tenant_id: str = Query(...),
    user_id: Optional[str] = Query(None),
    time_range: str = Query("7d")
):
    """Get dashboard data"""
    try:
        # Validate tenant access
        if not await service.validate_tenant_access(tenant_id, user_id):
            raise HTTPException(status_code=403, detail="Tenant access denied")

        query = DashboardQuery(
            tenant_id=tenant_id,
            user_id=user_id,
            dashboard_type=dashboard_type,
            time_range=time_range
        )

        return await service.get_dashboard_data(query)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Dashboard request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tenant/{tenant_id}/metrics")
async def get_tenant_metrics(tenant_id: str):
    """Get tenant-specific metrics"""
    try:
        if not await service.validate_tenant_access(tenant_id):
            raise HTTPException(status_code=403, detail="Tenant access denied")

        # Get metrics from materialized view
        metrics_sql = """
        SELECT * FROM tenant_metrics WHERE tenant_id = $1
        """

        async with service.async_db_engine.begin() as conn:
            result = await conn.execute(text(metrics_sql), {'tenant_id': tenant_id})
            data = result.fetchone()

        if not data:
            return {
                'tenant_id': tenant_id,
                'total_users': 0,
                'active_users_today': 0,
                'message_he': 'אין נתונים זמינים עבור הדייר',
                'message_en': 'No data available for this tenant'
            }

        return dict(data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Tenant metrics request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/{user_id}/metrics")
async def get_user_metrics(user_id: str, tenant_id: str = Query(...)):
    """Get user-specific metrics"""
    try:
        if not await service.validate_tenant_access(tenant_id, user_id):
            raise HTTPException(status_code=403, detail="Tenant access denied")

        # Get metrics from materialized view
        metrics_sql = """
        SELECT * FROM user_metrics WHERE tenant_id = $1 AND user_id = $2
        """

        async with service.async_db_engine.begin() as conn:
            result = await conn.execute(text(metrics_sql), {
                'tenant_id': tenant_id,
                'user_id': user_id
            })
            data = result.fetchone()

        if not data:
            return {
                'user_id': user_id,
                'tenant_id': tenant_id,
                'total_logins': 0,
                'total_syncs': 0,
                'message_he': 'אין נתונים זמינים עבור המשתמש',
                'message_en': 'No data available for this user'
            }

        return dict(data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ User metrics request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/materialized-views/refresh")
async def refresh_materialized_views(tenant_id: str = Query(...)):
    """Manually refresh materialized views"""
    try:
        if not await service.validate_tenant_access(tenant_id):
            raise HTTPException(status_code=403, detail="Tenant access denied")

        # Refresh all materialized views
        for view_name in service.materialized_views.keys():
            await service._refresh_materialized_view(view_name)

        return {
            'success': True,
            'refreshed_views': list(service.materialized_views.keys()),
            'message_he': 'הצגים המקושרים רועננו בהצלחה',
            'message_en': 'Materialized views refreshed successfully'
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Materialized view refresh failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8004,
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