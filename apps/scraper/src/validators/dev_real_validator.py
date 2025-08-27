#!/usr/bin/env python3
"""
מאמת אמיתי לסביבת פיתוח - פשוט אבל יעיל
אימות אמיתי כנגד מערכות האוניברסיטה (לא סימולציה!)
"""
import asyncio
import json
import sys
from playwright.async_api import async_playwright
import argparse
import time

print("🚨 DEBUG: קובץ dev_real_validator.py רץ עכשיו!")
print(f"🚨 DEBUG: נתיב קובץ: {__file__}")

class DevMoodleValidator:
    """
    מאמת אמיתי לסביבת פיתוח - פשוט אבל יעיל
    """
    
    def __init__(self):
        self.configs = {
            'bgu': {
                'login_url': 'https://moodle.bgu.ac.il/moodle/local/mydashboard/',
                'username_field': '#login_username',
                'password_field': '#login_password', 
                'login_button': 'input[type="submit"]',
                'success_indicators': [
                    '/my/', '/local/mydashboard/', '/dashboard/',
                    'moodle.bgu.ac.il/my', 'moodle.bgu.ac.il/local',
                    '/course/view.php', '/user/profile.php'
                ],
                'error_indicators': [
                    '.alert-danger', '.error', '#loginerrormessage',
                    '.alert-error', '.login-error', '[role="alert"]',
                    '.errormessage', '.loginerrors', '.alert.alert-danger'
                ],
                'alternative_selectors': {
                    'username_field': [
                        '#login_username',          # Primary selector מהבדיקה
                        'input[name="username"]',   # Fallback selector
                        '#username',                # Additional fallback
                        'input[placeholder*="שם משתמש"]'
                    ],
                    'password_field': [
                        '#login_password',          # Primary selector מהבדיקה
                        'input[name="password"]',   # Fallback selector
                        '#password',                # Additional fallback
                        'input[placeholder*="סיסמה"]'
                    ],
                    'login_button': [
                        'input[type="submit"]',     # Primary - מצאנו 3 כפתורי submit
                        'button[type="submit"]',    # Alternative
                        '.btn-primary',             # CSS class fallback
                        '#loginbtn'                 # ID fallback
                    ]
                }
            }
        }
    
    async def validate(self, university: str, username: str, password: str, fast_mode: bool = False) -> dict:
        """
        ביצוע אימות אמיתי - לא סימולציה!
        """
        from datetime import datetime
        print("🚨 DEBUG: הסקרייפר החדש רץ!")
        print(f"🚨 DEBUG: URL שאני משתמש בו: https://moodle.bgu.ac.il/moodle/local/mydashboard/")
        print(f"🚨 DEBUG: תאריך הקובץ: {datetime.now()}")
        print("🚨 DEBUG: קובץ זה רץ עכשיו!")
        print(f"🚨 DEBUG: נתיב קובץ: {__file__}")
        print(f"🚨 DEBUG: פונקציית validate נקראת עם university={university}")
        print(f"🚨 DEBUG: URL שאני משתמש בו: {self.configs.get(university, {}).get('login_url', 'לא נמצא')}")
        
        start_time = time.time()
        
        if university not in self.configs:
            return {
                'success': False,
                'error': 'UNSUPPORTED_UNIVERSITY',
                'message': f'אוניברסיטה {university} לא נתמכת'
            }
        
        config = self.configs[university]
        
        async with async_playwright() as p:
            # הפעלת דפדפן (מופטם לmfast-mode)
            browser = await p.chromium.launch(
                headless=True,
                slow_mo=50 if not fast_mode else 0,  # מהיר יותר ב-fast mode
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--disable-background-timer-throttling',
                    '--disable-renderer-backgrounding',
                    '--disable-backgrounding-occluded-windows'
                ] if fast_mode else []
            )
            
            try:
                context = await browser.new_context(
                    locale='he-IL',
                    timezone_id='Asia/Jerusalem',
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )
                
                page = await context.new_page()
                
                # ניקוי session - וודא שזה אימות אמיתי
                await context.clear_cookies()
                print(f"🧹 ניקוי session עבור {username}")
                
                # ניווט לעמוד התחברות (מותאם למצב מהיר)
                timeout = 10000 if fast_mode else 15000
                print(f"🌐 ניווט ל-{config['login_url']} (fast-mode: {fast_mode})")
                await page.goto(config['login_url'])
                await page.wait_for_load_state('networkidle', timeout=timeout)
                
                # בדוק מה קרה אחרי הניווט
                current_url = page.url
                page_title = await page.title()
                print(f"📍 URL אחרי ניווט: {current_url}")
                print(f"📄 כותרת הדף: {page_title}")
                
                # בדוק אם יש שדות התחברות בדף
                username_field = await page.query_selector("#login_username")
                password_field = await page.query_selector("#login_password")
                submit_button = await page.query_selector("input[type='submit']")
                
                print(f"🔍 בדיקת שדות בדף:")
                print(f"  - שדה משתמש: {'✅' if username_field else '❌'}")
                print(f"  - שדה סיסמה: {'✅' if password_field else '❌'}")
                print(f"  - כפתור שליחה: {'✅' if submit_button else '❌'}")
                
                # מילוי פרטי התחברות עם נסיונות מרובים
                print(f"✍️ מזין שם משתמש: {username}")
                print(f"🔍 מחפש שדה משתמש עם סלקטור: {config['username_field']}")
                username_filled = await self._try_fill_field(page, config, 'username_field', username)
                
                print("🔒 מזין סיסמה")
                print(f"🔍 מחפש שדה סיסמה עם סלקטור: {config['password_field']}")
                password_filled = await self._try_fill_field(page, config, 'password_field', password)
                
                if not username_filled or not password_filled:
                    raise Exception("לא הצלחתי למלא את פרטי ההתחברות - אולי הדף השתנה")
                
                # התחברות עם נסיונות מרובים
                print("🚀 לוחץ על התחבר")
                login_clicked = await self._try_click_button(page, config, 'login_button')
                
                if not login_clicked:
                    raise Exception("לא הצלחתי למצוא את כפתור ההתחברות")
                
                # המתן לתגובה (מהיר יותר ב-fast mode)
                print("⏳ מחכה לתגובה מהשרת...")
                await page.wait_for_load_state('networkidle', timeout=timeout)
                
                current_url = page.url
                print(f"📍 URL אחרי התחברות: {current_url}")
                
                # בדיקת הצלחה מעמיקה יותר
                print(f"🔍 מנתח את התגובה...")
                
                # בדוק אם נשארנו באותו URL (אינדיקטור לכישלון)
                if current_url == config['login_url']:
                    print("⚠️ נשארנו בדף ההתחברות - כנראה כישלון")
                elif 'login' in current_url.lower():
                    print("⚠️ עדיין ב-URL שמכיל 'login' - כנראה כישלון")
                else:
                    print("✅ עברנו מדף ההתחברות - סימן טוב!")
                
                # בדיקת אינדיקטורים מרובים
                print(f"🎯 בודק אינדיקטורי הצלחה: {config['success_indicators']}")
                url_success = any(indicator in current_url for indicator in config['success_indicators'])
                print(f"📊 תוצאת בדיקת URL: {url_success}")
                
                # בדיקות נוספות לוודא הצלחה
                page_title = await page.title()
                page_content = await page.content()
                
                print(f"📄 כותרת הדף: {page_title}")
                
                # בדיקת אלמנטים מציינים הצלחה
                success_elements = [
                    '.dashboard', '.profile', '.user-info', 
                    '[class*="dashboard"]', '[class*="profile"]',
                    'h1:has-text("לוח בקרה")', 'h1:has-text("Dashboard")'
                ]
                
                element_success = False
                for selector in success_elements:
                    try:
                        element = await page.query_selector(selector)
                        if element:
                            element_success = True
                            print(f"✅ נמצא אלמנט מצליח: {selector}")
                            break
                    except:
                        continue
                
                # בדיקת שגיאות מפורשות
                has_login_error = False
                error_selectors = config.get('error_indicators', []) + [
                    '[class*="error"]', '[class*="alert"]', '.login-error',
                    'text="Invalid"', 'text="שגוי"', 'text="כישלון"'
                ]
                
                for selector in error_selectors:
                    try:
                        element = await page.query_selector(selector)
                        if element:
                            error_text = await element.text_content()
                            if error_text and error_text.strip():
                                has_login_error = True
                                print(f"❌ נמצאה שגיאת התחברות: {error_text}")
                                break
                    except:
                        continue
                
                is_success = (url_success or element_success) and not has_login_error
                response_time_ms = int((time.time() - start_time) * 1000)
                
                print(f"🎯 תוצאת בדיקה: URL={url_success}, Elements={element_success}, HasError={has_login_error}, Final={is_success}")
                
                if is_success:
                    print("✅ התחברות הצליחה!")
                    user_data = await self._extract_basic_user_data(page)
                    
                    return {
                        'success': True,
                        'result': 'success',
                        'message_he': 'התחברות למודל בוצעה בהצלחה',
                        'message_en': 'Moodle authentication successful',
                        'university': university,
                        'username': username,
                        'response_time_ms': response_time_ms,
                        'user_data': user_data,
                        'session_data': {
                            'validated_url': current_url,
                            'timestamp': int(time.time())
                        }
                    }
                else:
                    print("❌ התחברות נכשלה")
                    error_msg = await self._get_error_message(page, config)
                    
                    return {
                        'success': False,
                        'result': 'invalid_credentials',
                        'error': 'INVALID_CREDENTIALS',
                        'message_he': error_msg or 'שם משתמש או סיסמה שגויים',
                        'message_en': 'Invalid username or password',
                        'university': university,
                        'username': username,
                        'response_time_ms': response_time_ms,
                        'error_details': {
                            'current_url': current_url,
                            'error_message': error_msg
                        }
                    }
                    
            except Exception as e:
                print(f"💥 שגיאה: {str(e)}")
                response_time_ms = int((time.time() - start_time) * 1000)
                return {
                    'success': False,
                    'result': 'validation_error',
                    'error': 'VALIDATION_ERROR',
                    'message_he': f'שגיאה באימות: {str(e)}',
                    'message_en': f'Validation error: {str(e)}',
                    'university': university,
                    'username': username,
                    'response_time_ms': response_time_ms,
                    'error_details': {
                        'exception': str(e),
                        'type': type(e).__name__
                    }
                }
            finally:
                await browser.close()
    
    async def _extract_basic_user_data(self, page) -> dict:
        """חילוץ נתוני משתמש בסיסיים"""
        try:
            # נסה למצוא שם משתמש
            name_selectors = ['.usertext', '.profile-field-content', '.user-name', 'h1', '.userpicture']
            name = ''
            
            for selector in name_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        text = await element.text_content()
                        if text and len(text.strip()) > 0:
                            name = text.strip()
                            break
                except:
                    continue
            
            return {
                'name': name,
                'validated_at': int(time.time()),
                'url': page.url
            }
        except:
            return {}
    
    async def _try_fill_field(self, page, config, field_key: str, value: str) -> bool:
        """נסיון מילוי שדה עם selector חלופיים - מעודכן עם לוגים מפורטים"""
        print(f"🔍 מנסה למלא שדה: {field_key}")
        
        selectors = [config[field_key]]  # הסלקטור הבסיסי
        
        # הוספת סלקטורים חלופיים אם קיימים
        if 'alternative_selectors' in config and field_key in config['alternative_selectors']:
            selectors.extend(config['alternative_selectors'][field_key])
        
        print(f"🎯 סלקטורים לבדיקה עבור {field_key}: {selectors}")
        
        for i, selector in enumerate(selectors):
            try:
                print(f"  🔍 בודק סלקטור {i+1}/{len(selectors)}: {selector}")
                element = await page.query_selector(selector)
                
                if element:
                    # בדוק אם האלמנט נראה
                    is_visible = await element.is_visible()
                    is_enabled = await element.is_enabled()
                    print(f"    📍 נמצא אלמנט - נראה: {is_visible}, פעיל: {is_enabled}")
                    
                    if is_visible and is_enabled:
                        await element.fill(value)
                        print(f"    ✅ מולא שדה {field_key} בהצלחה עם סלקטור: {selector}")
                        
                        # וודא שהערך נכנס
                        current_value = await element.input_value()
                        if current_value == value:
                            print(f"    ✔️ אימות: הערך נשמר בהצלחה")
                            return True
                        else:
                            print(f"    ⚠️ אזהרה: הערך לא נשמר כפי הצפוי (קיבלתי: '{current_value}')")
                    else:
                        print(f"    ⚠️ אלמנט נמצא אבל לא נגיש (visible: {is_visible}, enabled: {is_enabled})")
                else:
                    print(f"    ❌ אלמנט לא נמצא עם סלקטור: {selector}")
                    
            except Exception as e:
                print(f"    💥 שגיאה עם סלקטור {selector}: {str(e)}")
                continue
        
        print(f"❌ כשלון: לא הצלחתי למלא שדה {field_key} עם אף אחד מהסלקטורים")
        return False
    
    async def _try_click_button(self, page, config, button_key: str) -> bool:
        """נסיון לחיצה על כפתור עם selector חלופיים - מעודכן עם לוגים מפורטים"""
        print(f"🔍 מנסה ללחוץ על כפתור: {button_key}")
        
        selectors = [config[button_key]]  # הסלקטור הבסיסי
        
        # הוספת סלקטורים חלופיים אם קיימים
        if 'alternative_selectors' in config and button_key in config['alternative_selectors']:
            selectors.extend(config['alternative_selectors'][button_key])
        
        print(f"🎯 סלקטורים לבדיקה עבור {button_key}: {selectors}")
        
        for i, selector in enumerate(selectors):
            try:
                print(f"  🔍 בודק סלקטור {i+1}/{len(selectors)}: {selector}")
                element = await page.query_selector(selector)
                
                if element:
                    # בדוק אם האלמנט נראה
                    is_visible = await element.is_visible()
                    is_enabled = await element.is_enabled()
                    print(f"    📍 נמצא כפתור - נראה: {is_visible}, פעיל: {is_enabled}")
                    
                    if is_visible and is_enabled:
                        await element.click()
                        print(f"    ✅ נלחץ כפתור {button_key} בהצלחה עם סלקטור: {selector}")
                        return True
                    else:
                        print(f"    ⚠️ כפתור נמצא אבל לא נגיש (visible: {is_visible}, enabled: {is_enabled})")
                else:
                    print(f"    ❌ כפתור לא נמצא עם סלקטור: {selector}")
                    
            except Exception as e:
                print(f"    💥 שגיאה עם סלקטור {selector}: {str(e)}")
                continue
        
        # אם לא הצלחנו ללחוץ על שום כפתור, נסה להגיש הטופס באמצעות Enter
        print(f"🔄 לא מצאתי כפתור, מנסה להגיש טופס באמצעות Enter...")
        try:
            # נסה למצוא את שדה הסיסמה ולהקיש Enter
            password_element = await page.query_selector(config['password_field'])
            if password_element:
                await password_element.press('Enter')
                print(f"    ✅ הגשתי טופס באמצעות Enter על שדה הסיסמה")
                return True
        except Exception as e:
            print(f"    💥 שגיאה בהגשת טופס באמצעות Enter: {str(e)}")
        
        print(f"❌ כשלון: לא הצלחתי ללחוץ על כפתור {button_key} או להגיש טופס")
        return False
    
    async def _get_error_message(self, page, config) -> str:
        """חילוץ הודעת שגיאה"""
        try:
            for selector in config['error_indicators']:
                element = await page.query_selector(selector)
                if element:
                    text = await element.text_content()
                    if text and text.strip():
                        return text.strip()
        except:
            pass
        return 'שגיאה לא ידועה בהתחברות'

async def main():
    """פונקציה ראשית להפעלה מcommand line"""
    parser = argparse.ArgumentParser(description='אימות פרטי התחברות למודל')
    parser.add_argument('--university', required=True, help='קוד האוניברסיטה (bgu/technion/huji)')
    parser.add_argument('--username', required=True, help='שם משתמש')
    parser.add_argument('--password', required=True, help='סיסמה')
    
    args = parser.parse_args()
    
    validator = DevMoodleValidator()
    result = await validator.validate(args.university, args.username, args.password)
    
    # החזרת תוצאה כJSON לNode.js
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    asyncio.run(main())