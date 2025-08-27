// Hebrew Authentication Error Messages for Israeli Universities
// הודעות שגיאה בעברית עבור מערכת האימות

export const AUTH_ERRORS_HE = {
  // Google OAuth Errors
  AccessDenied: {
    title: 'גישה נדחתה',
    message: 'ההתחברות עם Google נדחתה. אנא וודא שהאימייל שלך משויך לאוניברסיטה מאושרת.',
    action: 'נסה שוב'
  },
  
  Configuration: {
    title: 'שגיאת תצורה',
    message: 'יש בעיה בהגדרות המערכת. אנא פנה לתמיכה טכנית.',
    action: 'פנה לתמיכה'
  },
  
  Verification: {
    title: 'נדרש אימות נוסף',
    message: 'נדרש אימות נוסף של פרטי המודל. בדוק את האימייל שלך.',
    action: 'בדוק אימייל'
  },
  
  // University Domain Errors
  InvalidDomain: {
    title: 'דומיין לא מאושר',
    message: 'כתובת האימייל צריכה להיות משויכת לאוניברסיטה מאושרת (למשל: @bgu.ac.il)',
    action: 'השתמש באימייל אוניברסיטאי'
  },
  
  // Moodle Authentication Errors
  MoodleAuthFailed: {
    title: 'כניסה למודל נכשלה',
    message: 'פרטי ההתחברות למודל שגויים. בדוק שם משתמש וסיסמה.',
    action: 'נסה שוב'
  },
  
  MoodleTimeout: {
    title: 'פג תוקף החיבור',
    message: 'החיבור למודל פג תוקף. ייתכן שהשרת עמוס.',
    action: 'נסה שוב מאוחר יותר'
  },
  
  // Network Errors
  NetworkError: {
    title: 'שגיאת רשת',
    message: 'בעיה בחיבור לאינטרנט. בדוק את החיבור שלך ונסה שוב.',
    action: 'בדוק חיבור'
  },
  
  // Rate Limiting
  TooManyAttempts: {
    title: 'יותר מדי ניסיונות',
    message: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד כמה דקות.',
    action: 'המתן ונסה שוב'
  },
  
  // Session Errors
  SessionExpired: {
    title: 'תם תוקף ההפעלה',
    message: 'פג תוקף ההפעלה שלך. נדרשת התחברות מחדש.',
    action: 'התחבר מחדש'
  },
  
  // General Errors
  UnknownError: {
    title: 'שגיאה לא ידועה',
    message: 'אירעה שגיאה בלתי צפויה. אנא נסה שוב או פנה לתמיכה.',
    action: 'נסה שוב'
  },

  // Smart Authentication Specific Errors
  AutoAuthFailed: {
    title: 'התחברות אוטומטית נכשלה',
    message: 'לא הצלחנו להתחבר אוטומטית עם הפרטים השמורים שלך. ייתכן שהסיסמה שונתה באוניברסיטה.',
    action: 'הזן סיסמה חדשה'
  },

  CredentialsExpired: {
    title: 'פרטי ההתחברות פגו',
    message: 'פרטי ההתחברות השמורים במערכת אינם תקפים יותר.',
    action: 'עדכן פרטי התחברות'
  },

  RevalidationRequired: {
    title: 'נדרש אימות מחדש',
    message: 'עבר זמן רב מאז האימות האחרון של פרטי ההתחברות. נדרש אימות מחדש למען הביטחון.',
    action: 'אמת פרטים מחדש'
  },

  ValidationAttemptsExceeded: {
    title: 'חרגת ממספר הניסיונות',
    message: 'ביצעת יותר מדי ניסיונות אימות כושלים. חשבונך נחסם זמנית.',
    action: 'המתן 15 דקות'
  },

  UniversityNotSupported: {
    title: 'אוניברסיטה לא נתמכת',
    message: 'כרגע אנחנו תומכים רק באוניברסיטת בן-גוריון. תמיכה באוניברסיטאות נוספות תתווסף בקרוב.',
    action: 'השתמש במייל BGU'
  },

  PythonValidatorError: {
    title: 'שגיאה במערכת האימות',
    message: 'שגיאה טכנית במערכת אימות הפרטים. המערכת לא הצליחה לבדוק את הפרטים שלך.',
    action: 'נסה שוב מאוחר יותר'
  },

  EncryptionError: {
    title: 'שגיאה בהצפנת הנתונים',
    message: 'שגיאה בהצפנת פרטי ההתחברות. הנתונים שלך לא נשמרו.',
    action: 'נסה שוב'
  },

  DatabaseError: {
    title: 'שגיאה במסד הנתונים',
    message: 'שגיאה בשמירת או קריאת הנתונים ממסד הנתונים.',
    action: 'נסה שוב מאוחר יותר'
  },

  DevelopmentModeError: {
    title: 'שגיאה במצב פיתוח',
    message: 'שגיאה שמתרחשת רק במצב פיתוח של המערכת.',
    action: 'פנה למפתח'
  },

  SmartFlowError: {
    title: 'שגיאה בזרימת האימות החכמה',
    message: 'שגיאה בקביעת צעדי האימות המתאימים לסטטוס שלך.',
    action: 'התחבר מחדש'
  }
} as const;

