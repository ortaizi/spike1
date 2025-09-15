#!/usr/bin/env python3
"""
תצורה לאוניברסיטה העברית בירושלים
Configuration for Hebrew University of Jerusalem

This module provides configuration for HUJI's Moodle system including:
- URL patterns and endpoints
- Form selectors and authentication
- Rate limiting and timeouts
- Hebrew/RTL support
- Special handling for HUJI's unique system structure
"""

class HUJIConfig:
    """תצורה לאוניברסיטה העברית בירושלים"""

    # URLs למעבר (בסדר עדיפות)
    URLS = [
        "https://moodle.huji.ac.il/local/mydashboard/",       # Primary dashboard
        "https://moodle.huji.ac.il/moodle25/login/index.php", # Legacy Moodle 2.5
        "https://moodle.huji.ac.il/login/index.php",         # Standard login
        "https://moodle.huji.ac.il/auth/shibboleth/",        # Shibboleth SSO
        "https://moodle.huji.ac.il/portal/",                 # Portal entry point
        "https://moodle.huji.ac.il/"                         # Fallback root
    ]

    # סלקטורים לטופס התחברות
    LOGIN_SELECTORS = {
        'username_field': [
            '#username',                        # Standard Moodle username field
            'input[name="username"]',           # Name-based selector
            '#login_username',                  # Alternative ID
            '#user',                           # HUJI-specific user field
            'input[placeholder*="שם משתמש"]',   # Hebrew placeholder
            'input[placeholder*="מזהה"]',       # Hebrew ID placeholder
            'input[placeholder*="ת.ז."]'        # Hebrew ID number placeholder
        ],
        'password_field': [
            '#password',                        # Standard Moodle password field
            'input[name="password"]',           # Name-based selector
            '#login_password',                  # Alternative ID
            '#pass',                           # HUJI-specific password field
            'input[type="password"]',           # Type-based selector
            'input[placeholder*="סיסמ"]'        # Hebrew password placeholder
        ],
        'login_button': [
            '#loginbtn',                        # Standard Moodle login button
            'input[type="submit"]',             # Submit input
            'button[type="submit"]',            # Submit button
            '.btn-primary',                     # Bootstrap primary button
            '.login-button',                    # HUJI login button class
            'form button',                      # Any form button
            'input[value*="התחבר"]',            # Hebrew login text
            'input[value*="כניסה"]'             # Hebrew entry text
        ],
        'sso_button': [
            'a[href*="shibboleth"]',           # Shibboleth SSO link
            'a[href*="saml"]',                 # SAML SSO link
            '.sso-button',                     # SSO button class
            '.huji-sso',                       # HUJI-specific SSO
            'button[data-action="sso"]',       # SSO action button
            'a[href*="portal"]'                # Portal SSO link
        ],
        'login_token': [
            'input[name="logintoken"]',         # Moodle login token
            'input[name="lt"]',                # CAS login ticket
            'input[type="hidden"][name*="token"]'  # Hidden token field
        ],
        'cas_fields': [
            'input[name="execution"]',          # CAS execution parameter
            'input[name="_eventId"]',          # CAS event ID
            'input[name="service"]'            # CAS service parameter
        ]
    }

    # אינדיקטורים להתחברות מוצלחת
    SUCCESS_INDICATORS = [
        '/my/',                             # Moodle dashboard
        '/dashboard/',                      # Alternative dashboard
        '/local/mydashboard/',              # HUJI-specific dashboard
        '/course/view.php',                 # Course page
        '/user/profile.php',                # User profile
        '/portal/student/',                 # Student portal
        'moodle.huji.ac.il/my',            # Full URL pattern
        'moodle.huji.ac.il/local',         # Local modules pattern
        'moodle.huji.ac.il/portal',        # Portal pattern
        '.dashboard-card',                  # Dashboard element
        '#page-my-index',                   # Moodle my page
        '.huji-dashboard',                  # HUJI-specific dashboard
        '.student-portal'                   # Student portal element
    ]

    # סלקטורים לשגיאות
    ERROR_SELECTORS = [
        '.alert-danger',                    # Bootstrap error alert
        '.error',                          # Generic error class
        '#loginerrormessage',              # Moodle login error message
        '.login-error',                    # Login-specific error
        '.errormessage',                   # Moodle error message
        '[role="alert"]',                  # ARIA alert role
        '.alert-error',                    # Alternative error class
        '.notification-error',             # Notification error
        '.cas-error',                      # CAS-specific error
        '.sso-error',                      # SSO-specific error
        '.huji-error',                     # HUJI-specific error class
        '#fm1 .errors'                     # CAS form errors
    ]

    # טקסטים המעידים על שגיאות (עברית ואנגלית)
    ERROR_TEXT_PATTERNS = [
        'invalid',
        'incorrect',
        'wrong',
        'failed',
        'error',
        'denied',
        'unauthorized',
        'שגוי',
        'שגויים',
        'לא נכון',
        'אינו נכון',
        'כישלון',
        'נכשל',
        'שגיאה',
        'לא תקין',
        'לא מורשה',
        'נדחה',
        'אין הרשאה'
    ]

    # הגדרות זמן המתנה (ארוכות יותר עבור האוניברסיטה העברית)
    TIMEOUTS = {
        'page_load': 60000,         # 60 seconds for page load (HUJI can be very slow)
        'network_idle': 30000,      # 30 seconds for network idle
        'element_wait': 20000,      # 20 seconds for element to appear
        'form_submit': 45000,       # 45 seconds for form submission
        'sso_redirect': 90000,      # 90 seconds for SSO redirects
        'cas_redirect': 60000       # 60 seconds for CAS redirects
    }

    # הגדרות דפדפן מותאמות לאוניברסיטה העברית
    BROWSER_CONFIG = {
        'headless': True,
        'slow_mo': 1000,  # Much slower execution for HUJI (1 second delays)
        'locale': 'he-IL',
        'timezone': 'Asia/Jerusalem',
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'viewport': {'width': 1366, 'height': 768},
        'args': [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--lang=he-IL',
            '--accept-lang=he-IL,he,en-US,en',
            '--disable-web-security',      # May be needed for HUJI SSO
            '--disable-features=VizDisplayCompositor',
            '--disable-blink-features=AutomationControlled',  # Avoid detection
            '--user-data-dir=/tmp/huji-chrome-profile'  # Separate profile for HUJI
        ]
    }

    # הגדרות Rate Limiting מחמירות עבור האוניברסיטה העברית
    RATE_LIMITS = {
        'requests_per_minute': 20,      # Much lower than others due to system load
        'concurrent_sessions': 2,       # Only 2 concurrent sessions
        'retry_delay': 120,            # Longer delays between retries (2 minutes)
        'max_retries': 3,              # Standard retry count
        'cooldown_period': 600,        # 10-minute cooldown after rate limit
        'daily_limit': 100             # Maximum requests per day per user
    }

    # תכונות נתמכות באוניברסיטה העברית
    SUPPORTED_FEATURES = [
        'courses',                      # Course information
        'grades'                       # Grade reports (assignments may not be available)
    ]

    # מבנה נתונים ספציפי לאוניברסיטה העברית
    DATA_STRUCTURE = {
        'courses': {
            'id_selector': 'data-courseid, [href*="course/view.php?id="]',
            'name_selector': '.coursename, .course-title, h3 a',
            'url_selector': 'a[href*="course/view.php"]',
            'code_selector': '.course-code, .shortname, .course-id'
        },
        'grades': {
            'table_selector': '.generaltable, .grade-table, .gradestable',
            'row_selector': '.gradeitemheader, .grade-row, tr[class*="grade"]',
            'course_selector': '.course-name, .itemname',
            'grade_selector': '.grade-value, .finalgrade'
        }
    }

    # הגדרות ספציפיות למערכת CAS של האוניברסיטה העברית
    CAS_CONFIG = {
        'service_url_pattern': 'service=',
        'ticket_parameter': 'ticket',
        'login_url_pattern': '/cas/login',
        'logout_url_pattern': '/cas/logout',
        'validate_url_pattern': '/cas/serviceValidate'
    }

