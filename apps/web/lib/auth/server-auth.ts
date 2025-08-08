import { auth } from './auth-provider';
import { supabase } from '../db';

export async function getCurrentUser() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return null;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', session.user.email)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('אימות נדרש');
  }
  
  return user;
}

export async function getUserPreferences() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  return user.preferences as any;
}

export async function updateUserPreferences(preferences: any) {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('אימות נדרש');
  }
  
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      preferences: {
        ...(user.preferences as object || {}),
        ...preferences
      },
      updatedAt: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user preferences:', error);
    throw new Error('שגיאה בעדכון העדפות המשתמש');
  }
  
  return updatedUser;
} 