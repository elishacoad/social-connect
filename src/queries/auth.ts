import { makeRedirectUri } from 'expo-auth-session';

import { supabase } from '@/lib/supabase';

// Where Supabase's confirmation email link sends the user back to. Must be
// added to the project's Auth > URL Configuration > Redirect URLs allow list,
// otherwise GoTrue silently falls back to the Site URL instead.
const emailRedirectTo = makeRedirectUri();

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPasswordForEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: emailRedirectTo });
  if (error) throw error;
}
