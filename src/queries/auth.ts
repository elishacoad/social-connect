import { makeRedirectUri } from 'expo-auth-session';

import { supabase } from '@/lib/supabase';

// Where Supabase's confirmation email link sends the user back to. Must be
// added to the project's Auth > URL Configuration > Redirect URLs allow list,
// otherwise GoTrue silently falls back to the Site URL instead. Points at
// auth/callback (see src/app/auth/callback.tsx) rather than the bare scheme
// root, since the root path has no route to match while the user is signed
// out and would otherwise land on Expo Router's "Unmatched Route" screen.
const emailRedirectTo = makeRedirectUri({ path: 'auth/callback' });

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

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
