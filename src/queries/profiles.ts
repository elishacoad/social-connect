import { supabase } from '@/lib/supabase';
import { Tables, TablesUpdate } from '@/types/database';

export type ProfileRow = Tables<'profiles'>;

export async function getProfile(id: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function updateProfile(id: string, patch: TablesUpdate<'profiles'>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// excludeId lets a user re-save their own current username without it
// colliding with itself in the uniqueness check.
export async function isUsernameAvailable(username: string, excludeId?: string) {
  let query = supabase.from('profiles').select('id').eq('username', username);
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data === null;
}
