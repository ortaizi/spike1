#!/usr/bin/env python3
"""
תצורה לאוניברסיטת תל אביב
Configuration for Tel Aviv University

This module provides configuration for TAU's Moodle system including:
- URL patterns and endpoints
- Form selectors and authentication
- Rate limiting and timeouts
- Hebrew/RTL support
"""

class TAUConfig:
    """תצורה לאוניברסיטת תל אביב"""

    # URLs למעבר (בסדר עדיפות)
    URLS = [
        "https://moodle.tau.ac.il/local/mydashboard/",       # Primary dashboard
        "https://moodle.tau.ac.il/login/index.php",         # Standard login
        "https://moodle.tau.ac.il/auth/shibboleth/",        # Shibboleth SSO
        "https://moodle.tau.ac.il/moodle/login/",           # Alternative login
        "https://moodle.tau.ac.il/"                         # Fallback root
    ]

    # סלקטורים לטופס התחברות
    LOGIN_SELECTORS = {
        'username_field': [
            '#username',                        # Standard Moodle username field
            'input[name="username"]',           # Name-based selector
            '#login_username',                  # Alternative ID
            'input[placeholder*="שם משתמש"]',   # Hebrew placeholder
            'input[placeholder*="מזהה"]'        # Hebrew ID placeholder
        ],
        'password_field': [
            '#password',                        # Standard Moodle password field
            'input[name="password"]',           # Name-based selector
            '#login_password',                  # Alternative ID
            'input[type="password"]',           # Type-based selector
            'input[placeholder*="סיסמ"]'        # Hebrew password placeholder
        ],
        'login_button': [
            '#loginbtn',                        # Standard Moodle login button
            'input[type="submit"]',             # Submit input
            'button[type="submit"]',            # Submit button
            '.btn-primary',                     # Bootstrap primary button
            'form button',                      # Any form button
            'input[value*="התחבר"]'             # Hebrew login text
        ],
        'sso_button': [
            'a[href*="shibboleth"]',           # Shibboleth SSO link
            '.sso-button',                     # SSO button class
            'a[href*="saml"]',                 # SAML SSO link
            'button[data-action="sso"]'        # SSO action button
        ],
        'login_token': [
            'input[name="logintoken"]',         # Moodle login token
            'input[type="hidden"][name*="token"]'  # Hidden token field
        ]
    }

    # אינדיקטורים להתחברות מוצלחת
    SUCCESS_INDICATORS = [
        '/my/',                             # Moodle dashboard
        '/dashboard/',                      # Alternative dashboard
        '/local/mydashboard/',              # TAU-specific dashboard
        '/course/view.php',                 # Course page
        '/user/profile.php',                # User profile
        'moodle.tau.ac.il/my',             # Full URL pattern
        'moodle.tau.ac.il/local',          # Local modules pattern
        '.dashboard-card',                  # Dashboard element
        '#page-my-index'                    # Moodle my page
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
        '.sso-error'                       # SSO-specific error
    ]

    # טקסטים המעידים על שגיאות (עברית ואנגלית)
    ERROR_TEXT_PATTERNS = [
        'invalid',
        'incorrect',
        'wrong',
        'failed',
        'error',
        'שגוי',
        'שגויים',
        'לא נכון',
        'אינו נכון',
        'כישלון',
        'נכשל',
        'שגיאה',
        'לא תקין'
    ]

    # הגדרות זמן המתנה
    TIMEOUTS = {
        'page_load': 45000,         # 45 seconds for page load (TAU can be slow)
        'network_idle': 20000,      # 20 seconds for network idle
        'element_wait': 15000,      # 15 seconds for element to appear
        'form_submit': 30000,       # 30 seconds for form submission
        'sso_redirect': 60000       # 60 seconds for SSO redirects
    }

    # הגדרות דפדפן מותאמות לתל אביב
    BROWSER_CONFIG = {
        'headless': True,
        'slow_mo': 500,  # Slower execution for TAU (500ms delays)
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
            '--disable-web-security',      # May be needed for TAU SSO
            '--disable-features=VizDisplayCompositor'
        ]
    }

    # הגדרות Rate Limiting מותאמות לתל אביב
    RATE_LIMITS = {
        'requests_per_minute': 25,      # Lower than BGU due to slower systems
        'concurrent_sessions': 3,       # Fewer concurrent sessions
        'retry_delay': 90,             # Longer delays between retries
        'max_retries': 3,              # Standard retry count
        'cooldown_period': 300         # 5-minute cooldown after rate limit
    }

    # תכונות נתמכות בתל אביב
    SUPPORTED_FEATURES = [
        'courses',                      # Course information
        'grades',                      # Grade reports
        'assignments',                 # Assignment information
        'calendar'                     # Academic calendar (if available)
    ]

    # מבנה נתונים ספציפי לתל אביב
    DATA_STRUCTURE = {
        'courses': {
            'id_selector': 'data-courseid',
            'name_selector': '.coursename, .course-title',
            'url_selector': 'a[href*="course/view.php"]',
            'code_selector': '.course-code, .shortname'
        },
        'grades': {
            'table_selector': '.generaltable, .grade-table',
            'row_selector': '.gradeitemheader, .grade-row',
            'course_selector': '.course-name',
            'grade_selector': '.grade-value'
        },
        'assignments': {
            'container_selector': '.activity[data-type="assign"]',
            'title_selector': '.activityname',
            'due_date_selector': '.due-date, .duedate',
            'status_selector': '.submission-status'
        }
    }

