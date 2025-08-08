/**
 * פונקציות להודעות סטטוס ידידותיות לסנכרון
 */

export function getSyncStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    'starting': 'מתחיל תהליך סנכרון...',
    'creating_tables': 'בודק ומייצר טבלאות נדרשות...',
    'fetching_courses': 'אוסף נתוני קורסים מהמודל...',
    'analyzing_content': 'מנתח תוכן קורסים...',
    'classifying_data': 'מסווג ומארגן נתונים...',
    'saving_to_database': 'שומר נתונים בדטה בייס...',
    'completed': 'סנכרון הושלם בהצלחה!',
    'error': 'שגיאה בתהליך הסנכרון'
  };
  
  return messages[status] || 'מעבד...';
}

export function getSyncStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    'starting': '🚀',
    'creating_tables': '🏗️',
    'fetching_courses': '📊',
    'analyzing_content': '🔍',
    'classifying_data': '🗂️',
    'saving_to_database': '💾',
    'completed': '✅',
    'error': '❌'
  };
  
  return icons[status] || '⏳';
}

export function getSyncStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'starting': 'text-blue-500',
    'creating_tables': 'text-blue-500',
    'fetching_courses': 'text-blue-500',
    'analyzing_content': 'text-purple-500',
    'classifying_data': 'text-orange-500',
    'saving_to_database': 'text-green-500',
    'completed': 'text-green-500',
    'error': 'text-red-500'
  };
  
  return colors[status] || 'text-gray-500';
}

export function getSyncProgressColor(progress: number): string {
  if (progress < 0) return 'bg-red-500';
  if (progress < 25) return 'bg-blue-500';
  if (progress < 50) return 'bg-yellow-500';
  if (progress < 75) return 'bg-orange-500';
  if (progress < 100) return 'bg-green-500';
  return 'bg-green-500';
}

export function formatSyncDuration(startTime: Date, endTime?: Date): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const duration = end.getTime() - start.getTime();
  
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes} דקות ו-${seconds} שניות`;
  }
  
  return `${seconds} שניות`;
}

export function getEstimatedTimeRemaining(progress: number, startTime: Date): string {
  if (progress <= 0) return 'מחשב...';
  
  const elapsed = Date.now() - new Date(startTime).getTime();
  const estimatedTotal = (elapsed / progress) * 100;
  const remaining = estimatedTotal - elapsed;
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  if (minutes > 0) {
    return `בערך ${minutes} דקות`;
  }
  
  return `בערך ${seconds} שניות`;
} 