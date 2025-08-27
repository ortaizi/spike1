#!/usr/bin/env python3
"""
תצורה מעודכנת לאוניברסיטת בן גוריון
מבוססת על בדיקת הדף החדש: https://moodle.bgu.ac.il/moodle/local/mydashboard/
"""

class BGUConfig:
    """תצורה מעודכנת לבן גוריון עם Fallback URLs"""
    
    # URLs למעבר (בסדר עדיפות)
    URLS = [
        "https://moodle.bgu.ac.il/moodle/local/mydashboard/",  # URL חדש עובד
        "https://moodle.bgu.ac.il/moodle/login/index.php",    # Fallback ישן
        "https://moodle.bgu.ac.il/login/index.php",          # Fallback נוסף
        "https://moodle.bgu.ac.il/moodle/",                  # Fallback כללי
        "https://moodle.bgu.ac.il/"                         # Fallback מינימלי
    ]
    
    # סלקטורים שנמצאו בבדיקה האמיתית
    LOGIN_SELECTORS = {
        'username_field': [
            '#login_username',              # נמצא בבדיקה - primary
            'input[name="username"]',       # fallback standard
            '#username',                    # fallback common
            'input[placeholder*="שם משתמש"]' # fallback Hebrew
        ],
        'password_field': [
            '#login_password',              # נמצא בבדיקה - primary  
            'input[name="password"]',       # fallback standard
            '#password',                    # fallback common
            'input[type="password"]'        # fallback generic
        ],
        'login_button': [
            'input[type="submit"]',         # נמצא בבדיקה - primary
            'button[type="submit"]',        # fallback button
            'form button',                  # fallback form button
            '.btn-primary',                 # fallback CSS class
            '#loginbtn'                     # fallback ID
        ],
        'login_token': [
            'input[name="logintoken"]',     # נמצא בבדיקה - hidden field
            'input[type="hidden"][name*="token"]'  # fallback pattern
        ]
    }
    
    # אינדיקטורים להצלחה
    SUCCESS_INDICATORS = [
        '/my/',                             # Moodle standard dashboard
        '/local/mydashboard/',              # BGU specific dashboard  
        '/dashboard/',                      # General dashboard
        '/course/view.php',                 # Course page
        '/user/profile.php',                # User profile
        'moodle.bgu.ac.il/my',             # Full URL pattern
        'moodle.bgu.ac.il/local'           # Full URL pattern
    ]
    
    # אינדיקטורים לשגיאות
    ERROR_SELECTORS = [
        '.alert-danger',                    # Bootstrap error
        '.error',                          # Generic error class
        '#loginerrormessage',              # Moodle specific
        '.alert-error',                    # Alternative error class
        '.login-error',                    # Login specific error
        '[role="alert"]',                  # ARIA alert
        '.errormessage',                   # Another common pattern
        '.loginerrors',                    # Moodle pattern
        '.alert.alert-danger'              # Combined Bootstrap class
    ]
    
    # טקסטים העוצים על שגיאות (עברית ואנגלית)
    ERROR_TEXT_PATTERNS = [
        'invalid',
        'incorrect', 
        'שגוי',
        'שגויים',
        'לא נכון',
        'אינו נכון',
        'כישלון',
        'נכשל'
    ]
    
    # הגדרות timeout
    TIMEOUTS = {
        'page_load': 30000,     # 30 seconds for page load
        'network_idle': 15000,  # 15 seconds for network idle
        'element_wait': 10000,  # 10 seconds for element to appear
        'form_submit': 20000    # 20 seconds for form submission
    }
    
    # הגדרות דפדפן
    BROWSER_CONFIG = {
        'headless': True,
        'slow_mo': 0,  # מהיר
        'locale': 'he-IL',
        'timezone': 'Asia/Jerusalem',
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'viewport': {'width': 1366, 'height': 768},
        'args': [
            '--no-sandbox',
            '--disable-dev-shm-usage', 
            '--disable-gpu',
            '--lang=he-IL',
            '--accept-lang=he-IL,he,en-US,en'
        ]
    }

class BGUAuthenticator:
    """מחלקה לאימות בן גוריון עם fallback URLs"""
    
    def __init__(self, fast_mode: bool = False):
        self.config = BGUConfig()
        self.fast_mode = fast_mode
        
    async def try_multiple_urls(self, page, username: str, password: str) -> dict:
        """ניסיון התחברות עם מספר URLs"""
        
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
                
                # בדוק אם יש שדות התחברות
                has_login_form = await self._check_login_form_exists(page)
                
                if not has_login_form:
                    print(f"⚠️ לא נמצא טופס התחברות ב-{url} - עובר לURL הבא")
                    continue
                
                print(f"✅ נמצא טופס התחברות ב-{url}")
                
                # ניסיון התחברות
                login_result = await self._attempt_login(page, username, password)
                
                if login_result['success']:
                    login_result['successful_url'] = url
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
            'message_he': 'לא הצלחתי להתחבר לאף אחד מה-URLs של בן גוריון',
            'message_en': 'Failed to connect to any BGU URLs',
            'tested_urls': self.config.URLS
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
    
    async def _attempt_login(self, page, username: str, password: str) -> dict:
        """ניסיון התחברות עם טיפול בשגיאות"""
        
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
            
            # המתנה לתגובת השרת
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
                    await element.fill(value)
                    print(f"✅ מולא שדה {field_name} עם selector: {selector}")
                    
                    # וודא שהערך נשמר
                    if field_name != 'password':  # לא בודקים סיסמה מסיבות אבטחה
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
                'message_he': 'התחברות למערכת בן גוריון הצליחה',
                'message_en': 'BGU system authentication successful',
                'current_url': current_url,
                'username': username
            }
        
        # בדיקה נוספת - אם עזבנו את דף ההתחברות זה סימן טוב
        if 'login' not in current_url.lower():
            print("✅ התחברות הצליחה - עזבנו את דף ההתחברות")
            return {
                'success': True,
                'message_he': 'התחברות למערכת בן גוריון הצליחה',
                'message_en': 'BGU system authentication successful', 
                'current_url': current_url,
                'username': username
            }
        
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
async def authenticate_bgu_with_fallback(username: str, password: str, fast_mode: bool = False) -> dict:
    """
    פונקציה נוחה לאימות בן גוריון עם fallback URLs
    
    Args:
        username: שם משתמש
        password: סיסמה
        fast_mode: מצב מהיר (פחות timeout)
    
    Returns:
        dict עם תוצאת האימות
    """
    from playwright.async_api import async_playwright
    
    authenticator = BGUAuthenticator(fast_mode=fast_mode)
    
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
        result = await authenticate_bgu_with_fallback("test_user", "test_pass", fast_mode=True)
        print(f"Result: {result}")
    
    # asyncio.run(test())  # Uncomment to test
    print("✅ BGU Config loaded successfully")