class TAUAuthenticator:
    """מחלקה לאימות תל אביב עם תמיכה ב-SSO"""

    def __init__(self, fast_mode: bool = False):
        self.config = TAUConfig()
        self.fast_mode = fast_mode

        # Adjust timeouts for fast mode
        if fast_mode:
            for key in self.config.TIMEOUTS:
                self.config.TIMEOUTS[key] = int(self.config.TIMEOUTS[key] * 0.7)

    async def try_multiple_urls(self, page, username: str, password: str) -> dict:
        """ניסיון התחברות עם מספר URLs כולל SSO"""

        for i, url in enumerate(self.config.URLS):
            try:
                print(f"🌐 מנסה URL {i+1}/{len(self.config.URLS)}: {url}")

                # ניווט לURL
                response = await page.goto(
                    url,
                    wait_until="networkidle",
                    timeout=self.config.TIMEOUTS['page_load']
                )

                if not response or response.status >= 400:
                    print(f"❌ HTTP {response.status if response else 'No response'} - עובר לURL הבא")
                    continue

                # בדוק אם זה דף SSO
                is_sso = await self._check_sso_page(page)

                if is_sso:
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
                    login_result['auth_method'] = 'sso' if is_sso else 'regular'
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
            'message_he': 'לא הצלחתי להתחבר לאף אחד מה-URLs של תל אביב',
            'message_en': 'Failed to connect to any TAU URLs',
            'tested_urls': self.config.URLS
        }

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

    async def _attempt_regular_login(self, page, username: str, password: str) -> dict:
        """ניסיון התחברות רגילה"""

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

            # המתנה לתגובת השרת (ארוכה יותר עבור תל אביב)
            await page.wait_for_load_state(
                'networkidle',
                timeout=self.config.TIMEOUTS['form_submit']
            )

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
                    await element.fill('')  # Clear
                    await element.fill(value)  # Fill new value

                    print(f"✅ מולא שדה {field_name} עם selector: {selector}")

                    # וודא שהערך נשמר (לא עבור סיסמה)
                    if field_name != 'password':
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
                'message_he': 'התחברות למערכת תל אביב הצליחה',
                'message_en': 'TAU system authentication successful',
                'current_url': current_url,
                'username': username
            }

        # בדיקה נוספת - אם עזבנו את דף ההתחברות זה סימן טוב
        if 'login' not in current_url.lower():
            print("✅ התחברות הצליחה - עזבנו את דף ההתחברות")
            return {
                'success': True,
                'message_he': 'התחברות למערכת תל אביב הצליחה',
                'message_en': 'TAU system authentication successful',
                'current_url': current_url,
                'username': username
            }

        # בדיקה לפי אלמנטים בדף
        for indicator in self.config.SUCCESS_INDICATORS[-2:]:  # Check element selectors
            try:
                element = await page.query_selector(indicator)
                if element:
                    print(f"✅ התחברות הצליחה - נמצא אלמנט: {indicator}")
                    return {
                        'success': True,
                        'message_he': 'התחברות למערכת תל אביב הצליחה',
                        'message_en': 'TAU system authentication successful',
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
async def authenticate_tau_with_fallback(username: str, password: str, fast_mode: bool = False) -> dict:
    """
    פונקציה נוחה לאימות תל אביב עם fallback URLs ותמיכה ב-SSO

    Args:
        username: שם משתמש
        password: סיסמה
        fast_mode: מצב מהיר (פחות timeout)

    Returns:
        dict עם תוצאת האימות
    """
    from playwright.async_api import async_playwright

    authenticator = TAUAuthenticator(fast_mode=fast_mode)

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
        result = await authenticate_tau_with_fallback("test_user", "test_pass", fast_mode=True)
        print(f"Result: {result}")

    # asyncio.run(test())  # Uncomment to test
    print("✅ TAU Config loaded successfully")