class HUJIAuthenticator:
    """מחלקה לאימות האוניברסיטה העברית עם תמיכה ב-CAS ו-SSO"""

    def __init__(self, fast_mode: bool = False):
        self.config = HUJIConfig()
        self.fast_mode = fast_mode

        # Adjust timeouts for fast mode (but keep them relatively long for HUJI)
        if fast_mode:
            for key in self.config.TIMEOUTS:
                self.config.TIMEOUTS[key] = int(self.config.TIMEOUTS[key] * 0.8)

    async def try_multiple_urls(self, page, username: str, password: str) -> dict:
        """ניסיון התחברות עם מספר URLs כולל CAS ו-SSO"""

        for i, url in enumerate(self.config.URLS):
            try:
                print(f"🌐 מנסה URL {i+1}/{len(self.config.URLS)}: {url}")

                # ניווט לURL עם המתנה ארוכה יותר
                response = await page.goto(
                    url,
                    wait_until="domcontentloaded",  # Changed to domcontentloaded for better reliability
                    timeout=self.config.TIMEOUTS['page_load']
                )

                if not response or response.status >= 400:
                    print(f"❌ HTTP {response.status if response else 'No response'} - עובר לURL הבא")
                    continue

                # Wait for additional loading
                try:
                    await page.wait_for_load_state('networkidle', timeout=15000)
                except:
                    print("⚠️ Network idle timeout - continuing anyway")

                # בדוק אם זה דף CAS
                is_cas = await self._check_cas_page(page)

                # בדוק אם זה דף SSO
                is_sso = await self._check_sso_page(page) if not is_cas else False

                if is_cas:
                    print(f"🎫 זוהה דף CAS ב-{url}")
                    login_result = await self._handle_cas_login(page, username, password)
                elif is_sso:
                    print(f"🔐 זוהה דף SSO ב-{url}")
                    login_result = await self._handle_sso_login(page, username, password)
                else:
                    # בדוק אם יש טופס התחברות רגיל
                    has_login_form = await self._check_login_form_exists(page)

                    if not has_login_form:
                        print(f"⚠️ לא נמצא טופס התחברות ב-{url} - עובר לURL הבא")
                        continue

                    print(f"✅ נמצא טופס התחברות רגיל ב-{url}")
                    login_result = await self._attempt_regular_login(page, username, password)

                if login_result['success']:
                    login_result['successful_url'] = url
                    login_result['auth_method'] = 'cas' if is_cas else ('sso' if is_sso else 'regular')
                    return login_result
                else:
                    print(f"❌ התחברות נכשלה ב-{url}: {login_result.get('error', 'Unknown error')}")
                    # אם זו שגיאת credentials, לא כדאי לנסות URLs נוספים
                    if login_result.get('error_type') == 'INVALID_CREDENTIALS':
                        return login_result

            except Exception as e:
                print(f"❌ שגיאה עם {url}: {str(e)}")
                continue

        # אם הגענו לכאן, כל ה-URLs נכשלו
        return {
            'success': False,
            'error': 'NETWORK_ERROR',
            'message_he': 'לא הצלחתי להתחבר לאף אחד מה-URLs של האוניברסיטה העברית',
            'message_en': 'Failed to connect to any HUJI URLs',
            'tested_urls': self.config.URLS
        }

    async def _check_cas_page(self, page) -> bool:
        """בדיקה אם זה דף CAS"""
        try:
            page_url = page.url.lower()
            page_content = await page.content()

            # Check URL for CAS patterns
            cas_url_indicators = ['cas/login', 'cas.huji', 'sso.huji']
            if any(indicator in page_url for indicator in cas_url_indicators):
                return True

            # Check for CAS form fields
            for selector in self.config.LOGIN_SELECTORS['cas_fields']:
                element = await page.query_selector(selector)
                if element:
                    return True

            # Check content for CAS-specific text
            cas_content_indicators = ['cas', 'central authentication', 'אימות מרכזי']
            if any(indicator in page_content.lower() for indicator in cas_content_indicators):
                return True

            return False

        except Exception as e:
            print(f"⚠️ שגיאה בבדיקת CAS: {e}")
            return False

    async def _check_sso_page(self, page) -> bool:
        """בדיקה אם זה דף SSO/Shibboleth"""
        try:
            # Check for SSO indicators
            sso_indicators = [
                'shibboleth',
                'saml',
                'sso',
                'single sign',
                'אימות מאוחד'
            ]

            page_content = await page.content()
            page_url = page.url

            # Check URL for SSO patterns
            if any(indicator in page_url.lower() for indicator in sso_indicators[:3]):
                return True

            # Check page content for SSO patterns
            if any(indicator in page_content.lower() for indicator in sso_indicators):
                return True

            # Check for SSO buttons
            for selector in self.config.LOGIN_SELECTORS['sso_button']:
                element = await page.query_selector(selector)
                if element:
                    return True

            return False

        except Exception as e:
            print(f"⚠️ שגיאה בבדיקת SSO: {e}")
            return False

    async def _handle_cas_login(self, page, username: str, password: str) -> dict:
        """טיפול בהתחברות CAS"""
        try:
            print("🎫 מבצע התחברות CAS...")

            # Handle CAS form - it's essentially a regular login form but with additional hidden fields
            return await self._attempt_regular_login(page, username, password, is_cas=True)

        except Exception as e:
            return {
                'success': False,
                'error': 'CAS_ERROR',
                'error_type': 'CAS_ERROR',
                'message_he': f'שגיאה בהתחברות CAS: {str(e)}',
                'message_en': f'CAS login error: {str(e)}',
                'exception': str(e)
            }

    async def _handle_sso_login(self, page, username: str, password: str) -> dict:
        """טיפול בהתחברות SSO"""
        try:
            print("🔐 מבצע התחברות SSO...")

            # Look for and click SSO button
            sso_clicked = False
            for selector in self.config.LOGIN_SELECTORS['sso_button']:
                try:
                    element = await page.query_selector(selector)
                    if element and await element.is_visible():
                        await element.click()
                        print(f"✅ נלחץ כפתור SSO: {selector}")
                        sso_clicked = True
                        break
                except Exception as e:
                    continue

            if sso_clicked:
                # Wait for SSO redirect
                await page.wait_for_load_state('networkidle', timeout=self.config.TIMEOUTS['sso_redirect'])

            # Now handle the SSO login form (might be on different domain)
            return await self._attempt_regular_login(page, username, password)

        except Exception as e:
            return {
                'success': False,
                'error': 'SSO_ERROR',
                'error_type': 'SSO_ERROR',
                'message_he': f'שגיאה בהתחברות SSO: {str(e)}',
                'message_en': f'SSO login error: {str(e)}',
                'exception': str(e)
            }

    async def _check_login_form_exists(self, page) -> bool:
        """בדיקה אם קיים טופס התחברות בדף"""

        # בדוק אם יש שדה סיסמה (הסימן הכי ברור לטופס התחברות)
        for selector in self.config.LOGIN_SELECTORS['password_field']:
            try:
                element = await page.query_selector(selector)
                if element and await element.is_visible():
                    return True
            except:
                continue

        return False

    async def _attempt_regular_login(self, page, username: str, password: str, is_cas: bool = False) -> dict:
        """ניסיון התחברות רגילה (או CAS)"""

        try:
            # מילוי שדה משתמש
            username_filled = await self._fill_field(
                page,
                self.config.LOGIN_SELECTORS['username_field'],
                username,
                'username'
            )

            if not username_filled:
                return {
                    'success': False,
                    'error': 'FORM_ERROR',
                    'error_type': 'FORM_ERROR',
                    'message_he': 'לא הצלחתי למלא שדה שם משתמש',
                    'message_en': 'Failed to fill username field'
                }

            # מילוי שדה סיסמה
            password_filled = await self._fill_field(
                page,
                self.config.LOGIN_SELECTORS['password_field'],
                password,
                'password'
            )

            if not password_filled:
                return {
                    'success': False,
                    'error': 'FORM_ERROR',
                    'error_type': 'FORM_ERROR',
                    'message_he': 'לא הצלחתי למלא שדה סיסמה',
                    'message_en': 'Failed to fill password field'
                }

            # לחיצה על כפתור התחברות
            login_clicked = await self._click_login_button(page)

            if not login_clicked:
                return {
                    'success': False,
                    'error': 'FORM_ERROR',
                    'error_type': 'FORM_ERROR',
                    'message_he': 'לא הצלחתי ללחוץ על כפתור התחברות',
                    'message_en': 'Failed to click login button'
                }

            # המתנה לתגובת השרת (ארוכה מאוד עבור האוניברסיטה העברית)
            timeout = self.config.TIMEOUTS['cas_redirect'] if is_cas else self.config.TIMEOUTS['form_submit']
            await page.wait_for_load_state('networkidle', timeout=timeout)

            # בדיקת תוצאת ההתחברות
            return await self._check_authentication_result(page, username)

        except Exception as e:
            return {
                'success': False,
                'error': 'AUTHENTICATION_ERROR',
                'error_type': 'AUTHENTICATION_ERROR',
                'message_he': f'שגיאה בתהליך ההתחברות: {str(e)}',
                'message_en': f'Authentication process error: {str(e)}',
                'exception': str(e)
            }

    async def _fill_field(self, page, selectors: list, value: str, field_name: str) -> bool:
        """מילוי שדה עם selectors מרובים"""

        for selector in selectors:
            try:
                element = await page.query_selector(selector)
                if element and await element.is_visible() and await element.is_enabled():
                    # Clear field first
                    await element.click(click_count=3)  # Select all
                    await page.wait_for_timeout(500)   # Wait a bit
                    await element.fill('')  # Clear
                    await page.wait_for_timeout(500)   # Wait a bit
                    await element.fill(value)  # Fill new value

                    print(f"✅ מולא שדה {field_name} עם selector: {selector}")

                    # וודא שהערך נשמר (לא עבור סיסמה)
                    if field_name != 'password':
                        await page.wait_for_timeout(500)
                        current_value = await element.input_value()
                        if current_value == value:
                            return True
                    else:
                        return True  # מניחים שהסיסמה מולאה בהצלחה

            except Exception as e:
                print(f"⚠️ שגיאה עם selector {selector}: {str(e)}")
                continue

        print(f"❌ לא הצלחתי למלא שדה {field_name}")
        return False

    async def _click_login_button(self, page) -> bool:
        """לחיצה על כפתור התחברות"""

        for selector in self.config.LOGIN_SELECTORS['login_button']:
            try:
                element = await page.query_selector(selector)
                if element and await element.is_visible() and await element.is_enabled():
                    # Scroll to element first
                    await element.scroll_into_view_if_needed()
                    await page.wait_for_timeout(1000)  # Wait for scroll
                    await element.click()
                    print(f"✅ נלחץ כפתור התחברות עם selector: {selector}")
                    return True
            except Exception as e:
                print(f"⚠️ שגיאה עם selector {selector}: {str(e)}")
                continue

        # ניסיון fallback עם Enter
        try:
            print("🔄 מנסה להגיש טופס עם Enter...")
            for selector in self.config.LOGIN_SELECTORS['password_field']:
                element = await page.query_selector(selector)
                if element:
                    await element.press('Enter')
                    print("✅ הוגש טופס עם Enter")
                    return True
        except Exception as e:
            print(f"❌ גם Enter נכשל: {str(e)}")

        return False

    async def _check_authentication_result(self, page, username: str) -> dict:
        """בדיקת תוצאת ההתחברות"""

        # Wait a bit for page to settle
        await page.wait_for_timeout(3000)

        current_url = page.url
        print(f"📍 URL אחרי התחברות: {current_url}")

        # בדיקת שגיאות קודם
        error_message = await self._check_for_errors(page)
        if error_message:
            return {
                'success': False,
                'error': 'INVALID_CREDENTIALS',
                'error_type': 'INVALID_CREDENTIALS',
                'message_he': error_message,
                'message_en': 'Invalid username or password',
                'current_url': current_url
            }

        # בדיקת הצלחה לפי URL
        url_success = any(
            indicator in current_url
            for indicator in self.config.SUCCESS_INDICATORS
        )

        if url_success:
            print("✅ התחברות הצליחה - זוהה לפי URL")
            return {
                'success': True,
                'message_he': 'התחברות למערכת האוניברסיטה העברית הצליחה',
                'message_en': 'HUJI system authentication successful',
                'current_url': current_url,
                'username': username
            }

        # בדיקה נוספת - אם עזבנו את דף ההתחברות זה סימן טוב
        if not any(word in current_url.lower() for word in ['login', 'cas', 'auth']):
            print("✅ התחברות הצליחה - עזבנו את דף ההתחברות")
            return {
                'success': True,
                'message_he': 'התחברות למערכת האוניברסיטה העברית הצליחה',
                'message_en': 'HUJI system authentication successful',
                'current_url': current_url,
                'username': username
            }

        # בדיקה לפי אלמנטים בדף
        for indicator in self.config.SUCCESS_INDICATORS:
            if indicator.startswith('.') or indicator.startswith('#'):  # CSS selectors
                try:
                    element = await page.query_selector(indicator)
                    if element:
                        print(f"✅ התחברות הצליחה - נמצא אלמנט: {indicator}")
                        return {
                            'success': True,
                            'message_he': 'התחברות למערכת האוניברסיטה העברית הצליחה',
                            'message_en': 'HUJI system authentication successful',
                            'current_url': current_url,
                            'username': username
                        }
                except:
                    continue

        # אם הגענו לכאן, כנראה לא הצלחנו
        return {
            'success': False,
            'error': 'INVALID_CREDENTIALS',
            'error_type': 'INVALID_CREDENTIALS',
            'message_he': 'שם משתמש או סיסמה שגויים',
            'message_en': 'Invalid username or password',
            'current_url': current_url
        }

    async def _check_for_errors(self, page) -> str:
        """בדיקת הודעות שגיאה בדף"""

        for selector in self.config.ERROR_SELECTORS:
            try:
                element = await page.query_selector(selector)
                if element and await element.is_visible():
                    text = await element.text_content()
                    if text and text.strip():
                        # בדוק אם זה באמת שגיאת התחברות
                        text_lower = text.lower()
                        if any(pattern in text_lower for pattern in self.config.ERROR_TEXT_PATTERNS):
                            print(f"❌ נמצאה שגיאת התחברות: {text}")
                            return text.strip()
            except:
                continue

        return None

