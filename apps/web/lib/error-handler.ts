/**
 * מודול לטיפול בשגיאות עם מנגנון retry
 */

/**
 * פונקציה לביצוע פעולה עם retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        console.error(`❌ נכשל לאחר ${maxRetries + 1} ניסיונות:`, lastError.message);
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
      console.warn(`⚠️ ניסיון ${attempt + 1} נכשל, מנסה שוב בעוד ${delay}ms:`, lastError.message);
      
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

/**
 * פונקציה להשהיה
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * טיפול בשגיאות רשת
 */
export function isNetworkError(error: any): boolean {
  return error instanceof TypeError && 
         (error.message.includes('fetch') || 
          error.message.includes('network') ||
          error.message.includes('ENOTFOUND') ||
          error.message.includes('ECONNREFUSED'));
}

/**
 * טיפול בשגיאות timeout
 */
export function isTimeoutError(error: any): boolean {
  return error instanceof Error && 
         (error.message.includes('timeout') || 
          error.message.includes('AbortError'));
}

/**
 * טיפול בשגיאות API
 */
export function isApiError(error: any): boolean {
  return error instanceof Error && 
         (error.message.includes('API') || 
          error.message.includes('HTTP') ||
          error.message.includes('status'));
}

/**
 * יצירת הודעת שגיאה ידידותית
 */
export function getFriendlyErrorMessage(error: any): string {
  if (isNetworkError(error)) {
    return 'בעיית חיבור לרשת. בדוק את החיבור שלך ונסה שוב.';
  }
  
  if (isTimeoutError(error)) {
    return 'הבקשה נכשלה עקב פג תוקף. נסה שוב.';
  }
  
  if (isApiError(error)) {
    return 'שגיאה בשרת. נסה שוב מאוחר יותר.';
  }
  
  return error instanceof Error ? error.message : 'שגיאה לא ידועה';
}

/**
 * לוג שגיאה מפורט
 */
export function logError(context: string, error: any, additionalData?: any): void {
  console.error(`❌ שגיאה ב-${context}:`, {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    additionalData,
    timestamp: new Date().toISOString()
  });
}

/**
 * בדיקת תקינות נתונים
 */
export function validateRequiredFields(data: any, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`חסרים שדות נדרשים: ${missingFields.join(', ')}`);
  }
}

/**
 * טיפול בשגיאות async/await
 */
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError('async function', error);
      throw error;
    }
  };
} 