// University Domain Validation
export const ISRAELI_UNIVERSITIES = {
  'post.bgu.ac.il': {
    name: 'אוניברסיטת בן-גוריון בנגב',
    nameEn: 'Ben-Gurion University of the Negev',
    moodleUrl: 'https://moodle.bgu.ac.il',
    logoUrl: '/logos/bgu.png'
  },
  'technion.ac.il': {
    name: 'הטכניון - מכון טכנולוגי לישראל',
    nameEn: 'Technion - Israel Institute of Technology',
    moodleUrl: 'https://moodle.technion.ac.il',
    logoUrl: '/logos/technion.png'
  },
  'mail.tau.ac.il': {
    name: 'אוניברסיטת תל אביב',
    nameEn: 'Tel Aviv University',
    moodleUrl: 'https://moodle.tau.ac.il',
    logoUrl: '/logos/tau.png'
  },
  'mail.huji.ac.il': {
    name: 'אוניברסיטת בן-גוריון בנגב',
    nameEn: 'The Hebrew University of Jerusalem',
    moodleUrl: 'https://moodle.huji.ac.il',
    logoUrl: '/logos/huji.png'
  },
  'campus.haifa.ac.il': {
    name: 'אוניברסיטת חיפה',
    nameEn: 'University of Haifa',
    moodleUrl: 'https://moodle.haifa.ac.il',
    logoUrl: '/logos/haifa.png'
  },
  'biu.ac.il': {
    name: 'אוניברסיטת בר-אילן',
    nameEn: 'Bar-Ilan University',
    moodleUrl: 'https://moodle.biu.ac.il',
    logoUrl: '/logos/biu.png'
  },
  'ariel.ac.il': {
    name: 'אוניברסיטת אריאל',
    nameEn: 'Ariel University',
    moodleUrl: 'https://moodle.ariel.ac.il',
    logoUrl: '/logos/ariel.png'
  },
  'openu.ac.il': {
    name: 'האוניברסיטה הפתוחה',
    nameEn: 'The Open University of Israel',
    moodleUrl: 'https://moodle.openu.ac.il',
    logoUrl: '/logos/openu.png'
  }
} as const;

// Helper function to get Hebrew error message
export function getHebrewErrorMessage(errorCode: string): {
  title: string;
  message: string;
  action: string;
} {
  const error = AUTH_ERRORS_HE[errorCode as keyof typeof AUTH_ERRORS_HE];
  return error || AUTH_ERRORS_HE.UnknownError;
}

// Helper function to validate university email domain
export function validateUniversityEmail(email: string): {
  isValid: boolean;
  university?: typeof ISRAELI_UNIVERSITIES[keyof typeof ISRAELI_UNIVERSITIES];
  domain?: string;
  error?: string;
} {
  if (!email || !email.includes('@')) {
    return {
      isValid: false,
      error: 'כתובת אימייל לא חוקית'
    };
  }
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return {
      isValid: false,
      error: 'דומיין האימייל לא חוקי'
    };
  }
  
  // Check for exact match first
  if (domain in ISRAELI_UNIVERSITIES) {
    return {
      isValid: true,
      university: ISRAELI_UNIVERSITIES[domain as keyof typeof ISRAELI_UNIVERSITIES],
      domain
    };
  }
  
  // Check for subdomain matches (e.g., student.bgu.ac.il)
  for (const [universityDomain, universityInfo] of Object.entries(ISRAELI_UNIVERSITIES)) {
    if (domain.endsWith(universityDomain)) {
      return {
        isValid: true,
        university: universityInfo,
        domain: universityDomain
      };
    }
  }
  
  return {
    isValid: false,
    error: `דומיין ${domain} אינו שייך לאוניברסיטה מאושרת`
  };
}

