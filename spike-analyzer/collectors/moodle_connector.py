"""
Moodle Connector Module
======================

This module handles secure connection to Moodle using Playwright,
including authentication, session management, and error handling.
"""

import asyncio
import logging
import time
from typing import List, Optional, Dict, Any
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from config.settings import get_config, setup_credentials_from_env

logger = logging.getLogger(__name__)

class MoodleConnectionError(Exception):
    """Raised when connection to Moodle fails."""
    pass

class MoodleAuthenticationError(Exception):
    """Raised when authentication to Moodle fails."""
    pass

class MoodleConnector:
    """Moodle connection and interaction manager using Playwright."""

    def __init__(self):
        self.config_manager = get_config()
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None
        self.is_authenticated = False
        self.session_start_time: Optional[float] = None
        self.max_retries = 3
        
        # Setup credentials from environment
        setup_credentials_from_env("BGU")

    async def connect(self) -> None:
        """Connect to Moodle using Playwright with minimal settings."""
        try:
            self.playwright = await async_playwright().start()
            
            # Launch browser with minimal settings to avoid crashes
            self.browser = await self.playwright.chromium.launch(
                headless=False,  # Keep visible for debugging
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            )
            
            # Create context with minimal settings
            self.context = await self.browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            
            self.page = await self.context.new_page()
            
            # Set longer timeout
            self.page.set_default_timeout(60000)
            
            logger.info("Successfully connected to browser with minimal settings")
            
        except Exception as e:
            logger.error(f"Failed to connect to browser: {e}")
            raise MoodleConnectionError(f"Browser connection failed: {e}")

    async def disconnect(self) -> None:
        """Disconnect from Moodle."""
        try:
            if self.page and not self.page.is_closed():
                await self.page.close()
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            
            self.is_authenticated = False
            self.session_start_time = None
            logger.info("Disconnected from Moodle")
            
        except Exception as e:
            logger.error(f"Error during disconnect: {e}")

    async def ensure_page_available(self) -> bool:
        """Ensure page is available and not closed."""
        if not self.page or self.page.is_closed():
            logger.warning("Page is closed, reconnecting...")
            await self.disconnect()
            await self.connect()
            return False
        return True

    async def authenticate(self) -> bool:
        """Authenticate to Moodle with retry mechanism."""
        for attempt in range(self.max_retries):
            try:
                if not await self.ensure_page_available():
                    raise MoodleConnectionError("Page not available")
                
                credentials = self.config_manager.get_credentials()
                if not credentials:
                    raise MoodleAuthenticationError("No credentials set")
                
                logger.info(f"Starting authentication process (attempt {attempt + 1}/{self.max_retries})")
                
                # Navigate to Moodle dashboard
                dashboard_url = f"{credentials.base_url}/moodle/local/mydashboard/"
                logger.info(f"Navigating to: {dashboard_url}")
                await self.page.goto(dashboard_url, wait_until='networkidle', timeout=30000)
                
                # Wait for page to load
                await asyncio.sleep(3)
                
                # Check if we need to login
                current_url = self.page.url
                logger.info(f"Current URL: {current_url}")
                
                # If we're redirected to login page, perform login
                if '/login/index.php' in current_url or 'login' in current_url.lower():
                    logger.info("Redirected to login page, performing authentication")
                    
                    # Find and fill username field
                    username_selectors = [
                        'input[name="username"]',
                        'input[id="username"]',
                        'input[type="text"]',
                        '#username',
                        '[name="username"]'
                    ]
                    
                    username_field = None
                    for selector in username_selectors:
                        try:
                            username_field = await self.page.wait_for_selector(selector, timeout=10000)
                            if username_field:
                                logger.info(f"Found username field with selector: {selector}")
                                break
                        except:
                            continue
                    
                    if not username_field:
                        logger.error("Could not find username field")
                        raise MoodleAuthenticationError("Username field not found")
                    
                    await username_field.fill(credentials.username)
                    logger.info("Username filled")
                    
                    # Find and fill password field
                    password_selectors = [
                        'input[name="password"]',
                        'input[id="password"]',
                        'input[type="password"]',
                        '#password',
                        '[name="password"]'
                    ]
                    
                    password_field = None
                    for selector in password_selectors:
                        try:
                            password_field = await self.page.wait_for_selector(selector, timeout=10000)
                            if password_field:
                                logger.info(f"Found password field with selector: {selector}")
                                break
                        except:
                            continue
                    
                    if not password_field:
                        logger.error("Could not find password field")
                        raise MoodleAuthenticationError("Password field not found")
                    
                    await password_field.fill(credentials.password)
                    logger.info("Password filled")
                    
                    # Find and click submit button
                    submit_selectors = [
                        'input[type="submit"]',
                        'button[type="submit"]',
                        'input[value*="login"]',
                        'input[value*="Login"]',
                        'button:has-text("Login")',
                        'button:has-text("login")',
                        '[type="submit"]'
                    ]
                    
                    submit_button = None
                    for selector in submit_selectors:
                        try:
                            submit_button = await self.page.wait_for_selector(selector, timeout=10000)
                            if submit_button:
                                logger.info(f"Found submit button with selector: {selector}")
                                break
                        except:
                            continue
                    
                    if not submit_button:
                        logger.error("Could not find submit button")
                        raise MoodleAuthenticationError("Submit button not found")
                    
                    await submit_button.click()
                    logger.info("Submit button clicked")
                    
                    # Wait for navigation
                    await self.page.wait_for_load_state('networkidle', timeout=30000)
                    await asyncio.sleep(3)
                    
                # Check if we're redirected to dashboard or if there's an error
                current_url = self.page.url
                logger.info(f"Current URL after login attempt: {current_url}")
                
                # Check for successful login - should be redirected to /moodle/my/
                if '/moodle/my/' in current_url:
                    logger.info("Authentication successful - redirected to /moodle/my/")
                    self.is_authenticated = True
                    self.session_start_time = time.time()
                    await asyncio.sleep(2)
                    logger.info("Authentication completed successfully")
                    return True
                
                # Check for failed login - should be on login page
                if '/moodle/login/index.php' in current_url:
                    logger.error("Authentication failed - still on login page")
                    if attempt < self.max_retries - 1:
                        logger.info(f"Retrying authentication... (attempt {attempt + 2}/{self.max_retries})")
                        await asyncio.sleep(2)
                        continue
                    else:
                        raise MoodleAuthenticationError("Authentication failed - still on login page")
                
                # If we're on the dashboard page, we're already authenticated
                if '/moodle/local/mydashboard/' in current_url or '/moodle/my/' in current_url:
                    logger.info("Already authenticated - on dashboard page")
                    self.is_authenticated = True
                    self.session_start_time = time.time()
                    return True
                
                logger.warning(f"Unexpected URL after authentication: {current_url}")
                return False
                
            except Exception as e:
                logger.error(f"Authentication attempt {attempt + 1} failed: {e}")
                if attempt < self.max_retries - 1:
                    logger.info(f"Retrying authentication... (attempt {attempt + 2}/{self.max_retries})")
                    await asyncio.sleep(2)
                    continue
                else:
                    raise MoodleAuthenticationError(f"Authentication failed after {self.max_retries} attempts: {e}")

    async def ensure_authenticated(self) -> bool:
        """Ensure we are authenticated, re-authenticate if needed."""
        if self.is_authenticated:
            # Check if session is still valid
            session_config = self.config_manager.get_session_config()
            if self.session_start_time and (time.time() - self.session_start_time) < (session_config.timeout / 1000):
                return True
        
        # Re-authenticate
        return await self.authenticate()

    async def navigate_to_courses_page(self) -> None:
        """Navigate to the courses page."""
        if not await self.ensure_page_available():
            raise MoodleConnectionError("Page not available")
            
        if not await self.ensure_authenticated():
            raise MoodleAuthenticationError("Failed to authenticate")
        
        try:
            credentials = self.config_manager.get_credentials()
            courses_url = f"{credentials.base_url}/moodle/my/courses.php"
            
            logger.info(f"Navigating to courses page: {courses_url}")
            await self.page.goto(courses_url, wait_until='networkidle', timeout=30000)
            
            # Wait for page to load
            await asyncio.sleep(3)
            
            logger.info("Successfully navigated to courses page")
            
        except Exception as e:
            logger.error(f"Failed to navigate to courses page: {e}")
            raise MoodleConnectionError(f"Navigation failed: {e}")

    async def wait_for_courses_to_load(self) -> bool:
        """Wait for courses to load in the INDWrap div."""
        try:
            logger.info("Waiting for courses to load...")
            
            # Wait for INDWrap div to appear
            await self.page.wait_for_selector('#INDWrap', timeout=30000)
            logger.info("INDWrap div found")
            
            # Wait for course elements to appear
            course_selectors = [
                '.course-card',
                '.coursebox',
                '.course-list-item',
                'h5.multiline',
                '.course-name',
                '.course-title'
            ]
            
            for selector in course_selectors:
                try:
                    await self.page.wait_for_selector(selector, timeout=10000)
                    logger.info(f"Course elements found with selector: {selector}")
                    return True
                except:
                    continue
            
            # If no specific course selectors found, wait a bit more and check for any content
            await asyncio.sleep(5)
            
            # Check if there's any content in INDWrap
            indwrap_content = await self.page.query_selector('#INDWrap')
            if indwrap_content:
                content_text = await indwrap_content.text_content()
                if content_text and len(content_text.strip()) > 100:
                    logger.info("INDWrap contains content, courses may be loaded")
                    return True
            
            logger.warning("No course elements found, but continuing...")
            return False
            
        except Exception as e:
            logger.error(f"Error waiting for courses to load: {e}")
            return False

    async def get_courses_list(self) -> List[Dict[str, Any]]:
        """Extract list of active courses from the page with detailed information."""
        if not await self.ensure_page_available():
            raise MoodleConnectionError("Page not available")
        
        try:
            await self.navigate_to_courses_page()
            
            # Wait for courses to load
            await self.wait_for_courses_to_load()
            
            # Wait additional time for JavaScript to fully load content
            await asyncio.sleep(5)
            
            # Save page source for debugging
            page_content = await self.page.content()
            with open('debug_courses_page_final.html', 'w', encoding='utf-8') as f:
                f.write(page_content)
            logger.info("Saved final page content to debug_courses_page_final.html")
            
            # Multiple selectors to find course names - more specific for course cards
            course_selectors = [
                '.course-card h3',
                '.course-card .course-title',
                '.course-card h4',
                '.course-card h5',
                '.course-card .course-name',
                '.course-card a',
                '.coursebox h3',
                '.coursebox .course-title',
                '.coursebox a',
                '.course-list-item h3',
                '.course-list-item .course-title',
                '.course-list-item a',
                '.course h3',
                '.course .course-title',
                '.course a',
                'h5.multiline',
                '.course-name',
                '.course-title',
                '.coursebox h3',
                '.course-list-item h3',
                '.course h3',
                'h5',
                '.course h5',
                'h3',
                'h4',
                'h5',
                '.course a',
                'a[href*="course"]',
                '.coursebox a',
                '.course-list-item a',
                'a'  # Fallback to links if no courses found
            ]
            
            courses = []
            
            for selector in course_selectors:
                try:
                    elements = await self.page.query_selector_all(selector)
                    logger.info(f"Found {len(elements)} elements with selector: {selector}")
                    
                    for element in elements:
                        try:
                            text = await element.text_content()
                            href = await element.get_attribute('href') if await element.get_attribute('tagName') == 'A' else ''
                            
                            # Filter out menu items and short texts, but include course names
                            if (text and 
                                len(text) > 5 and 
                                text not in [course['name'] for course in courses] and
                                text not in ['הודעות', 'פרטיות', 'העדפות הודעות', 'כללי', 'עזרה', 'תמיכה', 'מידע שימושי', 'הקורסים שלי'] and
                                not text.startswith('תפריט') and
                                not text.startswith('הגדרות') and
                                not text.startswith('ראשי') and
                                not text.startswith('עדכונים')):
                                
                                # Try to extract additional information
                                course_info = {
                                    'name': text.strip(),
                                    'code': '',
                                    'instructor': '',
                                    'url': href
                                }
                                
                                # Try to find course code (usually in parentheses or brackets)
                                import re
                                code_match = re.search(r'\(([^)]+)\)', text)
                                if code_match:
                                    course_info['code'] = code_match.group(1)
                                
                                # Try to find instructor (usually after "מרצה:" or "Lecturer:")
                                instructor_match = re.search(r'מרצה:\s*([^\n]+)', text)
                                if instructor_match:
                                    course_info['instructor'] = instructor_match.group(1).strip()
                                
                                courses.append(course_info)
                                logger.info(f"Found course: {course_info}")
                        except Exception as e:
                            logger.warning(f"Error extracting text from element: {e}")
                            continue
                    
                    # If we found courses with this selector, break
                    if courses:
                        logger.info(f"Successfully extracted {len(courses)} courses using selector: {selector}")
                        break
                        
                except Exception as e:
                    logger.warning(f"Error with selector {selector}: {e}")
                    continue
            
            if not courses:
                logger.warning("No courses found with any selector")
                # Try to get any text that might be course names
                all_text_elements = await self.page.query_selector_all('h3, h4, h5, a')
                for element in all_text_elements:
                    try:
                        text = await element.text_content()
                        href = await element.get_attribute('href') if await element.get_attribute('tagName') == 'A' else ''
                        
                        if (text and 
                            len(text) > 5 and 
                            text not in [course['name'] for course in courses] and
                            text not in ['הודעות', 'פרטיות', 'העדפות הודעות', 'כללי', 'עזרה', 'תמיכה', 'מידע שימושי', 'הקורסים שלי'] and
                            not text.startswith('תפריט') and
                            not text.startswith('הגדרות') and
                            not text.startswith('ראשי') and
                            not text.startswith('עדכונים') and
                            ('course' in href.lower() or 'course' in text.lower() or 'סמ' in text or 'סמסטר' in text)):
                            
                            course_info = {
                                'name': text.strip(),
                                'code': '',
                                'instructor': '',
                                'url': href
                            }
                            courses.append(course_info)
                            logger.info(f"Found potential course: {course_info}")
                    except Exception as e:
                        logger.warning(f"Error extracting text from fallback element: {e}")
                        continue
            
            logger.info(f"Total courses found: {len(courses)}")
            return courses
            
        except Exception as e:
            logger.error(f"Failed to get courses list: {e}")
            raise MoodleConnectionError(f"Failed to get courses list: {e}")

    async def test_connection(self) -> bool:
        """Test the connection to Moodle."""
        try:
            await self.connect()
            await self.authenticate()
            courses = await self.get_courses_list()
            logger.info(f"Connection test successful. Found {len(courses)} courses.")
            return True
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False
        finally:
            await self.disconnect() 