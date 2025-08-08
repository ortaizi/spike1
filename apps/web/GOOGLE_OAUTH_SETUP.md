# Google OAuth Setup Instructions

## הבעיה הנוכחית
כשלוחצים על כפתור ההתחברות עם Google, המסך של Google לא נפתח ומחזיר לדף ההתחברות.

## הפתרון
צריך לוודא שה-Authorized Redirect URIs מוגדרים נכון ב-Google Cloud Console.

## שלבים לתיקון

### 1. היכנס ל-Google Cloud Console
- לך ל: https://console.cloud.google.com/
- בחר את הפרויקט שלך

### 2. עבור ל-APIs & Services > Credentials
- בתפריט הצדדי, לחץ על "APIs & Services"
- לחץ על "Credentials"

### 3. מצא את OAuth 2.0 Client ID שלך
- חפש את Client ID: `603919109021-neqbducfr9vvbdfneh1rkiqd35ifl6uk.apps.googleusercontent.com`
- לחץ עליו לעריכה

### 4. הוסף Authorized redirect URIs
בשדה "Authorized redirect URIs" הוסף את הכתובות הבאות:

```
http://localhost:3000/api/auth/callback/google
```

אם יש לך דומיין ייצור, הוסף גם:
```
https://your-domain.com/api/auth/callback/google
```

### 5. שמור את השינויים
- לחץ על "Save"

### 6. בדוק את הקונפיגורציה
- וודא שה-Client ID וה-Client Secret בקובץ `.env.local` תואמים לאלה ב-Google Cloud Console

### 7. הפעל מחדש את השרת
```bash
cd apps/web
npm run dev
```

## בדיקת הקונפיגורציה
הרץ את הסקריפט הבא כדי לבדוק שהכל מוגדר נכון:
```bash
node test-google-auth.js
```

## אם הבעיה נמשכת

### בדוק את הלוגים
פתח את Developer Tools בדפדפן (F12) ובדוק את ה-Console לראות אם יש שגיאות.

### בדוק את Network Tab
בדוק אם יש בקשות שנכשלות ל-Google OAuth.

### בדוק את NextAuth Debug
הוסף את המשתנה הבא ל-.env.local:
```
NEXTAUTH_DEBUG=true
```

זה יפיק לוגים מפורטים של NextAuth שיעזרו לאבחן את הבעיה.

## משתני סביבה נדרשים
וודא שיש לך את המשתנים הבאים ב-.env.local:

```
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## הערות חשובות
1. ה-Authorized redirect URI חייב להיות בדיוק כמו שמוגדר ב-NextAuth
2. לא יכולות להיות רווחים מיותרים או תווים מיוחדים
3. הפרוטוקול (http/https) חייב להיות נכון
4. הפורט חייב להיות נכון (3000 לפיתוח) 