# Convenience function for easy usage
async def authenticate_huji_with_fallback(username: str, password: str, fast_mode: bool = False) -> dict:
    """
    פונקציה נוחה לאימות האוניברסיטה העברית עם fallback URLs ותמיכה ב-CAS ו-SSO

    Args:
        username: שם משתמש
        password: סיסמה
        fast_mode: מצב מהיר (פחות timeout)

    Returns:
        dict עם תוצאת האימות
    """
    from playwright.async_api import async_playwright

    authenticator = HUJIAuthenticator(fast_mode=fast_mode)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=authenticator.config.BROWSER_CONFIG['headless'],
            slow_mo=authenticator.config.BROWSER_CONFIG['slow_mo'],
            args=authenticator.config.BROWSER_CONFIG['args']
        )

        context = await browser.new_context(
            locale=authenticator.config.BROWSER_CONFIG['locale'],
            timezone_id=authenticator.config.BROWSER_CONFIG['timezone'],
            user_agent=authenticator.config.BROWSER_CONFIG['user_agent'],
            viewport=authenticator.config.BROWSER_CONFIG['viewport']
        )

        page = await context.new_page()

        try:
            result = await authenticator.try_multiple_urls(page, username, password)
            return result
        finally:
            await browser.close()

if __name__ == "__main__":
    # Test example (don't run with real credentials in production)
    import asyncio

    async def test():
        result = await authenticate_huji_with_fallback("test_user", "test_pass", fast_mode=True)
        print(f"Result: {result}")

    # asyncio.run(test())  # Uncomment to test
    print("✅ HUJI Config loaded successfully")