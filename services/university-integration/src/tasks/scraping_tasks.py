#!/usr/bin/env python3
"""
Celery Tasks for University Integration Service
משימות Celery לשירות אינטגרציה עם אוניברסיטאות

This module contains all background tasks for:
- User data synchronization
- Credential validation
- Bulk operations
- Rate-limited scraping
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from celery import Celery
from celery.exceptions import Retry
import aioredis
import httpx
from playwright.async_api import async_playwright

# Import existing scraper components
import sys
sys.path.append('/Users/ortaizi/Desktop/spike1-1/apps/scraper/src')

try:
    from auth.smart_validator import SmartMoodleValidator, ValidationResult
    from config.bgu_config_updated import BGUConfig, authenticate_bgu_with_fallback
except ImportError:
    # Fallback imports for development
    class SmartMoodleValidator:
        pass
    class ValidationResult:
        pass

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://localhost:5672')
NOTIFICATION_SERVICE_URL = os.getenv('NOTIFICATION_SERVICE_URL', 'http://localhost:8003')
ANALYTICS_SERVICE_URL = os.getenv('ANALYTICS_SERVICE_URL', 'http://localhost:8004')

# Initialize Celery
celery = Celery(
    'university_integration_tasks',
    broker=RABBITMQ_URL,
    backend=REDIS_URL
)

# Configure Celery
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
    },
    task_annotations={
        'src.tasks.scraping_tasks.sync_user_data': {'rate_limit': '30/m'},
        'src.tasks.scraping_tasks.validate_credentials': {'rate_limit': '60/m'},
    }
)

class UniversityScraper:
    """בסיס מחלקה לסקרפר אוניברסיטה"""

    def __init__(self, university_id: str, tenant_id: str):
        self.university_id = university_id
        self.tenant_id = tenant_id
        self.redis = None
        self.http_client = None

    async def setup(self):
        """Initialize connections"""
        self.redis = await aioredis.from_url(REDIS_URL)
        self.http_client = httpx.AsyncClient(timeout=httpx.Timeout(30.0))

    async def cleanup(self):
        """Cleanup connections"""
        if self.redis:
            await self.redis.close()
        if self.http_client:
            await self.http_client.aclose()

    async def validate_credentials(self, username: str, password: str) -> ValidationResult:
        """Override in subclass"""
        raise NotImplementedError

    async def extract_user_data(self, username: str, password: str) -> Dict[str, Any]:
        """Override in subclass"""
        raise NotImplementedError

    async def update_progress(self, job_id: str, progress: int, message_he: str, message_en: str):
        """Update job progress in Redis"""
        try:
            progress_data = {
                'job_id': job_id,
                'progress': progress,
                'message_he': message_he,
                'message_en': message_en,
                'updated_at': datetime.utcnow().isoformat()
            }

            await self.redis.setex(
                f"job_progress:{job_id}",
                3600,  # 1 hour expiry
                str(progress_data)
            )

            logger.info(f"📊 Progress updated: {job_id} - {progress}% - {message_en}")

        except Exception as e:
            logger.error(f"❌ Failed to update progress: {e}")

    async def send_notification_event(self, event_type: str, data: Dict[str, Any]):
        """Send event to notification service"""
        try:
            await self.http_client.post(
                f"{NOTIFICATION_SERVICE_URL}/events",
                json={
                    'event_type': event_type,
                    'tenant_id': self.tenant_id,
                    'data': data,
                    'timestamp': datetime.utcnow().isoformat()
                }
            )

            logger.info(f"📤 Event sent: {event_type}")

        except Exception as e:
            logger.error(f"❌ Failed to send notification event: {e}")

    async def send_analytics_event(self, event_type: str, data: Dict[str, Any]):
        """Send event to analytics service"""
        try:
            await self.http_client.post(
                f"{ANALYTICS_SERVICE_URL}/events",
                json={
                    'event_type': event_type,
                    'tenant_id': self.tenant_id,
                    'data': data,
                    'timestamp': datetime.utcnow().isoformat()
                }
            )

            logger.info(f"📈 Analytics event sent: {event_type}")

        except Exception as e:
            logger.error(f"❌ Failed to send analytics event: {e}")

class BGUScraper(UniversityScraper):
    """סקרפר לאוניברסיטת בן גוריון"""

    async def validate_credentials(self, username: str, password: str) -> ValidationResult:
        """Validate BGU credentials using existing smart validator"""
        try:
            async with SmartMoodleValidator('bgu', headless=True) as validator:
                result = await validator.validate_credentials(username, password)
                logger.info(f"🔐 BGU credential validation: {result.success}")
                return result

        except Exception as e:
            logger.error(f"❌ BGU credential validation failed: {e}")
            # Return generic failure result
            return ValidationResult(
                success=False,
                result="validation_error",
                message_he=f"שגיאה באימות: {str(e)}",
                message_en=f"Validation error: {str(e)}",
                university="bgu",
                username=username,
                response_time_ms=0,
                error_details=str(e)
            )

    async def extract_user_data(self, username: str, password: str) -> Dict[str, Any]:
        """Extract user data from BGU Moodle"""
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--lang=he-IL',
                        '--accept-lang=he-IL,he,en-US,en'
                    ]
                )

                context = await browser.new_context(
                    locale='he-IL',
                    timezone_id='Asia/Jerusalem',
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )

                page = await context.new_page()

                try:
                    # Login using existing BGU authenticator
                    result = await authenticate_bgu_with_fallback(username, password, fast_mode=True)

                    if not result.get('success'):
                        return {
                            'success': False,
                            'error': result.get('error', 'Authentication failed'),
                            'message_he': result.get('message_he', 'התחברות נכשלה'),
                            'message_en': result.get('message_en', 'Authentication failed')
                        }

                    # Navigate to dashboard
                    dashboard_url = 'https://moodle.bgu.ac.il/moodle/my/'
                    await page.goto(dashboard_url, wait_until='networkidle')

                    # Extract courses
                    courses = await self._extract_courses(page)

                    # Extract grades
                    grades = await self._extract_grades(page)

                    # Extract assignments
                    assignments = await self._extract_assignments(page)

                    return {
                        'success': True,
                        'courses': courses,
                        'grades': grades,
                        'assignments': assignments,
                        'extracted_at': datetime.utcnow().isoformat(),
                        'university': 'bgu'
                    }

                finally:
                    await browser.close()

        except Exception as e:
            logger.error(f"❌ BGU data extraction failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'message_he': f'שגיאה בחילוץ נתונים: {str(e)}',
                'message_en': f'Data extraction error: {str(e)}'
            }

    async def _extract_courses(self, page) -> List[Dict[str, Any]]:
        """Extract course information"""
        try:
            courses = []

            # Wait for course elements to load
            await page.wait_for_selector('.course-info-container', timeout=10000)

            # Extract course elements
            course_elements = await page.query_selector_all('.course-info-container, .coursebox')

            for element in course_elements:
                try:
                    # Extract course name
                    name_element = await element.query_selector('a[href*="course/view.php"], .coursename a')
                    name = await name_element.text_content() if name_element else "Unknown Course"

                    # Extract course URL
                    url_element = await element.query_selector('a[href*="course/view.php"]')
                    url = await url_element.get_attribute('href') if url_element else None

                    # Extract course ID from URL
                    course_id = None
                    if url and 'id=' in url:
                        course_id = url.split('id=')[1].split('&')[0]

                    course_data = {
                        'id': course_id,
                        'name': name.strip(),
                        'url': url,
                        'university': 'bgu',
                        'extracted_at': datetime.utcnow().isoformat()
                    }

                    courses.append(course_data)

                except Exception as e:
                    logger.warning(f"⚠️ Failed to extract course info: {e}")
                    continue

            logger.info(f"📚 Extracted {len(courses)} courses from BGU")
            return courses

        except Exception as e:
            logger.error(f"❌ Course extraction failed: {e}")
            return []

    async def _extract_grades(self, page) -> List[Dict[str, Any]]:
        """Extract grade information"""
        try:
            grades = []

            # Navigate to grades page
            try:
                grades_link = await page.query_selector('a[href*="grade/report"]')
                if grades_link:
                    await grades_link.click()
                    await page.wait_for_load_state('networkidle')
            except:
                logger.info("ℹ️ No grades page found")

            # Extract grade elements
            grade_elements = await page.query_selector_all('.gradeitemheader, .grade-item')

            for element in grade_elements:
                try:
                    # Extract grade information
                    # This would need to be customized based on BGU's grade table structure
                    grade_data = {
                        'course_id': 'extracted_course_id',
                        'assignment': 'extracted_assignment_name',
                        'grade': 'extracted_grade',
                        'max_grade': 'extracted_max_grade',
                        'extracted_at': datetime.utcnow().isoformat()
                    }

                    grades.append(grade_data)

                except Exception as e:
                    logger.warning(f"⚠️ Failed to extract grade info: {e}")
                    continue

            logger.info(f"📊 Extracted {len(grades)} grades from BGU")
            return grades

        except Exception as e:
            logger.error(f"❌ Grade extraction failed: {e}")
            return []

    async def _extract_assignments(self, page) -> List[Dict[str, Any]]:
        """Extract assignment information"""
        try:
            assignments = []

            # Extract assignment elements from various course pages
            assignment_elements = await page.query_selector_all('.activity[data-type="assign"], .assignment')

            for element in assignment_elements:
                try:
                    assignment_data = {
                        'course_id': 'extracted_course_id',
                        'title': 'extracted_assignment_title',
                        'due_date': 'extracted_due_date',
                        'status': 'extracted_status',
                        'extracted_at': datetime.utcnow().isoformat()
                    }

                    assignments.append(assignment_data)

                except Exception as e:
                    logger.warning(f"⚠️ Failed to extract assignment info: {e}")
                    continue

            logger.info(f"📝 Extracted {len(assignments)} assignments from BGU")
            return assignments

        except Exception as e:
            logger.error(f"❌ Assignment extraction failed: {e}")
            return []

class TAUScraper(UniversityScraper):
    """סקרפר לאוניברסיטת תל אביב"""

    async def validate_credentials(self, username: str, password: str) -> ValidationResult:
        """Validate TAU credentials"""
        # TODO: Implement TAU-specific validation
        return ValidationResult(
            success=False,
            result="not_implemented",
            message_he="אימות תל אביב עדיין לא מוטמע",
            message_en="TAU validation not yet implemented",
            university="tau",
            username=username,
            response_time_ms=0
        )

    async def extract_user_data(self, username: str, password: str) -> Dict[str, Any]:
        """Extract user data from TAU"""
        # TODO: Implement TAU-specific data extraction
        return {
            'success': False,
            'error': 'not_implemented',
            'message_he': 'חילוץ נתונים מתל אביב עדיין לא מוטמע',
            'message_en': 'TAU data extraction not yet implemented'
        }

class HUJIScraper(UniversityScraper):
    """סקרפר לאוניברסיטה העברית"""

    async def validate_credentials(self, username: str, password: str) -> ValidationResult:
        """Validate HUJI credentials"""
        # TODO: Implement HUJI-specific validation
        return ValidationResult(
            success=False,
            result="not_implemented",
            message_he="אימות האוניברסיטה העברית עדיין לא מוטמע",
            message_en="HUJI validation not yet implemented",
            university="huji",
            username=username,
            response_time_ms=0
        )

    async def extract_user_data(self, username: str, password: str) -> Dict[str, Any]:
        """Extract user data from HUJI"""
        # TODO: Implement HUJI-specific data extraction
        return {
            'success': False,
            'error': 'not_implemented',
            'message_he': 'חילוץ נתונים מהאוניברסיטה העברית עדיין לא מוטמע',
            'message_en': 'HUJI data extraction not yet implemented'
        }

# Factory function to create scrapers
def create_scraper(university_id: str, tenant_id: str) -> UniversityScraper:
    """Create appropriate scraper instance"""
    scrapers = {
        'bgu': BGUScraper,
        'tau': TAUScraper,
        'huji': HUJIScraper
    }

    scraper_class = scrapers.get(university_id)
    if not scraper_class:
        raise ValueError(f"Unsupported university: {university_id}")

    return scraper_class(university_id, tenant_id)

# Celery Tasks
@celery.task(bind=True, max_retries=3)
def validate_credentials(self, credentials: Dict[str, Any], validation_type: str = "quick"):
    """Validate university credentials"""
    try:
        university_id = credentials['university_id']
        tenant_id = credentials['tenant_id']
        username = credentials['username']
        password = credentials['password']

        logger.info(f"🔐 Validating credentials for {university_id}:{username}")

        # Create scraper instance
        scraper = create_scraper(university_id, tenant_id)

        # Run async validation
        async def validate_async():
            await scraper.setup()
            try:
                result = await scraper.validate_credentials(username, password)
                return {
                    'success': result.success,
                    'result': result.result.value if hasattr(result.result, 'value') else str(result.result),
                    'message_he': result.message_he,
                    'message_en': result.message_en,
                    'response_time_ms': result.response_time_ms,
                    'session_data': result.session_data,
                    'error_details': result.error_details
                }
            finally:
                await scraper.cleanup()

        result = asyncio.run(validate_async())

        logger.info(f"✅ Credential validation completed: {result['success']}")
        return result

    except Exception as e:
        logger.error(f"❌ Credential validation task failed: {e}")

        # Retry on specific errors
        if self.request.retries < self.max_retries:
            if any(error_type in str(e).lower() for error_type in ['timeout', 'network', 'connection']):
                retry_delay = 60 * (self.request.retries + 1)  # Exponential backoff
                logger.info(f"🔄 Retrying in {retry_delay} seconds...")
                raise self.retry(countdown=retry_delay)

        return {
            'success': False,
            'result': 'task_error',
            'message_he': f'שגיאה במשימת האימות: {str(e)}',
            'message_en': f'Validation task error: {str(e)}',
            'error_details': str(e)
        }

@celery.task(bind=True, max_retries=3)
def sync_user_data(self, job_id: str, user_id: str, tenant_id: str, university_id: str, job_type: str = "full_sync"):
    """Synchronize user data from university"""
    try:
        logger.info(f"🔄 Starting sync job: {job_id} for {tenant_id}:{user_id}")

        # Create scraper instance
        scraper = create_scraper(university_id, tenant_id)

        # Run async synchronization
        async def sync_async():
            await scraper.setup()
            try:
                # Update progress - starting
                await scraper.update_progress(
                    job_id, 0,
                    "מתחיל סנכרון נתונים",
                    "Starting data synchronization"
                )

                # Get user credentials (would need to call Auth Service)
                # For now, using placeholder
                credentials_result = await get_user_credentials(user_id, tenant_id, university_id)

                if not credentials_result['success']:
                    return {
                        'success': False,
                        'error': 'credentials_not_found',
                        'message_he': 'לא נמצאו פרטי התחברות',
                        'message_en': 'Credentials not found'
                    }

                username = credentials_result['username']
                password = credentials_result['password']

                # Update progress - authenticating
                await scraper.update_progress(
                    job_id, 20,
                    "מתחבר למערכת האוניברסיטה",
                    "Authenticating with university system"
                )

                # Validate credentials first
                validation_result = await scraper.validate_credentials(username, password)

                if not validation_result.success:
                    await scraper.send_notification_event(
                        'sync.failed',
                        {
                            'job_id': job_id,
                            'user_id': user_id,
                            'reason': 'authentication_failed',
                            'message_he': validation_result.message_he,
                            'message_en': validation_result.message_en
                        }
                    )

                    return {
                        'success': False,
                        'error': 'authentication_failed',
                        'message_he': validation_result.message_he,
                        'message_en': validation_result.message_en
                    }

                # Update progress - extracting data
                await scraper.update_progress(
                    job_id, 50,
                    "מחלץ נתוני קורסים וציונים",
                    "Extracting courses and grades data"
                )

                # Extract user data
                data_result = await scraper.extract_user_data(username, password)

                if not data_result['success']:
                    return data_result

                # Update progress - processing data
                await scraper.update_progress(
                    job_id, 80,
                    "מעבד ושומר נתונים",
                    "Processing and storing data"
                )

                # Send data to Academic Service (would be implemented)
                academic_result = await send_data_to_academic_service(
                    tenant_id, user_id, data_result
                )

                # Update progress - completed
                await scraper.update_progress(
                    job_id, 100,
                    "סנכרון הושלם בהצלחה",
                    "Synchronization completed successfully"
                )

                # Send success notification
                await scraper.send_notification_event(
                    'sync.completed',
                    {
                        'job_id': job_id,
                        'user_id': user_id,
                        'courses_count': len(data_result.get('courses', [])),
                        'grades_count': len(data_result.get('grades', [])),
                        'assignments_count': len(data_result.get('assignments', []))
                    }
                )

                # Send analytics event
                await scraper.send_analytics_event(
                    'sync.completed',
                    {
                        'job_id': job_id,
                        'user_id': user_id,
                        'tenant_id': tenant_id,
                        'university_id': university_id,
                        'duration_seconds': 0,  # Would calculate actual duration
                        'data_extracted': {
                            'courses': len(data_result.get('courses', [])),
                            'grades': len(data_result.get('grades', [])),
                            'assignments': len(data_result.get('assignments', []))
                        }
                    }
                )

                return {
                    'success': True,
                    'message_he': 'סנכרון נתונים הושלם בהצלחה',
                    'message_en': 'Data synchronization completed successfully',
                    'data_summary': {
                        'courses': len(data_result.get('courses', [])),
                        'grades': len(data_result.get('grades', [])),
                        'assignments': len(data_result.get('assignments', []))
                    }
                }

            except Exception as e:
                logger.error(f"❌ Sync error: {e}")

                await scraper.send_notification_event(
                    'sync.failed',
                    {
                        'job_id': job_id,
                        'user_id': user_id,
                        'error': str(e),
                        'message_he': f'סנכרון נכשל: {str(e)}',
                        'message_en': f'Sync failed: {str(e)}'
                    }
                )

                raise e

            finally:
                await scraper.cleanup()

        result = asyncio.run(sync_async())

        logger.info(f"✅ Sync job completed: {job_id}")
        return result

    except Exception as e:
        logger.error(f"❌ Sync task failed: {e}")

        # Retry on specific errors
        if self.request.retries < self.max_retries:
            if any(error_type in str(e).lower() for error_type in ['timeout', 'network', 'connection']):
                retry_delay = 120 * (self.request.retries + 1)  # Longer backoff for sync
                logger.info(f"🔄 Retrying sync in {retry_delay} seconds...")
                raise self.retry(countdown=retry_delay)

        return {
            'success': False,
            'error': 'task_error',
            'message_he': f'שגיאה במשימת הסנכרון: {str(e)}',
            'message_en': f'Sync task error: {str(e)}',
            'error_details': str(e)
        }

@celery.task(bind=True)
def bulk_sync(self, tenant_id: str, university_id: str, user_ids: List[str]):
    """Bulk synchronization for multiple users"""
    try:
        logger.info(f"📦 Starting bulk sync for {len(user_ids)} users in {tenant_id}:{university_id}")

        results = []

        for user_id in user_ids:
            try:
                # Create individual sync job
                job_id = f"bulk_sync_{tenant_id}_{user_id}_{int(datetime.utcnow().timestamp())}"

                # Queue individual sync task
                task = celery.send_task(
                    'src.tasks.scraping_tasks.sync_user_data',
                    args=[job_id, user_id, tenant_id, university_id, "full_sync"]
                )

                results.append({
                    'user_id': user_id,
                    'job_id': job_id,
                    'task_id': task.id,
                    'status': 'queued'
                })

                # Add delay between jobs to respect rate limits
                import time
                time.sleep(2)

            except Exception as e:
                logger.error(f"❌ Failed to queue sync for user {user_id}: {e}")
                results.append({
                    'user_id': user_id,
                    'status': 'failed',
                    'error': str(e)
                })

        logger.info(f"✅ Bulk sync queued: {len(results)} jobs created")

        return {
            'success': True,
            'message_he': f'הוזמנו {len(results)} משימות סנכרון',
            'message_en': f'{len(results)} sync tasks queued',
            'jobs': results
        }

    except Exception as e:
        logger.error(f"❌ Bulk sync task failed: {e}")
        return {
            'success': False,
            'error': str(e),
            'message_he': f'שגיאה בסנכרון המוני: {str(e)}',
            'message_en': f'Bulk sync error: {str(e)}'
        }

# Helper functions (would be implemented to call other services)
async def get_user_credentials(user_id: str, tenant_id: str, university_id: str) -> Dict[str, Any]:
    """Get user credentials from Auth Service"""
    # TODO: Implement call to Auth Service
    return {
        'success': True,
        'username': 'placeholder_user',
        'password': 'placeholder_pass'
    }

async def send_data_to_academic_service(tenant_id: str, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Send extracted data to Academic Service"""
    # TODO: Implement call to Academic Service
    return {
        'success': True,
        'message_he': 'נתונים נשלחו לשירות האקדמי',
        'message_en': 'Data sent to Academic Service'
    }