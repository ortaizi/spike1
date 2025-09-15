#!/usr/bin/env python3
"""
Notification Service - Phase 2 Microservice
שירות התראות - מיקרושירות שלב 2

This service handles:
- Email notifications (academic content)
- Push notifications (mobile/web)
- SMS alerts (urgent notifications)
- Event-driven notification triggers
- Hebrew/RTL notification templates
- Multi-tenant notification preferences
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
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, ValidationError
import aioredis
import httpx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import aiofiles
from jinja2 import Environment, FileSystemLoader
import pika
import asyncio_mqtt
from twilio.rest import Client as TwilioClient

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
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost/notification_service')
RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://localhost:5672')
AUTH_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://localhost:8001')

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
FROM_EMAIL = os.getenv('FROM_EMAIL', 'no-reply@spike-platform.com')

# SMS configuration (Twilio)
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')

# Push notification configuration
FIREBASE_SERVER_KEY = os.getenv('FIREBASE_SERVER_KEY', '')
APPLE_PUSH_CERT_PATH = os.getenv('APPLE_PUSH_CERT_PATH', '')

# Initialize FastAPI app
app = FastAPI(
    title="Notification Service",
    description="Multi-tenant notification service with email, push, and SMS support",
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
class NotificationType(str, Enum):
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"

class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class NotificationTemplate(str, Enum):
    GRADE_UPDATE = "grade_update"
    ASSIGNMENT_DUE = "assignment_due"
    COURSE_UPDATE = "course_update"
    SYNC_COMPLETED = "sync_completed"
    SYNC_FAILED = "sync_failed"
    SYSTEM_ALERT = "system_alert"

# Pydantic models
class NotificationRecipient(BaseModel):
    user_id: str
    tenant_id: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    push_token: Optional[str] = None
    preferred_language: str = "he"  # Default to Hebrew

class NotificationContent(BaseModel):
    template: NotificationTemplate
    subject_he: str
    subject_en: str
    body_he: str
    body_en: str
    data: Optional[Dict[str, Any]] = {}

class NotificationRequest(BaseModel):
    type: NotificationType
    priority: NotificationPriority
    recipient: NotificationRecipient
    content: NotificationContent
    scheduled_at: Optional[datetime] = None
    tenant_id: str

class BulkNotificationRequest(BaseModel):
    type: NotificationType
    priority: NotificationPriority
    recipients: List[NotificationRecipient]
    content: NotificationContent
    tenant_id: str

class EventNotification(BaseModel):
    event_type: str
    tenant_id: str
    user_id: str
    data: Dict[str, Any]
    timestamp: datetime

@dataclass
class NotificationResult:
    success: bool
    notification_id: str
    message_he: str
    message_en: str
    sent_at: datetime
    error_details: Optional[str] = None

class NotificationService:
    """שירות התראות עם תמיכה רב-ערוצית"""

    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self.http_client: Optional[httpx.AsyncClient] = None
        self.templates_env: Optional[Environment] = None
        self.twilio_client: Optional[TwilioClient] = None

    async def startup(self):
        """Initialize service connections"""
        try:
            # Initialize Redis for caching and queuing
            self.redis = await aioredis.from_url(REDIS_URL)

            # Initialize HTTP client for external API calls
            self.http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0),
                headers={
                    'User-Agent': 'Spike-NotificationService/1.0',
                    'Accept-Language': 'he-IL,he,en-US,en'
                }
            )

            # Initialize Jinja2 templates for Hebrew/RTL support
            self.templates_env = Environment(
                loader=FileSystemLoader('src/templates'),
                autoescape=True,
                trim_blocks=True,
                lstrip_blocks=True
            )

            # Initialize Twilio client for SMS
            if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
                self.twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

            logger.info("📨 Notification Service initialized successfully")

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

            logger.info("🧹 Notification Service shutdown completed")

        except Exception as e:
            logger.warning(f"⚠️ Error during shutdown: {e}")

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

    async def get_user_preferences(self, user_id: str, tenant_id: str) -> Dict[str, Any]:
        """Get user notification preferences"""
        try:
            prefs_key = f"user_prefs:{tenant_id}:{user_id}"
            cached_prefs = await self.redis.get(prefs_key)

            if cached_prefs:
                return json.loads(cached_prefs)

            # Default preferences
            default_prefs = {
                'email_enabled': True,
                'push_enabled': True,
                'sms_enabled': False,
                'language': 'he',
                'email_frequency': 'immediate',  # immediate, daily, weekly
                'quiet_hours': {'start': '22:00', 'end': '07:00'},
                'notification_types': {
                    'grades': True,
                    'assignments': True,
                    'course_updates': True,
                    'system_alerts': True
                }
            }

            # Cache for 1 hour
            await self.redis.setex(prefs_key, 3600, json.dumps(default_prefs))
            return default_prefs

        except Exception as e:
            logger.error(f"❌ Failed to get user preferences: {e}")
            return {'email_enabled': True, 'language': 'he'}

    async def should_send_notification(self, recipient: NotificationRecipient, content: NotificationContent) -> bool:
        """Check if notification should be sent based on user preferences and quiet hours"""
        try:
            preferences = await self.get_user_preferences(recipient.user_id, recipient.tenant_id)

            # Check if notification type is enabled
            notification_type = content.template.value
            if not preferences.get('notification_types', {}).get(notification_type, True):
                return False

            # Check quiet hours for non-urgent notifications
            current_time = datetime.now().time()
            quiet_hours = preferences.get('quiet_hours', {})

            if quiet_hours and content.template != NotificationTemplate.SYSTEM_ALERT:
                start_time = datetime.strptime(quiet_hours['start'], '%H:%M').time()
                end_time = datetime.strptime(quiet_hours['end'], '%H:%M').time()

                if start_time <= current_time or current_time <= end_time:
                    logger.info(f"🔇 Notification skipped due to quiet hours for user {recipient.user_id}")
                    return False

            return True

        except Exception as e:
            logger.error(f"❌ Failed to check notification rules: {e}")
            return True  # Default to sending if check fails

    async def send_email_notification(self, recipient: NotificationRecipient, content: NotificationContent, priority: NotificationPriority) -> NotificationResult:
        """Send email notification with Hebrew support"""
        try:
            if not recipient.email:
                return NotificationResult(
                    success=False,
                    notification_id="",
                    message_he="כתובת אימייל לא צוינה",
                    message_en="Email address not provided",
                    sent_at=datetime.utcnow(),
                    error_details="No email address"
                )

            # Choose language based on recipient preference
            language = recipient.preferred_language
            subject = content.subject_he if language == 'he' else content.subject_en
            body = content.body_he if language == 'he' else content.body_en

            # Create HTML email with RTL support
            html_template = await self._get_email_template(content.template, language)
            html_body = html_template.render(
                subject=subject,
                body=body,
                data=content.data,
                tenant_id=recipient.tenant_id,
                is_rtl=(language == 'he')
            )

            # Create email message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = FROM_EMAIL
            msg['To'] = recipient.email

            # Add text and HTML parts
            text_part = MIMEText(body, 'plain', 'utf-8')
            html_part = MIMEText(html_body, 'html', 'utf-8')

            msg.attach(text_part)
            msg.attach(html_part)

            # Send email
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)

            notification_id = f"email_{recipient.user_id}_{int(datetime.utcnow().timestamp())}"

            # Log to analytics
            await self._log_notification_sent(notification_id, "email", recipient, content, True)

            logger.info(f"📧 Email sent successfully to {recipient.email}")

            return NotificationResult(
                success=True,
                notification_id=notification_id,
                message_he="אימייל נשלח בהצלחה",
                message_en="Email sent successfully",
                sent_at=datetime.utcnow()
            )

        except Exception as e:
            logger.error(f"❌ Email sending failed: {e}")

            notification_id = f"email_failed_{recipient.user_id}_{int(datetime.utcnow().timestamp())}"
            await self._log_notification_sent(notification_id, "email", recipient, content, False, str(e))

            return NotificationResult(
                success=False,
                notification_id=notification_id,
                message_he=f"שליחת אימייל נכשלה: {str(e)}",
                message_en=f"Email sending failed: {str(e)}",
                sent_at=datetime.utcnow(),
                error_details=str(e)
            )

    async def send_push_notification(self, recipient: NotificationRecipient, content: NotificationContent, priority: NotificationPriority) -> NotificationResult:
        """Send push notification via Firebase/Apple Push"""
        try:
            if not recipient.push_token:
                return NotificationResult(
                    success=False,
                    notification_id="",
                    message_he="אסימון push לא צוין",
                    message_en="Push token not provided",
                    sent_at=datetime.utcnow(),
                    error_details="No push token"
                )

            # Choose language
            language = recipient.preferred_language
            title = content.subject_he if language == 'he' else content.subject_en
            body = content.body_he if language == 'he' else content.body_en

            # Create Firebase payload
            payload = {
                'to': recipient.push_token,
                'notification': {
                    'title': title,
                    'body': body,
                    'icon': '/images/icon-192x192.png',
                    'badge': '/images/badge.png'
                },
                'data': {
                    'template': content.template.value,
                    'tenant_id': recipient.tenant_id,
                    'user_id': recipient.user_id,
                    **content.data
                },
                'priority': 'high' if priority == NotificationPriority.URGENT else 'normal'
            }

            # Send via Firebase
            headers = {
                'Authorization': f'key={FIREBASE_SERVER_KEY}',
                'Content-Type': 'application/json'
            }

            async with self.http_client as client:
                response = await client.post(
                    'https://fcm.googleapis.com/fcm/send',
                    json=payload,
                    headers=headers
                )

                if response.status_code == 200:
                    notification_id = f"push_{recipient.user_id}_{int(datetime.utcnow().timestamp())}"
                    await self._log_notification_sent(notification_id, "push", recipient, content, True)

                    logger.info(f"🔔 Push notification sent successfully to {recipient.user_id}")

                    return NotificationResult(
                        success=True,
                        notification_id=notification_id,
                        message_he="התראת push נשלחה בהצלחה",
                        message_en="Push notification sent successfully",
                        sent_at=datetime.utcnow()
                    )
                else:
                    error_details = f"Firebase error: {response.status_code} - {response.text}"
                    raise Exception(error_details)

        except Exception as e:
            logger.error(f"❌ Push notification failed: {e}")

            notification_id = f"push_failed_{recipient.user_id}_{int(datetime.utcnow().timestamp())}"
            await self._log_notification_sent(notification_id, "push", recipient, content, False, str(e))

            return NotificationResult(
                success=False,
                notification_id=notification_id,
                message_he=f"שליחת התראת push נכשלה: {str(e)}",
                message_en=f"Push notification failed: {str(e)}",
                sent_at=datetime.utcnow(),
                error_details=str(e)
            )

    async def send_sms_notification(self, recipient: NotificationRecipient, content: NotificationContent, priority: NotificationPriority) -> NotificationResult:
        """Send SMS notification via Twilio"""
        try:
            if not recipient.phone or not self.twilio_client:
                return NotificationResult(
                    success=False,
                    notification_id="",
                    message_he="מספר טלפון לא צוין או שירות SMS לא זמין",
                    message_en="Phone number not provided or SMS service unavailable",
                    sent_at=datetime.utcnow(),
                    error_details="No phone or SMS service unavailable"
                )

            # Choose language
            language = recipient.preferred_language
            message = content.body_he if language == 'he' else content.body_en

            # Keep SMS short (160 characters limit)
            if len(message) > 160:
                message = message[:157] + "..."

            # Send SMS
            message_obj = self.twilio_client.messages.create(
                body=message,
                from_=TWILIO_PHONE_NUMBER,
                to=recipient.phone
            )

            notification_id = f"sms_{recipient.user_id}_{int(datetime.utcnow().timestamp())}"
            await self._log_notification_sent(notification_id, "sms", recipient, content, True)

            logger.info(f"📱 SMS sent successfully to {recipient.phone}")

            return NotificationResult(
                success=True,
                notification_id=notification_id,
                message_he="SMS נשלח בהצלחה",
                message_en="SMS sent successfully",
                sent_at=datetime.utcnow()
            )

        except Exception as e:
            logger.error(f"❌ SMS sending failed: {e}")

            notification_id = f"sms_failed_{recipient.user_id}_{int(datetime.utcnow().timestamp())}"
            await self._log_notification_sent(notification_id, "sms", recipient, content, False, str(e))

            return NotificationResult(
                success=False,
                notification_id=notification_id,
                message_he=f"שליחת SMS נכשלה: {str(e)}",
                message_en=f"SMS sending failed: {str(e)}",
                sent_at=datetime.utcnow(),
                error_details=str(e)
            )

    async def _get_email_template(self, template: NotificationTemplate, language: str) -> str:
        """Get email template with Hebrew/RTL support"""
        try:
            template_name = f"{template.value}_{language}.html"
            return self.templates_env.get_template(template_name)

        except Exception as e:
            logger.warning(f"⚠️ Template not found: {template_name}, using default")
            # Return basic template
            return self.templates_env.from_string("""
