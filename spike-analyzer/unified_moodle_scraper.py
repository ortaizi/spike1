#!/usr/bin/env python3
"""
Unified Moodle Scraper - Combines Course List and Course Items Scraping
Extracts all courses and their items from Moodle BGU using Playwright with Firefox
"""

import asyncio
import json
import logging
import os
import sys
import re
import uuid
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional
from playwright.async_api import async_playwright, Browser, Page
from dotenv import load_dotenv

# Load environment variables from .env.development
load_dotenv('/Users/ortaizi/Desktop/Spike/.env.development')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class UnifiedMoodleScraper:
    """Unified scraper for both courses and course items."""
    
    def __init__(self):
        self.browser: Browser = None
        self.page: Page = None
        self.playwright = None
        
        # Load credentials from environment
        self.username = os.getenv('BGU_MOODLE_USERNAME')
        self.password = os.getenv('BGU_MOODLE_PASSWORD')
        
        if not self.username or not self.password:
            logger.error("❌ Missing BGU_MOODLE_USERNAME or BGU_MOODLE_PASSWORD environment variables")
            sys.exit(1)
        
        # Load Supabase credentials
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.supabase_db_password = os.getenv('SUPABASE_DB_PASSWORD')
        
        if not self.supabase_url or not self.supabase_service_role_key:
            logger.warning("⚠️ Missing Supabase credentials - database operations will be skipped")
            self.supabase_available = False
        else:
            self.supabase_available = True
    
    def parse_course_info(self, course_name: str) -> Dict[str, Any]:
        """Parse course name to extract structured information."""
        course_info = {
            'id': str(uuid.uuid4()),  # Generate UUID for each course
            'name': course_name,
            'code': '',
            'semester': '',
            'academicyear': None,
            'faculty': 'הנדסת תעשייה וניהול',
            'department': '',
            'instructor': '',
            'isactive': True
        }
        
        # Extract semester information (סמ 1, סמ 2, etc.)
        semester_match = re.search(r'סמ\s*(\d+)', course_name)
        if semester_match:
            semester_num = semester_match.group(1)
            course_info['semester'] = f"סמסטר {semester_num}"
        
        # Extract academic year (2025, etc.)
        year_match = re.search(r'(\d{4})', course_name)
        if year_match:
            course_info['academicyear'] = int(year_match.group(1))
        
        # Extract course code (usually in parentheses or brackets)
        code_match = re.search(r'\(([^)]+)\)', course_name)
        if code_match:
            course_info['code'] = code_match.group(1)
        else:
            # Generate a simple code if none found
            course_info['code'] = f"COURSE_{len(course_name[:10])}"
        
        # Extract instructor (usually after "מרצה:" or "Lecturer:")
        instructor_match = re.search(r'מרצה:\s*([^\n]+)', course_name)
        if instructor_match:
            course_info['instructor'] = instructor_match.group(1).strip()
        
        # Determine faculty based on course name patterns
        if any(word in course_name for word in ['הנדסת', 'תעשייה', 'ניהול']):
            course_info['faculty'] = 'הנדסת תעשייה וניהול'
        elif any(word in course_name for word in ['מחשבים', 'תוכנה', 'אלגוריתמים']):
            course_info['faculty'] = 'הנדסת מחשבים'
        elif any(word in course_name for word in ['פיסיקה', 'מתמטיקה']):
            course_info['faculty'] = 'מדעים מדויקים'
        
        return course_info
    
    async def start_browser(self):
        """Start Firefox browser."""
        try:
            logger.info("🔄 Starting Firefox browser...")
            self.playwright = await async_playwright().start()
            
            self.browser = await self.playwright.firefox.launch(
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
            
            self.page = await self.browser.new_page()
            self.page.set_default_timeout(60000)
            
            logger.info("✅ Firefox browser started successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to start Firefox browser: {e}")
            raise
    
    async def login_to_moodle(self):
        """Login to Moodle BGU using Firefox."""
        try:
            logger.info("🔄 Starting login process with Firefox...")
            
            # Navigate to Moodle login page
            await self.page.goto('https://moodle.bgu.ac.il/moodle/login/index.php')
            logger.info("📄 Navigated to login page")
            
            # Wait for page to load
            await self.page.wait_for_load_state('networkidle')
            logger.info("⏳ Page loaded successfully")
            
            # Fill username
            await self.page.fill('input[name="username"]', self.username)
            logger.info("👤 Username filled")
            
            # Fill password
            await self.page.fill('input[name="password"]', self.password)
            logger.info("🔒 Password filled")
            
            # Click login button
            await self.page.click('input[type="submit"]')
            logger.info("🖱️ Login button clicked")
            
            # Wait for navigation
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)  # Additional wait for Firefox
            
            # Check if login was successful
            current_url = self.page.url
            logger.info(f"🌐 Current URL after login: {current_url}")
            
            if '/moodle/my/' in current_url:
                logger.info("✅ Login successful with Firefox!")
                return True
            else:
                logger.error("❌ Login failed - still on login page")
                return False
                
        except Exception as e:
            logger.error(f"❌ Login failed with Firefox: {e}")
            return False
    
    async def navigate_to_courses_page(self):
        """Navigate to the courses page using Firefox."""
        try:
            logger.info("🔄 Navigating to courses page with Firefox...")
            
            # Navigate to courses page
            await self.page.goto('https://moodle.bgu.ac.il/moodle/my/')
            
            # Wait for page to load completely
            await self.page.wait_for_load_state('networkidle')
            
            # Additional wait for JavaScript to load content in Firefox
            await asyncio.sleep(5)
            
            logger.info("✅ Successfully navigated to courses page with Firefox")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to navigate to courses page with Firefox: {e}")
            return False
    
    async def extract_courses(self) -> List[Dict[str, Any]]:
        """Extract course names and links from the page."""
        try:
            logger.info("🔍 Starting course extraction with Firefox...")
            
            # Wait for h5.multiline elements to appear
            try:
                await self.page.wait_for_selector('h5.multiline', timeout=15000)
                logger.info("✅ Found h5.multiline elements with Firefox")
            except Exception as e:
                logger.warning(f"⚠️ No h5.multiline elements found, trying alternative selectors... Error: {e}")
            
            # Try multiple selectors to find courses
            selectors_to_try = [
                'h5.multiline',
                'h5[class*="multiline"]',
                '.multiline',
                'h5',
                '.course h5',
                '.course-title',
                '.course-name',
                '.course-card h5',
                '.coursebox h5'
            ]
            
            courses = []
            
            for selector in selectors_to_try:
                try:
                    elements = await self.page.query_selector_all(selector)
                    logger.info(f"🔍 Found {len(elements)} elements with selector: {selector}")
                    
                    for element in elements:
                        try:
                            text = await element.text_content()
                            if text and text.strip():
                                text = text.strip()
                                
                                # Filter out non-course elements
                                if (len(text) > 5 and 
                                    text not in [c['name'] for c in courses] and
                                    text not in ['הודעות', 'פרטיות', 'העדפות הודעות', 'כללי', 'עזרה', 'תמיכה', 'מידע שימושי', 'הקורסים שלי'] and
                                    not text.startswith('תפריט') and
                                    not text.startswith('הגדרות') and
                                    not text.startswith('ראשי') and
                                    not text.startswith('עדכונים')):
                                    
                                    # Get the parent link element
                                    parent_link = await element.query_selector('xpath=..')
                                    course_link = ""
                                    if parent_link:
                                        href = await parent_link.get_attribute('href')
                                        if href:
                                            course_link = href
                                    
                                    # If no parent link, try to find nearby link
                                    if not course_link:
                                        nearby_link = await element.query_selector('xpath=following-sibling::a[1]')
                                        if nearby_link:
                                            href = await nearby_link.get_attribute('href')
                                            if href:
                                                course_link = href
                                    
                                    course_info = self.parse_course_info(text)
                                    course_info['link'] = course_link
                                    courses.append(course_info)
                                    logger.info(f"📚 Found course: {text}")
                        
                        except Exception as e:
                            logger.warning(f"⚠️ Error extracting text from element: {e}")
                            continue
                    
                    # If we found courses with this selector, break
                    if courses:
                        logger.info(f"✅ Successfully extracted {len(courses)} courses using selector: {selector}")
                        break
                        
                except Exception as e:
                    logger.warning(f"⚠️ Error with selector {selector}: {e}")
                    continue
            
            logger.info(f"📊 Total courses found with Firefox: {len(courses)}")
            return courses
            
        except Exception as e:
            logger.error(f"❌ Failed to extract courses with Firefox: {e}")
            return []
    
    async def save_courses_to_database(self, courses: List[Dict[str, Any]]) -> bool:
        """Save courses to Supabase database."""
        try:
            if not self.supabase_available:
                logger.warning("⚠️ Supabase not available - skipping database insertion")
                return False
            
            logger.info("💾 Saving courses to database...")
            
            headers = {
                'apikey': self.supabase_service_role_key,
                'Authorization': f'Bearer {self.supabase_service_role_key}',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            }
            
            # First, delete existing courses to avoid duplicates
            delete_response = requests.delete(
                f"{self.supabase_url}/rest/v1/courses",
                headers=headers
            )
            
            if delete_response.status_code in [200, 204]:
                logger.info("🗑️ Deleted existing courses")
            else:
                logger.warning(f"⚠️ Could not delete existing courses: {delete_response.status_code}")
            
            # Insert new courses
            for course_data in courses:
                try:
                    # Remove link from course_data for database insertion
                    db_course_data = {k: v for k, v in course_data.items() if k != 'link'}
                    
                    response = requests.post(
                        f'{self.supabase_url}/rest/v1/courses',
                        headers=headers,
                        json=db_course_data
                    )
                    
                    if response.status_code == 201:
                        logger.info(f"✅ Saved course: {course_data['name']}")
                    else:
                        logger.warning(f"⚠️ Failed to save course: {course_data['name']} - {response.status_code}")
                        
                except Exception as e:
                    logger.error(f"❌ Error saving course {course_data['name']}: {e}")
            
            logger.info(f"💾 Successfully saved {len(courses)} courses to database")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save courses to database: {e}")
            return False
    
    async def find_course_link(self, course_name: str) -> Optional[str]:
        """Find the link to a specific course."""
        try:
            logger.info(f"🔍 Looking for course: {course_name}")
            
            # Navigate back to courses page if needed
            await self.navigate_to_courses_page()
            
            # Wait for h5.multiline elements to appear
            try:
                await self.page.wait_for_selector('h5.multiline', timeout=15000)
                logger.info("✅ Found h5.multiline elements with Firefox")
            except Exception as e:
                logger.warning(f"⚠️ No h5.multiline elements found, trying alternative selectors... Error: {e}")
            
            # Try multiple selectors to find courses
            selectors_to_try = [
                'h5.multiline',
                'h5[class*="multiline"]',
                '.multiline',
                'h5',
                '.course h5',
                '.course-title',
                '.course-name',
                '.course-card h5',
                '.coursebox h5'
            ]
            
            for selector in selectors_to_try:
                try:
                    elements = await self.page.query_selector_all(selector)
                    logger.info(f"🔍 Found {len(elements)} elements with selector: {selector}")
                    
                    for element in elements:
                        try:
                            text = await element.text_content()
                            if text and text.strip():
                                text = text.strip()
                                
                                # Check if this is our target course
                                if course_name in text:
                                    logger.info(f"🎯 Found target course: {text}")
                                    
                                    # Get the parent link element
                                    parent_link = await element.query_selector('xpath=..')
                                    if parent_link:
                                        href = await parent_link.get_attribute('href')
                                        if href:
                                            logger.info(f"🔗 Found course link: {href}")
                                            return href
                                    
                                    # If no parent link, try to find nearby link
                                    nearby_link = await element.query_selector('xpath=following-sibling::a[1]')
                                    if nearby_link:
                                        href = await nearby_link.get_attribute('href')
                                        if href:
                                            logger.info(f"🔗 Found nearby course link: {href}")
                                            return href
                        
                        except Exception as e:
                            logger.warning(f"⚠️ Error extracting text from element: {e}")
                            continue
                    
                except Exception as e:
                    logger.warning(f"⚠️ Error with selector {selector}: {e}")
                    continue
            
            logger.warning(f"⚠️ Course '{course_name}' not found")
            return None
            
        except Exception as e:
            logger.error(f"❌ Error finding course link: {e}")
            return None
    
    async def navigate_to_course_page(self, course_link: str):
        """Navigate to the specific course page."""
        try:
            logger.info(f"🔄 Navigating to course page: {course_link}")
            
            await self.page.goto(course_link)
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(3)  # Additional wait for content to load
            
            logger.info("✅ Successfully navigated to course page")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to navigate to course page: {e}")
            return False
    
    async def extract_item_id(self, item) -> str:
        """Extract unique item ID."""
        try:
            # Try to get ID from the item element
            item_id = await item.get_attribute('id')
            if item_id:
                return item_id
            
            # Try to get ID from data-id attribute
            data_id = await item.get_attribute('data-id')
            if data_id:
                return data_id
            
            # Try to get ID from data-for attribute
            data_for = await item.get_attribute('data-for')
            if data_for:
                return data_for
            
            return ""
            
        except Exception as e:
            logger.warning(f"⚠️ Error extracting item ID: {e}")
            return ""
    
    def create_course_items_table(self) -> bool:
        """Create the course_items table if it doesn't exist."""
        try:
            if not self.supabase_available:
                logger.warning("⚠️ Supabase not available - skipping table creation")
                return False
            
            # SQL to create the course_items table
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS course_items (
                id SERIAL PRIMARY KEY,
                course_name VARCHAR(255) NOT NULL,
                item_name TEXT NOT NULL,
                item_type VARCHAR(50) NOT NULL,
                section_name VARCHAR(255) NOT NULL,
                item_url TEXT,
                moodle_type VARCHAR(50),
                item_id VARCHAR(100),
                position INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Create indexes for better performance
            CREATE INDEX IF NOT EXISTS idx_course_items_course_name ON course_items(course_name);
            CREATE INDEX IF NOT EXISTS idx_course_items_section_name ON course_items(section_name);
            CREATE INDEX IF NOT EXISTS idx_course_items_item_type ON course_items(item_type);
            CREATE INDEX IF NOT EXISTS idx_course_items_position ON course_items(position);
            CREATE INDEX IF NOT EXISTS idx_course_items_moodle_type ON course_items(moodle_type);
            
            -- Add RLS (Row Level Security) policies
            ALTER TABLE course_items ENABLE ROW LEVEL SECURITY;
            
            -- Policy to allow all operations for authenticated users
            CREATE POLICY IF NOT EXISTS "Allow all operations for authenticated users" ON course_items
                FOR ALL USING (auth.role() = 'authenticated');
            
            -- Policy to allow read access for all users
            CREATE POLICY IF NOT EXISTS "Allow read access for all users" ON course_items
                FOR SELECT USING (true);
            
            -- Policy to allow insert/update/delete for service role
            CREATE POLICY IF NOT EXISTS "Allow service role operations" ON course_items
                FOR ALL USING (auth.role() = 'service_role');
            """
            
            # Try to create table using direct SQL execution
            headers = {
                'apikey': self.supabase_service_role_key,
                'Authorization': f'Bearer {self.supabase_service_role_key}',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            }
            
            # Try multiple approaches to create the table
            approaches = [
                # Approach 1: Direct SQL via rpc
                {
                    'url': f"{self.supabase_url}/rest/v1/rpc/exec_sql",
                    'data': {'sql': create_table_sql}
                },
                # Approach 2: Using pg function
                {
                    'url': f"{self.supabase_url}/rest/v1/rpc/execute_sql",
                    'data': {'query': create_table_sql}
                }
            ]
            
            for i, approach in enumerate(approaches):
                try:
                    response = requests.post(
                        approach['url'],
                        headers=headers,
                        json=approach['data']
                    )
                    
                    if response.status_code in [200, 201]:
                        logger.info(f"✅ Course items table created/verified successfully (approach {i+1})")
                        return True
                    else:
                        logger.warning(f"⚠️ Approach {i+1} failed: {response.status_code} - {response.text}")
                        
                except Exception as e:
                    logger.warning(f"⚠️ Approach {i+1} error: {e}")
                    continue
            
            # If all approaches fail, just continue and let the insert operation handle table creation
            logger.warning("⚠️ Could not create table via any approach - will try to insert anyway")
            return True
                
        except Exception as e:
            logger.warning(f"⚠️ Error creating course_items table: {e}")
            return True  # Continue anyway
    
    def insert_course_items_to_db(self, course_name: str, course_items: List[Dict[str, Any]]) -> bool:
        """Insert course items into the database."""
        try:
            if not self.supabase_available:
                logger.warning("⚠️ Supabase not available - skipping database insertion")
                return False
            
            if not course_items:
                logger.warning("⚠️ No course items to insert")
                return False
            
            # Prepare data for insertion
            db_items = []
            for item in course_items:
                db_item = {
                    'course_name': course_name,
                    'item_name': item['name'],
                    'item_type': item['type'],
                    'section_name': item['section'],
                    'item_url': item['url'] or '',
                    'moodle_type': item['moodle_type'],
                    'item_id': item['item_id'],
                    'position': item['position']
                }
                db_items.append(db_item)
            
            # Insert data using Supabase REST API with enhanced headers
            headers = {
                'apikey': self.supabase_service_role_key,
                'Authorization': f'Bearer {self.supabase_service_role_key}',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            }
            
            # First, delete existing items for this course to avoid duplicates
            delete_response = requests.delete(
                f"{self.supabase_url}/rest/v1/course_items",
                headers=headers,
                params={'course_name': f'eq.{course_name}'}
            )
            
            if delete_response.status_code in [200, 204]:
                logger.info(f"🗑️ Deleted existing items for course: {course_name}")
            else:
                logger.warning(f"⚠️ Could not delete existing items: {delete_response.status_code}")
            
            # Insert new items
            insert_response = requests.post(
                f"{self.supabase_url}/rest/v1/course_items",
                headers=headers,
                json=db_items
            )
            
            if insert_response.status_code == 201:
                logger.info(f"✅ Successfully inserted {len(db_items)} course items to database")
                return True
            else:
                logger.error(f"❌ Failed to insert course items: {insert_response.status_code} - {insert_response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error inserting course items to database: {e}")
            return False
    
    def determine_item_type(self, url: str, name: str, moodle_type: str) -> str:
        """Determine the type of item based on URL, name, and Moodle type."""
        
        # First check by Moodle type
        if moodle_type == "url":
            return "קישור_חיצוני"
        elif moodle_type == "forum":
            return "דף_פנימי"
        elif moodle_type == "zoom":
            return "קישור_חיצוני"
        elif moodle_type == "lti":
            return "קישור_חיצוני"
        elif moodle_type == "questionnaire":
            return "דף_פנימי"
        elif moodle_type == "attendance":
            return "דף_פנימי"
        elif moodle_type == "label":
            return "דף_פנימי"
        elif moodle_type == "resource":
            return "הורדה"
        
        # If no URL, default to internal page
        if not url:
            return "דף_פנימי"
        
        # Check for external links
        if any(domain in url.lower() for domain in ['http://', 'https://', 'www.', '.com', '.org', '.net', '.edu']):
            if 'moodle.bgu.ac.il' not in url.lower():
                return "קישור_חיצוני"
        
        # Check for file downloads
        file_extensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.zip', '.rar', '.mp4', '.mp3', '.jpg', '.jpeg', '.png', '.gif']
        if any(ext in url.lower() for ext in file_extensions):
            return "הורדה"
        
        # Check for pluginfile.php (Moodle file downloads)
        if 'pluginfile.php' in url:
            return "הורדה"
        
        # Check for resource/view.php (Moodle file downloads)
        if 'resource/view.php' in url:
            return "הורדה"
        
        # Default to internal page
        return "דף_פנימי"
    
    async def extract_course_items(self, course_name: str) -> List[Dict[str, Any]]:
        """Extract ALL items from ALL sections of a specific course."""
        course_items = []
        
        try:
            # Find course link
            course_link = await self.find_course_link(course_name)
            if not course_link:
                logger.error(f"❌ Could not find link for course: {course_name}")
                return course_items
            
            # Navigate to course page
            if not await self.navigate_to_course_page(course_link):
                logger.error(f"❌ Failed to navigate to course page: {course_name}")
                return course_items
            
            # Save page content for debugging
            page_content = await self.page.content()
            safe_course_name = course_name.replace(" ", "_").replace("/", "_")
            with open(f'debug_course_page_{safe_course_name}_unified.html', 'w', encoding='utf-8') as f:
                f.write(page_content)
            logger.info("💾 Saved course page content for debugging")
            
            logger.info(f"🔍 Starting enhanced course items extraction for: {course_name}")
            
            # Find all sections
            sections = await self.page.query_selector_all('.section.course-section.main')
            logger.info(f"📁 Found {len(sections)} sections")
            
            # Track global position on the page
            global_position = 1
            
            for section in sections:
                try:
                    # Get section name
                    section_name_elem = await section.query_selector('.sectionname')
                    section_name = ""
                    if section_name_elem:
                        section_name = await section_name_elem.text_content()
                        section_name = section_name.strip() if section_name else ""
                    
                    logger.info(f"📁 Processing section: {section_name}")
                    
                    # Find ALL types of items in this section
                    items = await section.query_selector_all('.activity.activity-wrapper')
                    logger.info(f"📄 Found {len(items)} items in section '{section_name}'")
                    
                    for item in items:
                        try:
                            # Get item type from class
                            item_classes = await item.get_attribute('class')
                            item_type_class = ""
                            if item_classes:
                                if 'modtype_resource' in item_classes:
                                    item_type_class = "resource"
                                elif 'modtype_forum' in item_classes:
                                    item_type_class = "forum"
                                elif 'modtype_zoom' in item_classes:
                                    item_type_class = "zoom"
                                elif 'modtype_url' in item_classes:
                                    item_type_class = "url"
                                elif 'modtype_lti' in item_classes:
                                    item_type_class = "lti"
                                elif 'modtype_questionnaire' in item_classes:
                                    item_type_class = "questionnaire"
                                elif 'modtype_attendance' in item_classes:
                                    item_type_class = "attendance"
                                elif 'modtype_label' in item_classes:
                                    item_type_class = "label"
                                else:
                                    item_type_class = "unknown"
                            
                            # Get item name from .activitytitle or .instancename
                            item_name = ""
                            
                            # Try .instancename first
                            instancename_elem = await item.query_selector('.instancename')
                            if instancename_elem:
                                item_name = await instancename_elem.text_content()
                                if item_name:
                                    # Remove accesshide text
                                    item_name = re.sub(r'<span class="accesshide.*?</span>', '', item_name)
                                    item_name = re.sub(r'<.*?>', '', item_name)  # Remove any remaining HTML tags
                                    item_name = item_name.strip()
                            
                            # If no name found, try .activitytitle
                            if not item_name:
                                activitytitle_elem = await item.query_selector('.activitytitle')
                                if activitytitle_elem:
                                    item_name = await activitytitle_elem.text_content()
                                    item_name = item_name.strip() if item_name else ""
                            
                            # If still no name, try to get from description or other elements
                            if not item_name:
                                # Try to get name from data-activityname attribute
                                data_activityname = await item.get_attribute('data-activityname')
                                if data_activityname:
                                    item_name = data_activityname
                                else:
                                    # Try to get from any text content in the item
                                    item_text = await item.text_content()
                                    if item_text:
                                        # Extract first meaningful line
                                        lines = item_text.strip().split('\n')
                                        for line in lines:
                                            line = line.strip()
                                            if line and len(line) > 3:  # Minimum meaningful length
                                                item_name = line
                                                break
                            
                            if not item_name:
                                logger.warning("⚠️ Could not find item name")
                                continue
                            
                            # Get item URL
                            item_url = ""
                            link_elem = await item.query_selector('a')
                            if link_elem:
                                item_url = await link_elem.get_attribute('href')
                                if item_url:
                                    # Make URL absolute if it's relative
                                    if item_url.startswith('/'):
                                        item_url = f"https://moodle.bgu.ac.il{item_url}"
                            
                            # Extract additional details
                            item_id = await self.extract_item_id(item)
                            
                            # Determine item type for our classification
                            item_type = self.determine_item_type(item_url, item_name, item_type_class)
                            
                            # Create enhanced item object
                            item_obj = {
                                "name": item_name,
                                "type": item_type,
                                "section": section_name,
                                "url": item_url,
                                "moodle_type": item_type_class,
                                "item_id": item_id,
                                "position": global_position
                            }
                            
                            course_items.append(item_obj)
                            logger.info(f"📄 Added enhanced item: {item_name} ({item_type}) [{item_type_class}] in section: {section_name} at global position {global_position}")
                            
                            # Increment global position for next item
                            global_position += 1
                            
                        except Exception as e:
                            logger.warning(f"⚠️ Error processing item: {e}")
                            continue
                    
                except Exception as e:
                    logger.warning(f"⚠️ Error processing section: {e}")
                    continue
            
            logger.info(f"✅ Successfully extracted {len(course_items)} enhanced items from all sections for course: {course_name}")
            return course_items
            
        except Exception as e:
            logger.error(f"❌ Error extracting course items for {course_name}: {e}")
            return course_items
    
    async def close_browser(self):
        """Close Firefox browser and cleanup."""
        try:
            if self.page:
                await self.page.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            logger.info("✅ Firefox browser closed successfully")
        except Exception as e:
            logger.error(f"❌ Error closing Firefox browser: {e}")
    
    async def scrape_all_courses_and_items(self) -> Dict[str, Any]:
        """Main method to scrape all courses and their items."""
        try:
            # Start Firefox browser
            await self.start_browser()
            
            # Login to Moodle
            if not await self.login_to_moodle():
                logger.error("❌ Failed to login to Moodle with Firefox")
                return {}
            
            # Navigate to courses page
            if not await self.navigate_to_courses_page():
                logger.error("❌ Failed to navigate to courses page")
                return {}
            
            # Extract courses
            courses = await self.extract_courses()
            
            if not courses:
                logger.error("❌ No courses found")
                return {}
            
            # Save courses to database
            await self.save_courses_to_database(courses)
            
            # Create course items table
            self.create_course_items_table()
            
            # Extract items for each course
            all_results = {
                'courses': courses,
                'course_items': {}
            }
            
            for course in courses:
                course_name = course['name']
                logger.info(f"🔍 Processing course: {course_name}")
                
                try:
                    # Extract items for this course
                    course_items = await self.extract_course_items(course_name)
                    
                    if course_items:
                        # Save items to database
                        self.insert_course_items_to_db(course_name, course_items)
                        
                        # Add to results
                        all_results['course_items'][course_name] = course_items
                        
                        logger.info(f"✅ Successfully processed course: {course_name} ({len(course_items)} items)")
                    else:
                        logger.warning(f"⚠️ No items found for course: {course_name}")
                        
                except Exception as e:
                    logger.error(f"❌ Error processing course {course_name}: {e}")
                    continue
            
            return all_results
            
        except Exception as e:
            logger.error(f"❌ Error in scrape_all_courses_and_items: {e}")
            return {}
        finally:
            await self.close_browser()

def save_results_to_json(results: Dict[str, Any], filename: str = None) -> str:
    """Save results to JSON file."""
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"unified_moodle_scraper_results_{timestamp}.json"
    
    filepath = os.path.join(os.path.dirname(__file__), filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    logger.info(f"💾 Results saved to: {filepath}")
    return filepath

async def main():
    """Main function to run the unified scraper."""
    logger.info("🚀 Starting Unified Moodle Scraper")
    
    scraper = UnifiedMoodleScraper()
    
    # Scrape all courses and their items
    results = await scraper.scrape_all_courses_and_items()
    
    if results:
        # Save to JSON file
        filename = save_results_to_json(results)
        logger.info(f"✅ Successfully completed unified scraping. Saved to: {filename}")
        
        # Print summary
        courses = results.get('courses', [])
        course_items = results.get('course_items', {})
        
        print(f"\n📊 Unified Scraping Summary:")
        print(f"📚 Total Courses: {len(courses)}")
        print(f"📄 Total Items: {sum(len(items) for items in course_items.values())}")
        
        print(f"\n📚 Courses found:")
        for i, course in enumerate(courses, 1):
            print(f"  {i}. {course['name']}")
        
        print(f"\n📄 Items by Course:")
        for course_name, items in course_items.items():
            print(f"  {course_name}: {len(items)} items")
            
            # Count by type
            type_counts = {}
            for item in items:
                item_type = item.get('type', 'unknown')
                type_counts[item_type] = type_counts.get(item_type, 0) + 1
            
            print(f"    Types: {', '.join([f'{t}: {c}' for t, c in type_counts.items()])}")
        
    else:
        logger.error("❌ Failed to complete unified scraping")

if __name__ == "__main__":
    asyncio.run(main()) 