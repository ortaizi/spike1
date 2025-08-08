# תוכנית יישום מערכת התחברות דו-שלבית עם Next Auth

## סקירה כללית
עדכון מערכת ההתחברות הקיימת למערכת דו-שלבית:
1. **התחברות ראשונה**: Google OAuth + הגדרת פרטי מוסד (פעם אחת בלבד)
2. **התחברויות עוקבות**: Google OAuth בלבד (redirect ישיר לדשבורד)

## שלב 1: הכנות ראשוניות
- [ ] התקנת next-auth package
- [ ] יצירת Google OAuth credentials בGoogle Console  
- [ ] הוספת environment variables חדשים
- [ ] גיבוי של קבצי ההתחברות הקיימים
- [ ] בדיקת קובץ .env.development הנוכחי

## שלב 2: מסד נתונים
- [ ] יצירת migration לטבלאות חדשות:
  - [ ] טבלת users: id, google_id, name, email, profile_picture, university_id, is_setup_complete, created_at
  - [ ] טבלת university_credentials: user_id, university_id, encrypted_username, encrypted_password, last_sync
  - [ ] טבלת universities: id, name, login_url, sync_method
- [ ] הגדרת סכמת מסד הנתונים
- [ ] בדיקת חיבור למסד הנתונים
- [ ] יצירת utils להצפנה (EncryptionUtils.js)

## שלב 3: הגדרת NextAuth
- [ ] יצירת API route ל-NextAuth (`/api/auth/[...nextauth]/route.ts`)
- [ ] הגדרת Google Provider
- [ ] הגדרת callbacks:
  - [ ] signIn callback
  - [ ] session callback  
  - [ ] jwt callback
- [ ] הוספת SessionProvider ל-app layout
- [ ] הגדרת database adapter

## שלב 4: עדכון דף התחברות
- [ ] שמירת גיבוי של הקומפוננט הקיים (`/app/auth/signin/page.tsx`)
- [ ] החלפת הלוגיקה בפתרון Google OAuth
- [ ] הוספת logic להכוונת משתמשים:
  - [ ] משתמש חדש → `/setup-university`
  - [ ] משתמש קיים → `/dashboard`
- [ ] שמירה על העיצוב הקיים (RTL, צבעים, לוגו)
- [ ] בדיקת פונקציונליות

## שלב 5: יצירת דף Setup
- [ ] יצירת קומפוננט UniversitySetup (`/app/setup-university/page.tsx`)
- [ ] הוספת dropdown למוסדות לימוד
- [ ] יצירת form לפרטי התחברות (username/password)
- [ ] הוספת validation שבודק חיבור מוצלח למערכת המוסד
- [ ] הוספת הצפנה לשמירת פרטי המוסד
- [ ] קישור פרטי המוסד למשתמש Google לצמיתות
- [ ] redirect לדשבורד רק אחרי הצלחה מלאה

## שלב 6: Middleware ואבטחה
- [ ] יצירת AuthMiddleware (`/middleware.ts`)
- [ ] הגנה על routes מוגנים:
  - [ ] `/dashboard/*`
  - [ ] `/user/*`
  - [ ] כל routes שדורשים התחברות
- [ ] בדיקת is_setup_complete לפני גישה לדשבורד
- [ ] redirect חזרה לsetup-university אם setup לא הושלם
- [ ] הוספת security headers

## שלב 7: עדכון Routing
- [ ] הוספת route חדש לsetup (`/setup-university`)
- [ ] עדכון נתיבי הפניה בכל האפליקציה
- [ ] בדיקת protected routes
- [ ] עדכון navigation components
- [ ] הוספת redirect logic ב-NextAuth callbacks

## שלב 8: UI/UX finishing touches
- [ ] הוספת loading states עם NextAuth status
- [ ] עדכון עיצוב לRTL
- [ ] הוספת error handling
- [ ] הוספת success messages
- [ ] יצירת ConnectionStatus component לדשבורד
- [ ] הוספת אינדיקטור מצב חיבור למוסד

## שלב 9: בדיקות מקיפות
- [ ] בדיקת התחברות ראשונה (משתמש חדש):
  - [ ] Google OAuth עובד
  - [ ] redirect לsetup page
  - [ ] הגדרת פרטי מוסד עובדת
  - [ ] שמירה במסד הנתונים
  - [ ] redirect לדשבורד
- [ ] בדיקת התחברות חוזרת (משתמש קיים):
  - [ ] Google OAuth עובד
  - [ ] redirect ישיר לדשבורד
  - [ ] שימוש בפרטי המוסד השמורים
- [ ] בדיקת אבטחה:
  - [ ] הצפנת פרטי מוסד
  - [ ] הגנה על routes
  - [ ] session management
- [ ] בדיקת UX על מכשירים שונים:
  - [ ] Desktop
  - [ ] Mobile
  - [ ] Tablet

## שלב 10: ניקוי וסיום
- [ ] הסרת קוד ישן (username/password forms)
- [ ] עדכון documentation
- [ ] בדיקת performance
- [ ] backup סופי
- [ ] עדכון README.md
- [ ] בדיקת כל environment variables

## קבצים שייווצרו/יעודכנו

### קבצים חדשים:
- `/app/api/auth/[...nextauth]/route.ts`
- `/app/setup-university/page.tsx`
- `/lib/auth/encryption-utils.ts`
- `/lib/auth/auth-middleware.ts`
- `/components/auth/connection-status.tsx`
- `/components/auth/university-setup.tsx`

### קבצים שיעודכנו:
- `/app/auth/signin/page.tsx`
- `/app/layout.tsx` (הוספת SessionProvider)
- `/middleware.ts`
- `/lib/database/schema.sql`
- `package.json` (הוספת next-auth)

### Environment Variables חדשים:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## הערות חשובות:
- **setup מוסד מתבצע פעם אחת בלבד** בהתחברות ראשונה
- שמירה על כל העיצוב והתחושה הקיימים
- כל הטקסטים בעברית RTL
- הצפנה מלאה של פרטי המוסד
- בדיקות מקיפות בכל שלב

---
**חשוב**: אחרי כל שלב - עצור וחכה לאישור לפני שממשיך לשלב הבא! 