<!DOCTYPE html>
<html dir="{{ 'rtl' if is_rtl else 'ltr' }}" lang="{{ 'he' if is_rtl else 'en' }}">
<head>
    <meta charset="utf-8">
    <title>{{ subject }}</title>
    <style>
        body { font-family: {{ 'Arial, sans-serif' if is_rtl else 'Arial, sans-serif' }}; margin: 20px; }
        .content { max-width: 600px; margin: 0 auto; }
        .rtl { text-align: right; }
    </style>
</head>
<body class="{{ 'rtl' if is_rtl else '' }}">
    <div class="content">
        <h1>{{ subject }}</h1>
        <p>{{ body }}</p>
        {% if data %}
            <hr>
            <small>{{ data }}</small>
        {% endif %}
    </div>
</body>
</html>
            """)

    async def _log_notification_sent(self, notification_id: str, channel: str, recipient: NotificationRecipient, content: NotificationContent, success: bool, error: str = None):
        """Log notification for analytics"""
        try:
            log_entry = {
                'notification_id': notification_id,
                'channel': channel,
                'tenant_id': recipient.tenant_id,
                'user_id': recipient.user_id,
                'template': content.template.value,
                'success': success,
                'error': error,
                'sent_at': datetime.utcnow().isoformat()
            }

            # Store in Redis for analytics service
            await self.redis.lpush(
                f"notification_logs:{recipient.tenant_id}",
                json.dumps(log_entry)
            )

            # Keep only last 1000 entries per tenant
            await self.redis.ltrim(f"notification_logs:{recipient.tenant_id}", 0, 999)

        except Exception as e:
            logger.error(f"❌ Failed to log notification: {e}")

# Initialize service
service = NotificationService()

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
        'service': 'notification-service',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat(),
        'channels': ['email', 'push', 'sms']
    }

@app.post("/send")
async def send_notification(request: NotificationRequest):
    """Send single notification"""
    try:
        # Validate tenant access
        if not await service.validate_tenant_access(request.tenant_id, request.recipient.user_id):
            raise HTTPException(status_code=403, detail="Tenant access denied")

        # Check if notification should be sent
        should_send = await service.should_send_notification(request.recipient, request.content)
        if not should_send:
            return {
                'success': False,
                'message_he': 'ההתראה לא נשלחה עקב העדפות המשתמש',
                'message_en': 'Notification not sent due to user preferences'
            }

        # Send notification based on type
        if request.type == NotificationType.EMAIL:
            result = await service.send_email_notification(request.recipient, request.content, request.priority)
        elif request.type == NotificationType.PUSH:
            result = await service.send_push_notification(request.recipient, request.content, request.priority)
        elif request.type == NotificationType.SMS:
            result = await service.send_sms_notification(request.recipient, request.content, request.priority)
        else:
            raise HTTPException(status_code=400, detail="Invalid notification type")

        return {
            'success': result.success,
            'notification_id': result.notification_id,
            'message_he': result.message_he,
            'message_en': result.message_en,
            'sent_at': result.sent_at.isoformat(),
            'error_details': result.error_details
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to send notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/send-bulk")
async def send_bulk_notifications(request: BulkNotificationRequest):
    """Send bulk notifications"""
    try:
        results = []

        for recipient in request.recipients:
            # Validate tenant access
            if not await service.validate_tenant_access(request.tenant_id, recipient.user_id):
                results.append({
                    'user_id': recipient.user_id,
                    'success': False,
                    'error': 'Tenant access denied'
                })
                continue

            # Check if notification should be sent
            should_send = await service.should_send_notification(recipient, request.content)
            if not should_send:
                results.append({
                    'user_id': recipient.user_id,
                    'success': False,
                    'error': 'Not sent due to user preferences'
                })
                continue

            # Send notification
            try:
                if request.type == NotificationType.EMAIL:
                    result = await service.send_email_notification(recipient, request.content, request.priority)
                elif request.type == NotificationType.PUSH:
                    result = await service.send_push_notification(recipient, request.content, request.priority)
                elif request.type == NotificationType.SMS:
                    result = await service.send_sms_notification(recipient, request.content, request.priority)
                else:
                    continue

                results.append({
                    'user_id': recipient.user_id,
                    'success': result.success,
                    'notification_id': result.notification_id,
                    'error': result.error_details
                })

            except Exception as e:
                results.append({
                    'user_id': recipient.user_id,
                    'success': False,
                    'error': str(e)
                })

        successful = sum(1 for r in results if r['success'])
        total = len(results)

        return {
            'total_sent': successful,
            'total_failed': total - successful,
            'results': results,
            'message_he': f'נשלחו {successful} מתוך {total} התראות',
            'message_en': f'Sent {successful} out of {total} notifications'
        }

    except Exception as e:
        logger.error(f"❌ Bulk notification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/events")
async def handle_event(event: EventNotification):
    """Handle incoming events and trigger notifications"""
    try:
        # Convert event to appropriate notification
        notification_request = await service.event_to_notification(event)

        if notification_request:
            # Send the notification
            return await send_notification(notification_request)
        else:
            return {
                'success': True,
                'message_he': 'האירוע לא דורש התראה',
                'message_en': 'Event does not require notification'
            }

    except Exception as e:
        logger.error(f"❌ Event handling failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/{user_id}/preferences")
async def get_user_notification_preferences(user_id: str, tenant_id: str):
    """Get user notification preferences"""
    try:
        preferences = await service.get_user_preferences(user_id, tenant_id)
        return {
            'user_id': user_id,
            'tenant_id': tenant_id,
            'preferences': preferences
        }

    except Exception as e:
        logger.error(f"❌ Failed to get user preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/user/{user_id}/preferences")
async def update_user_notification_preferences(user_id: str, tenant_id: str, preferences: Dict[str, Any]):
    """Update user notification preferences"""
    try:
        prefs_key = f"user_prefs:{tenant_id}:{user_id}"
        await service.redis.setex(prefs_key, 86400, json.dumps(preferences))  # Cache for 24 hours

        return {
            'success': True,
            'message_he': 'העדפות התראות עודכנו',
            'message_en': 'Notification preferences updated',
            'preferences': preferences
        }

    except Exception as e:
        logger.error(f"❌ Failed to update user preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tenant/{tenant_id}/stats")
async def get_notification_stats(tenant_id: str):
    """Get notification statistics for tenant"""
    try:
        # Get recent notification logs
        logs = await service.redis.lrange(f"notification_logs:{tenant_id}", 0, 99)

        total_sent = 0
        total_failed = 0
        channel_stats = {'email': 0, 'push': 0, 'sms': 0}
        template_stats = {}

        for log_entry in logs:
            try:
                entry = json.loads(log_entry)
                if entry['success']:
                    total_sent += 1
                    channel_stats[entry['channel']] += 1
                else:
                    total_failed += 1

                template = entry.get('template', 'unknown')
                template_stats[template] = template_stats.get(template, 0) + 1

            except:
                continue

        return {
            'tenant_id': tenant_id,
            'total_sent': total_sent,
            'total_failed': total_failed,
            'success_rate': total_sent / (total_sent + total_failed) * 100 if (total_sent + total_failed) > 0 else 0,
            'channel_stats': channel_stats,
            'template_stats': template_stats
        }

    except Exception as e:
        logger.error(f"❌ Failed to get notification stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8003,
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