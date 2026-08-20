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

// Goes through an RPC rather than selecting from profiles: reads are scoped to
// people you're connected to, so a plain query would call every stranger's
// username free. excludeId lets a user re-save their own current username
// without it colliding with itself.
export async function isUsernameAvailable(username: string, excludeId?: string) {
  const { data, error } = await supabase.rpc('is_username_available', {
    candidate: username,
    exclude_id: excludeId ?? null,
  });
  if (error) throw error;
  return data;
}
