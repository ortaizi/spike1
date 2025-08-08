#!/usr/bin/env python3
"""
Simple Moodle Connector using requests and BeautifulSoup
=======================================================

This module provides a simpler approach to Moodle integration
using requests for HTTP requests and BeautifulSoup for HTML parsing.
"""

import requests
import logging
import time
from typing import List, Optional
from bs4 import BeautifulSoup
from config.settings import get_config, setup_credentials_from_env

logger = logging.getLogger(__name__)

class MoodleConnectionError(Exception):
    """Raised when connection to Moodle fails."""
    pass

class MoodleAuthenticationError(Exception):
    """Raised when authentication to Moodle fails."""
    pass

class SimpleMoodleConnector:
    """Simple Moodle connector using requests and BeautifulSoup."""

    def __init__(self):
        self.config_manager = get_config()
        self.session = requests.Session()
        self.is_authenticated = False
        self.session_start_time: Optional[float] = None
        
        # Setup credentials from environment
        setup_credentials_from_env("BGU")
        
        # Setup session headers
        session_config = self.config_manager.get_session_config()
        self.session.headers.update({
            'User-Agent': session_config.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })

    def authenticate(self) -> bool:
        """Authenticate to Moodle using session-based login."""
        try:
            credentials = self.config_manager.get_credentials()
            if not credentials:
                raise MoodleAuthenticationError("No credentials set")
            
            session_config = self.config_manager.get_session_config()
            
            logger.info("Starting authentication process")
            
            # First, get the login page to extract form data
            login_url = f"{credentials.base_url}/moodle/login/index.php"
            logger.info(f"Getting login page: {login_url}")
            
            response = self.session.get(login_url, timeout=30)
            response.raise_for_status()
            
            # Parse the login page to find the login form
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the login form
            login_form = soup.find('form', {'id': 'login'}) or soup.find('form', {'action': lambda x: x and 'login' in x})
            
            if not login_form:
                logger.error("Could not find login form")
                raise MoodleAuthenticationError("Login form not found")
            
            # Extract form action URL
            form_action = login_form.get('action')
            if form_action:
                if form_action.startswith('/'):
                    action_url = f"{credentials.base_url}{form_action}"
                else:
                    action_url = form_action
            else:
                action_url = login_url
            
            # Prepare login data
            login_data = {
                'username': credentials.username,
                'password': credentials.password,
            }
            
            # Add any hidden fields from the form
            for hidden_input in login_form.find_all('input', {'type': 'hidden'}):
                name = hidden_input.get('name')
                value = hidden_input.get('value', '')
                if name:
                    login_data[name] = value
            
            logger.info(f"Submitting login form to: {action_url}")
            
            # Submit the login form
            response = self.session.post(action_url, data=login_data, timeout=30, allow_redirects=True)
            response.raise_for_status()
            
            # Check if login was successful
            current_url = response.url
            logger.info(f"Current URL after login: {current_url}")
            
            # Check for successful login indicators
            if '/moodle/my/' in current_url or '/moodle/local/mydashboard/' in current_url:
                logger.info("Authentication successful")
                self.is_authenticated = True
                self.session_start_time = time.time()
                return True
            
            # Check for failed login indicators
            if '/moodle/login/index.php' in current_url:
                logger.error("Authentication failed - still on login page")
                raise MoodleAuthenticationError("Authentication failed - still on login page")
            
            # Check for error messages in the response
            soup = BeautifulSoup(response.content, 'html.parser')
            error_messages = soup.find_all(class_=['alert-danger', 'error', 'loginerrors'])
            
            if error_messages:
                error_text = ' '.join([msg.get_text().strip() for msg in error_messages])
                logger.error(f"Login error: {error_text}")
                raise MoodleAuthenticationError(f"Authentication failed: {error_text}")
            
            logger.warning(f"Unexpected URL after authentication: {current_url}")
            return False
            
        except requests.RequestException as e:
            logger.error(f"Request error during authentication: {e}")
            raise MoodleConnectionError(f"Request failed: {e}")
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            raise MoodleAuthenticationError(f"Authentication failed: {e}")

    def get_courses_list(self) -> List[str]:
        """Get list of active courses from Moodle."""
        try:
            if not self.is_authenticated:
                self.authenticate()
            
            credentials = self.config_manager.get_credentials()
            
            # Try multiple endpoints to get courses
            endpoints_to_try = [
                f"{credentials.base_url}/moodle/my/courses.php",
                f"{credentials.base_url}/moodle/course/index.php",
                f"{credentials.base_url}/moodle/local/mydashboard/",
                f"{credentials.base_url}/moodle/my/",
                f"{credentials.base_url}/moodle/course/view.php",
                f"{credentials.base_url}/moodle/course/category.php"
            ]
            
            courses = []
            
            for endpoint in endpoints_to_try:
                try:
                    logger.info(f"Trying endpoint: {endpoint}")
                    
                    response = self.session.get(endpoint, timeout=30)
                    response.raise_for_status()
                    
                    # Parse the page content
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Log page title and URL for debugging
                    logger.info(f"Page title: {soup.title.string if soup.title else 'No title'}")
                    logger.info(f"Page URL: {response.url}")
                    
                    # Save page content for debugging
                    with open(f'debug_page_{endpoint.split("/")[-1]}.html', 'w', encoding='utf-8') as f:
                        f.write(soup.prettify())
                    logger.info(f"Saved page content to debug_page_{endpoint.split('/')[-1]}.html")
                    
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
                    
                    for selector in course_selectors:
                        try:
                            elements = soup.select(selector)
                            logger.info(f"Found {len(elements)} elements with selector: {selector}")
                            
                            for element in elements:
                                text = element.get_text().strip()
                                href = element.get('href', '') if element.name == 'a' else ''
                                
                                # Filter out menu items and short texts, but include course names
                                if (text and 
                                    len(text) > 5 and 
                                    text not in courses and
                                    text not in ['הודעות', 'פרטיות', 'העדפות הודעות', 'כללי', 'עזרה', 'תמיכה', 'מידע שימושי', 'הקורסים שלי'] and
                                    not text.startswith('תפריט') and
                                    not text.startswith('הגדרות') and
                                    not text.startswith('ראשי') and
                                    not text.startswith('עדכונים')):
                                    
                                    courses.append(text)
                                    logger.info(f"Found course: {text} (href: {href})")
                            
                            # If we found courses with this selector, break
                            if courses:
                                logger.info(f"Successfully extracted {len(courses)} courses using selector: {selector}")
                                break
                                
                        except Exception as e:
                            logger.warning(f"Error with selector {selector}: {e}")
                            continue
                    
                    # If we found courses, break from endpoints loop
                    if courses:
                        logger.info(f"Found courses on endpoint: {endpoint}")
                        break
                        
                except Exception as e:
                    logger.warning(f"Failed to get courses from {endpoint}: {e}")
                    continue
            
            if not courses:
                logger.warning("No courses found with any endpoint or selector")
                # Try to get any text that might be course names from the last endpoint
                try:
                    response = self.session.get(endpoints_to_try[0], timeout=30)
                    response.raise_for_status()
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    all_text_elements = soup.find_all(['h3', 'h4', 'h5', 'a'])
                    for element in all_text_elements:
                        try:
                            text = element.get_text().strip()
                            href = element.get('href', '') if element.name == 'a' else ''
                            
                            if (text and 
                                len(text) > 5 and 
                                text not in courses and
                                text not in ['הודעות', 'פרטיות', 'העדפות הודעות', 'כללי', 'עזרה', 'תמיכה', 'מידע שימושי', 'הקורסים שלי'] and
                                not text.startswith('תפריט') and
                                not text.startswith('הגדרות') and
                                not text.startswith('ראשי') and
                                not text.startswith('עדכונים') and
                                ('course' in href.lower() or 'course' in text.lower() or 'סמ' in text or 'סמסטר' in text)):
                                
                                courses.append(text)
                                logger.info(f"Found potential course: {text} (href: {href})")
                        except Exception as e:
                            logger.warning(f"Error extracting text from fallback element: {e}")
                            continue
                except Exception as e:
                    logger.error(f"Failed to get fallback courses: {e}")
            
            logger.info(f"Total courses found: {len(courses)}")
            return courses
            
        except requests.RequestException as e:
            logger.error(f"Request error while getting courses: {e}")
            raise MoodleConnectionError(f"Failed to get courses: {e}")
        except Exception as e:
            logger.error(f"Failed to get courses list: {e}")
            raise MoodleConnectionError(f"Failed to get courses list: {e}")

    def test_connection(self) -> bool:
        """Test the connection to Moodle."""
        try:
            self.authenticate()
            courses = self.get_courses_list()
            logger.info(f"Connection test successful. Found {len(courses)} courses.")
            return True
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False

    def close(self):
        """Close the session."""
        if self.session:
            self.session.close()
        logger.info("Session closed") 