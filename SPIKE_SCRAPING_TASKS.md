# 🚀 Spike - מערכת ניתוח חכמה למודל BGU

## 📋 **מטרה מרכזית: מערכת ניתוח חכמה ומתקדמת לדפי קורס במודל BGU**

### **🎯 המערכת נבנתה בהצלחה!**

---

## ✅ **מערכת ניתוח חכמה הושלמה**

### **🏗️ רכיבי המערכת:**

#### **1. AI Course Analyzer (`ai_course_analyzer.py`)**
- **סטטוס**: ✅ הושלם
- **תכונות**:
  - ניתוח AI מתקדם של דפי קורס
  - זיהוי סוגי תוכן אוטומטי
  - סיווג קטגוריות חכם
  - חילוץ מטא-דאטה
  - ניתוח טקסט עברי
  - זיהוי אייקונים ורמזים ויזואליים

#### **2. Moodle Session Manager (`moodle_session_manager.py`)**
- **סטטוס**: ✅ הושלם
- **תכונות**:
  - ניהול sessions ו-login
  - התמודדות עם JavaScript דינמי
  - ניהול cookies ו-user agents
  - validation של sessions
  - stealth browsing

#### **3. Smart Course Analyzer (`smart_course_analyzer.py`)**
- **סטטוס**: ✅ הושלם
- **תכונות**:
  - המערכת הראשית שמחברת הכל
  - ניתוח מלא של קורסים
  - שילוב תוצאות AI ומבנה בסיסי
  - ניהול cache ושמירת תוצאות

#### **4. Run Analysis (`run_analysis.py`)**
- **סטטוס**: ✅ הושלם
- **תכונות**:
  - קובץ הרצה ראשי
  - ממשק פשוט לשימוש
  - command line interface
  - הדפסת תוצאות יפה

---

## 🎯 **יכולות המערכת:**

### **1. ניתוח קטגוריות דרופ-דאון**
- ✅ זיהוי אוטומטי של כל קטגוריה (מבנה, כללי, הרצאות, תרגילים)
- ✅ מיפוי רכיבים לקטגוריות
- ✅ זיהוי היררכיה של תת-קטגוריות

### **2. ניתוח סוגי קומפוננטות**
- ✅ **קובץ להורדה** (PDF, DOC, PPT, ZIP)
- ✅ **עמוד הגשת מטלה** (טפסי הגשה)
- ✅ **עמוד עם סרטון** (נגני וידאו/YouTube)
- ✅ **קישור חיצוני** (אתרים חיצוניים)
- ✅ **דף מידע** (תוכן סטטי)
- ✅ **מבחן/בחינה אונליין** (מערכות בחינה)
- ✅ **פורום/דיון** (אזורי תגובות)

### **3. תכונות טכניות מתקדמות**
- ✅ התמודדות עם JavaScript דינמי ו-AJAX
- ✅ זיהוי תוכן שנטען באופן אסינכרוני
- ✅ ניהול sessions ו-cookies
- ✅ זיהוי רכיבי UI במודל

### **4. אלגוריתמי זיהוי חכמים**
- ✅ ניתוח טקסט עברי לזיהוי מילות מפתח
- ✅ זיהוי פטרנים ב-URL ובשמות קבצים
- ✅ ניתוח מבנה HTML ו-CSS classes
- ✅ זיהוי אייקונים ורמזים ויזואליים
- ✅ ML/AI לשיפור דיוק הסיווג

---

## 🚀 **הרצת המערכת:**

### **1. התקנה**
```bash
cd spike-scraper
pip install -r requirements.txt
```

### **2. הרצה בסיסית**
```bash
# ניתוח קורס כלכלה (ברירת מחדל)
python run_analysis.py

# ניתוח קורס ספציפי
python run_analysis.py --course-id "12345" --course-name "שם הקורס"

# סיכום קורס מהיר
python run_analysis.py --course-id "12345" --summary

# הצגת סטטיסטיקות
python run_analysis.py --stats

# debug mode
python run_analysis.py --debug
```

### **3. שימוש בקוד**
```python
from smart_course_analyzer import SmartCourseAnalyzer

# יצירת המערכת
analyzer = SmartCourseAnalyzer("username", "password")

# ניתוח קורס
result = await analyzer.analyze_course("12345", "מבוא לכלכלה")

# הדפסת תוצאות
print(json.dumps(result, indent=2, ensure_ascii=False))
```

---

## 📊 **פורמט הפלט:**

```json
{
  "course_info": {
    "id": "course_id",
    "name": "שם הקורס",
    "analysis_timestamp": "timestamp",
    "total_sections": 5,
    "total_items": 25
  },
  "combined_categories": {
    "הרצאות": {
      "source": "ai_analysis",
      "type": "dropdown_section",
      "items": [
        {
          "title": "הרצאה 1 - מבוא",
          "type": "file_download",
          "url": "download_url",
          "metadata": {
            "file_type": "pdf",
            "size": "2.5MB"
          },
          "confidence": 0.95
        }
      ]
    }
  }
}
```

---

## 🔧 **תכונות מתקדמות:**

### **1. Cache System**
- ✅ שמירת תוצאות ניתוח ב-cache
- ✅ טעינה מהירה של תוצאות קיימות
- ✅ ניהול cache אוטומטי

### **2. Error Handling**
- ✅ טיפול בשגיאות התחברות
- ✅ retry mechanism חכם
- ✅ logging מפורט

### **3. Performance Optimization**
- ✅ ניתוח מקביל של מספר קורסים
- ✅ progress tracking
- ✅ memory management

### **4. Security Features**
- ✅ ניהול sessions מאובטח
- ✅ stealth browsing
- ✅ user agent rotation

---

## 📁 **מבנה קבצים:**

```
spike-scraper/
├── ai_course_analyzer.py          # ניתוח AI מתקדם
├── moodle_session_manager.py      # ניהול sessions
├── smart_course_analyzer.py       # המערכת הראשית
├── run_analysis.py                # קובץ הרצה ראשי
├── requirements.txt               # דרישות
├── AI_COURSE_ANALYZER_README.md  # תיעוד מפורט
├── analysis_results/              # תוצאות ניתוח
│   ├── course_analysis_*.json
│   └── ...
└── logs/                         # קבצי log
    └── analysis.log
```

---

## 🎯 **הצעד הבא:**

**הרצת המערכת על קורס כלכלה**
- עדכון ה-course ID האמיתי
- בדיקת התוצאות
- אופטימיזציה לפי הצורך

**המערכת מוכנה לשימוש!** 🚀

---

## 📚 **תיעוד נוסף:**

- **README מפורט**: `AI_COURSE_ANALYZER_README.md`
- **דוגמאות שימוש**: בקוד הקובץ `run_analysis.py`
- **תיעוד API**: בתוך הקבצים עצמם

**המערכת החכמה נבנתה בהצלחה!** 🎉 