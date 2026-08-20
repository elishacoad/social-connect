import { supabase } from '@/lib/supabase';

// Every write query needs the caller's id to satisfy RLS's `auth.uid()`
// checks; this is the single place that unwraps it.
export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user.id;
}
