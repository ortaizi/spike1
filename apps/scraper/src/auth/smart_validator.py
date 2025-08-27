# -*- coding: utf-8 -*-
"""
Smart Moodle Authentication Validator
מאמת פרטי התחברות אמיתיים כנגד מערכות האוניברסיטה

This module provides smart authentication that:
1. Clears existing sessions completely
2. Performs real authentication against university systems  
3. Returns detailed validation results
4. Supports Hebrew content and error messages
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

import aiohttp
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, Browser, Page, BrowserContext

# Configure logging for Hebrew support
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AuthenticationResult(Enum):
    """תוצאות אימות"""
    SUCCESS = "success"
    INVALID_CREDENTIALS = "invalid_credentials"
    NETWORK_ERROR = "network_error"
    TIMEOUT = "timeout"
    CAPTCHA_REQUIRED = "captcha_required"
    ACCOUNT_LOCKED = "account_locked"
    MAINTENANCE = "maintenance"
    UNKNOWN_ERROR = "unknown_error"

@dataclass
class ValidationResult:
    """תוצאת אימות פרטי התחברות"""
    success: bool
    result: AuthenticationResult
    message_he: str  # הודעה בעברית
    message_en: str  # הודעה באנגלית
    university: str
    username: str
    response_time_ms: int
    session_data: Optional[Dict[str, Any]] = None
    error_details: Optional[str] = None

class UniversityConfig:
    """תצורת אוניברסיטה"""
    
    BGU = {
        'id': 'bgu',
        'name': 'אוניברסיטת בן-גוריון בנגב',
        'moodle_url': 'https://moodle.bgu.ac.il',
        'login_path': '/moodle/local/mydashboard/',
        'dashboard_indicators': [
            'dashboard',
            'my',
            'course',
            'grades',
            'profile'
        ],
        'login_form_selectors': {
            'username_field': '#login_username',   # Updated from analysis
            'password_field': '#login_password',   # Updated from analysis  
            'login_button': 'input[type="submit"]', # Updated from analysis
            'form': '#login'
        },
        'error_selectors': [
            '.login-error',
            '.alert-danger',
            '#loginerrormsg',
            '.error'
        ],
        'success_indicators': [
            '.dashboard',
            '#page-my-index',
            '.my-courses',
            'nav[aria-label="Site"]'
        ]
    }
    
    # Additional universities can be added here
    SUPPORTED_UNIVERSITIES = {
        'bgu': BGU
    }

class SmartMoodleValidator:
    """מאמת חכם למערכות מודל"""
    
    def __init__(self, university: str = 'bgu', headless: bool = True, timeout: int = 30000):
        """
        אתחול המאמת החכם
        
        Args:
            university: מזהה האוניברסיטה (כרגע רק 'bgu')
            headless: האם להריץ בדפדפן נסתר
            timeout: timeout בשלב הרשת (במילישניות)
        """
        self.university = university
        self.headless = headless
        self.timeout = timeout
        self.config = UniversityConfig.SUPPORTED_UNIVERSITIES.get(university)
        
        if not self.config:
            raise ValueError(f"אוניברסיטה לא נתמכת: {university}")
            
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        
        logger.info(f"🎓 Smart Validator initialized for {self.config['name']}")

    async def __aenter__(self):
        """Context manager entry"""
        await self._init_browser()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        await self._cleanup()

    async def _init_browser(self) -> None:
        """אתחול דפדפן עם תצורה מותאמת לעברית"""
        try:
            playwright = await async_playwright().start()
            
            # Launch browser with Hebrew support
            self.browser = await playwright.chromium.launch(
                headless=self.headless,
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--lang=he-IL',
                    '--accept-lang=he-IL,he,en-US,en'
                ]
            )
            
            # Create context with Hebrew locale
            self.context = await self.browser.new_context(
                locale='he-IL',
                timezone_id='Asia/Jerusalem',
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1366, 'height': 768}
            )
            
            # Create new page
            self.page = await self.context.new_page()
            
            # Set default timeout
            self.page.set_default_timeout(self.timeout)
            
            logger.info("🌐 Browser initialized with Hebrew support")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize browser: {e}")
            raise

    async def _cleanup(self) -> None:
        """ניקוי משאבי דפדפן"""
        try:
            if self.page:
                await self.page.close()
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
                
            logger.info("🧹 Browser cleanup completed")
            
        except Exception as e:
            logger.warning(f"⚠️ Error during cleanup: {e}")

    async def clear_session(self) -> None:
        """ניקוי מוחלט של session וכל ה-cookies"""
        try:
            if not self.context:
                return
                
            # Clear all cookies
            await self.context.clear_cookies()
            
            # Clear storage
            await self.page.evaluate("""
                () => {
                    // Clear all storage
                    if (window.localStorage) localStorage.clear();
                    if (window.sessionStorage) sessionStorage.clear();
                    
                    // Clear any remaining cookies via document
                    document.cookie.split(";").forEach(cookie => {
                        const eqPos = cookie.indexOf("=");
                        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
                        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.bgu.ac.il;";
                    });
                }
            """)
            
            logger.info("🧽 Session and cookies cleared completely")
            
        except Exception as e:
            logger.warning(f"⚠️ Error clearing session: {e}")

    async def validate_credentials(self, username: str, password: str) -> ValidationResult:
        """
        מבצע אימות אמיתי של פרטי התחברות כנגד מערכת האוניברסיטה
        
        Args:
            username: שם משתמש
            password: סיסמה
            
        Returns:
            ValidationResult עם פרטי התוצאה
        """
        start_time = time.time()
        
        try:
            logger.info(f"🔐 Starting credential validation for user: {username}")
            
            # יצירת מופע דפדפן אם לא קיים
            if not self.browser:
                await self._init_browser()
            
            # ניקוי session קיים
            await self.clear_session()
            
            # ביצוע התחברות אמיתית
            result = await self._perform_real_login(username, password)
            
            # חישוב זמן תגובה
            response_time = int((time.time() - start_time) * 1000)
            result.response_time_ms = response_time
            
            logger.info(f"✅ Validation completed in {response_time}ms - Result: {result.result.value}")
            return result
            
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            logger.error(f"❌ Validation failed after {response_time}ms: {e}")
            
            return ValidationResult(
                success=False,
                result=AuthenticationResult.UNKNOWN_ERROR,
                message_he=f"שגיאה במערכת: {str(e)}",
                message_en=f"System error: {str(e)}",
                university=self.university,
                username=username,
                response_time_ms=response_time,
                error_details=str(e)
            )

    async def _perform_real_login(self, username: str, password: str) -> ValidationResult:
        """ביצוע התחברות אמיתית למערכת מודל"""
        try:
            login_url = f"{self.config['moodle_url']}{self.config['login_path']}"
            logger.info(f"🌐 Navigating to login page: {login_url}")
            
            # מעבר לעמוד ההתחברות
            response = await self.page.goto(login_url, wait_until='domcontentloaded')
            
            if not response or not response.ok:
                return ValidationResult(
                    success=False,
                    result=AuthenticationResult.NETWORK_ERROR,
                    message_he="שגיאה בגישה למערכת האוניברסיטה",
                    message_en="Failed to access university system",
                    university=self.university,
                    username=username,
                    response_time_ms=0
                )
            
            # המתנה לטעינת הדף
            await self.page.wait_for_load_state('networkidle', timeout=10000)
            
            # בדיקה אם הדף במצב תחזוקה
            page_content = await self.page.content()
            if any(word in page_content.lower() for word in ['maintenance', 'תחזוקה', 'זמנית לא זמין']):
                return ValidationResult(
                    success=False,
                    result=AuthenticationResult.MAINTENANCE,
                    message_he="המערכת במצב תחזוקה כעת",
                    message_en="System is under maintenance",
                    university=self.university,
                    username=username,
                    response_time_ms=0
                )
            
            # מילוי טופס ההתחברות
            await self._fill_login_form(username, password)
            
            # בדיקת תוצאת ההתחברות
            return await self._check_login_result(username)
            
        except Exception as e:
            logger.error(f"❌ Login process failed: {e}")
            
            if "timeout" in str(e).lower():
                return ValidationResult(
                    success=False,
                    result=AuthenticationResult.TIMEOUT,
                    message_he="פג זמן החיבור למערכת האוניברסיטה",
                    message_en="Connection to university system timed out",
                    university=self.university,
                    username=username,
                    response_time_ms=0,
                    error_details=str(e)
                )
            
            raise

    async def _fill_login_form(self, username: str, password: str) -> None:
        """מילוי טופס ההתחברות"""
        try:
            selectors = self.config['login_form_selectors']
            
            # המתנה לטעינת טופס ההתחברות
            await self.page.wait_for_selector(selectors['username_field'], timeout=10000)
            
            # מילוי שם משתמש
            await self.page.fill(selectors['username_field'], username)
            logger.info(f"📝 Username filled: {username}")
            
            # מילוי סיסמה
            await self.page.fill(selectors['password_field'], password)
            logger.info("🔑 Password filled")
            
            # לחיצה על כפתור התחברות
            await self.page.click(selectors['login_button'])
            logger.info("👆 Login button clicked")
            
            # המתנה לתגובת השרת
            await self.page.wait_for_load_state('networkidle', timeout=15000)
            
        except Exception as e:
            logger.error(f"❌ Failed to fill login form: {e}")
            raise

    async def _check_login_result(self, username: str) -> ValidationResult:
        """בדיקת תוצאת ההתחברות"""
        try:
            current_url = self.page.url
            page_content = await self.page.content()
            
            logger.info(f"🔍 Checking login result. Current URL: {current_url}")
            
            # בדיקה לשגיאות התחברות
            error_message = await self._check_for_errors()
            if error_message:
                return ValidationResult(
                    success=False,
                    result=AuthenticationResult.INVALID_CREDENTIALS,
                    message_he=error_message,
                    message_en="Invalid username or password",
                    university=self.university,
                    username=username,
                    response_time_ms=0
                )
            
            # בדיקה להתחברות מוצלחת
            success_indicators = self.config['success_indicators']
            login_successful = False
            
            # בדיקת URL - אם לא נשארנו בעמוד ההתחברות
            if 'login' not in current_url.lower():
                login_successful = True
                logger.info("✅ Login successful - URL changed from login page")
            
            # בדיקת אינדיקטורים בתוכן הדף
            if not login_successful:
                for indicator in success_indicators:
                    try:
                        element = await self.page.wait_for_selector(indicator, timeout=3000)
                        if element:
                            login_successful = True
                            logger.info(f"✅ Login successful - Found success indicator: {indicator}")
                            break
                    except:
                        continue
            
            # בדיקת תוכן הדף להוכחות נוספות
            if not login_successful:
                dashboard_keywords = ['dashboard', 'my courses', 'הקורסים שלי', 'לוח המחוונים']
                if any(keyword in page_content.lower() for keyword in dashboard_keywords):
                    login_successful = True
                    logger.info("✅ Login successful - Found dashboard keywords")
            
            if login_successful:
                # איסוף מידע נוסף על ה-session
                session_data = await self._extract_session_data()
                
                return ValidationResult(
                    success=True,
                    result=AuthenticationResult.SUCCESS,
                    message_he="התחברות למערכת האוניברסיטה הצליחה",
                    message_en="Successfully authenticated with university system",
                    university=self.university,
                    username=username,
                    response_time_ms=0,
                    session_data=session_data
                )
            else:
                return ValidationResult(
                    success=False,
                    result=AuthenticationResult.INVALID_CREDENTIALS,
                    message_he="שם משתמש או סיסמה שגויים",
                    message_en="Invalid username or password",
                    university=self.university,
                    username=username,
                    response_time_ms=0
                )
                
        except Exception as e:
            logger.error(f"❌ Error checking login result: {e}")
            return ValidationResult(
                success=False,
                result=AuthenticationResult.UNKNOWN_ERROR,
                message_he=f"שגיאה בבדיקת תוצאת ההתחברות: {str(e)}",
                message_en=f"Error checking login result: {str(e)}",
                university=self.university,
                username=username,
                response_time_ms=0,
                error_details=str(e)
            )

    async def _check_for_errors(self) -> Optional[str]:
        """בדיקה לשגיאות התחברות"""
        try:
            error_selectors = self.config['error_selectors']
            
            for selector in error_selectors:
                try:
                    error_element = await self.page.wait_for_selector(selector, timeout=2000)
                    if error_element:
                        error_text = await error_element.text_content()
                        if error_text and error_text.strip():
                            logger.warning(f"⚠️ Found error message: {error_text}")
                            
                            # תרגום שגיאות נפוצות לעברית
                            if 'invalid' in error_text.lower() or 'incorrect' in error_text.lower():
                                return "שם משתמש או סיסמה אינם נכונים"
                            elif 'locked' in error_text.lower() or 'suspended' in error_text.lower():
                                return "החשבון נחסם או מושעה"
                            elif 'captcha' in error_text.lower():
                                return "נדרש אימות קפצ'ה"
                            else:
                                return error_text.strip()
                except:
                    continue
            
            return None
            
        except Exception as e:
            logger.warning(f"⚠️ Error checking for login errors: {e}")
            return None

    async def _extract_session_data(self) -> Dict[str, Any]:
        """חילוץ מידע על ה-session לאחר התחברות מוצלחת"""
        try:
            session_data = {
                'url': self.page.url,
                'title': await self.page.title(),
                'cookies_count': len(await self.context.cookies()),
                'timestamp': int(time.time())
            }
            
            # ניסיון לחילוץ שם המשתמש מהדף
            try:
                user_info = await self.page.evaluate("""
                    () => {
                        // חיפוש שם משתמש באלמנטים שונים
                        const userSelectors = [
                            '.username', '.user-name', '.user-info', 
                            '[data-username]', '#user-menu', '.user-menu',
                            '.navbar-text', '.user-profile'
                        ];
                        
                        for (const selector of userSelectors) {
                            const element = document.querySelector(selector);
                            if (element && element.textContent.trim()) {
                                return element.textContent.trim();
                            }
                        }
                        
                        return null;
                    }
                """)
                
                if user_info:
                    session_data['user_display_name'] = user_info
                    
            except Exception as e:
                logger.warning(f"⚠️ Could not extract user info: {e}")
            
            return session_data
            
        except Exception as e:
            logger.warning(f"⚠️ Error extracting session data: {e}")
            return {'timestamp': int(time.time())}

# Convenience functions for API usage

async def validate_bgu_credentials(username: str, password: str, headless: bool = True) -> ValidationResult:
    """
    פונקציה נוחה לאימות פרטי התחברות לבן-גוריון
    
    Args:
        username: שם משתמש
        password: סיסמה  
        headless: האם להריץ בדפדפן נסתר
        
    Returns:
        ValidationResult
    """
    async with SmartMoodleValidator('bgu', headless=headless) as validator:
        return await validator.validate_credentials(username, password)

async def test_credentials_batch(credentials_list: List[Tuple[str, str]], university: str = 'bgu') -> List[ValidationResult]:
    """
    בדיקת אצווה של פרטי התחברות
    
    Args:
        credentials_list: רשימת טיפלים של (שם משתמש, סיסמה)
        university: מזהה האוניברסיטה
        
    Returns:
        רשימת ValidationResult
    """
    results = []
    
    async with SmartMoodleValidator(university, headless=True) as validator:
        for username, password in credentials_list:
            result = await validator.validate_credentials(username, password)
            results.append(result)
            
            # המתנה קצרה בין בדיקות למניעת חסימה
            await asyncio.sleep(1)
    
    return results

# Example usage and testing
if __name__ == "__main__":
    async def main():
        """דוגמת שימוש"""
        # Test with sample credentials (replace with real ones for testing)
        test_username = "test_user"  
        test_password = "test_password"
        
        print("🚀 Starting Smart Moodle Validator test...")
        
        # Test single credential validation
        result = await validate_bgu_credentials(test_username, test_password)
        
        print(f"📊 Validation Result:")
        print(f"   Success: {result.success}")
        print(f"   Result: {result.result.value}")
        print(f"   Hebrew Message: {result.message_he}")
        print(f"   English Message: {result.message_en}")
        print(f"   Response Time: {result.response_time_ms}ms")
        
        if result.session_data:
            print(f"   Session Data: {result.session_data}")
        
        if result.error_details:
            print(f"   Error Details: {result.error_details}")
    
    # Run the test
    asyncio.run(main())