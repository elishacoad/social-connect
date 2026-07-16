import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert } from '@/types/database';

export type MomentRow = Tables<'moments'>;

export async function createMoment(input: Omit<TablesInsert<'moments'>, 'author_id'>) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from('moments')
    .insert({ ...input, author_id: userData.user.id })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getMyMomentsToday() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('moments')
    .select('*')
    .eq('author_id', userData.user.id)
    .eq('posted_date', today);
  if (error) throw error;
  return data;
}

export async function getMomentsByAuthor(authorId: string) {
  const { data, error } = await supabase
    .from('moments')
    .select('*')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// RLS already restricts rows to self + active-friendship authors, so this
// is just "everything visible to me," newest first. `moment_replies(count)`
// is a PostgREST embedded aggregate — one query, no per-card round trip.
export async function getFeed(limit = 50) {
  const { data, error } = await supabase
    .from('moments')
    .select('*, author:profiles(display_name, username, avatar_url), moment_replies(count)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getMoment(id: string) {
  const { data, error } = await supabase
    .from('moments')
    .select('*, author:profiles(display_name, username, avatar_url)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
