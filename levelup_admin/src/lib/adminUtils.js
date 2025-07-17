import { supabase } from './supabase';

export async function isAdmin(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data?.role === 'admin';
} 