// Helper function to format Hebrew error for display
export function formatHebrewError(errorCode: string, additionalInfo?: string): string {
  const error = getHebrewErrorMessage(errorCode);
  let formatted = `${error.title}: ${error.message}`;
  
  if (additionalInfo) {
    formatted += ` (${additionalInfo})`;
  }
  
  return formatted;
}

// Success Messages in Hebrew
export const AUTH_SUCCESS_HE = {
  GoogleLogin: 'התחברות עם Google בוצעה בהצלחה',
  MoodleSync: 'סנכרון עם מודל הושלם בהצלחה',
  ProfileComplete: 'הפרופיל שלך הושלם בהצלחה',
  Welcome: 'ברוך הבא לפלטפורמת Spike!',
  DataSynced: 'הנתונים שלך סונכרנו בהצלחה',
  
  // Smart Authentication Success Messages
  AutoAuthSuccess: '🚀 התחברות אוטומטית הצליחה!',
  CredentialsSaved: '💾 פרטי ההתחברות נשמרו בהצלחה',
  CredentialsUpdated: '🔄 פרטי ההתחברות עודכנו בהצלחה',
  ValidationSuccess: '✅ פרטי ההתחברות אומתו בהצלחה',
  NewUserSuccess: '🎉 הרשמה ראשונית הושלמה בהצלחה!',
  RevalidationSuccess: '🔐 אימות מחדש הושלם בהצלחה',
  OnboardingComplete: '🎓 ההרשמה הושלמה! מעביר לדשבורד...',
  SmartFlowComplete: '⚡ תהליך האימות החכם הושלם בהצלחה'
} as const;

// Progress Messages for Loading States
export const PROGRESS_MESSAGES_HE = {
  CheckingStatus: 'בודק סטטוס אימות...',
  Connecting: 'מתחבר למערכת האוניברסיטה...',
  AutoConnecting: '🚀 מנסה התחברות אוטומטית...',
  Validating: '🔍 מאמת פרטי התחברות...',
  Saving: '💾 שומר פרטי התחברות...',
  Completing: '✨ משלים הרשמה...',
  Redirecting: '➡️ מעביר לדשבורד...',
  Loading: 'טוען...',
  Processing: 'מעבד נתונים...',
  Syncing: 'מסנכרן עם האוניברסיטה...',
  Decrypting: '🔓 מפענח נתונים...',
  Encrypting: '🔒 מצפין נתונים...'
} as const;

// Form Validation Messages
export const FORM_VALIDATION_HE = {
  RequiredField: 'שדה חובה',
  InvalidEmail: 'כתובת מייל לא תקפה',
  EmailNotUniversity: 'נדרש מייל של אוניברסיטת בן-גוריון',
  PasswordTooShort: 'הסיסמה קצרה מדי (מינימום 8 תווים)',
  PasswordTooLong: 'הסיסמה ארוכה מדי (מקסימום 128 תווים)',
  UsernameTooShort: 'שם המשתמש קצר מדי',
  UsernameTooLong: 'שם המשתמש ארוך מדי',
  SpecialCharacters: 'אסור להשתמש בתווים מיוחדים',
  NumericOnly: 'רק מספרים מותרים',
  InvalidCharacters: 'תווים לא תקפים',
  FieldEmpty: 'השדה ריק'
} as const;

// Contextual Messages based on Authentication Flow
export const FLOW_MESSAGES_HE = {
  new_user: {
    title: 'משתמש חדש',
    subtitle: 'בואו נגדיר את הפרטים שלך',
    description: 'זוהי הפעם הראשונה שלך במערכת'
  },
  existing_user_auto: {
    title: 'התחברות אוטומטית',
    subtitle: 'מתחבר אוטומטית עם הפרטים השמורים',
    description: 'משתמש בפרטי ההתחברות השמורים שלך'
  },
  existing_user_manual: {
    title: 'עדכון פרטי התחברות',
    subtitle: 'נא להזין את הסיסמה הנוכחית',
    description: 'נמצאו פרטי התחברות קיימים הזקוקים לעדכון'
  },
  existing_user_revalidate: {
    title: 'אימות פרטים מחדש',
    subtitle: 'נדרש אימות מחדש למען הביטחון',
    description: 'פרטי ההתחברות זקוקים לאימות מחדש'
  }
} as const;