import { supabase } from '@/lib/supabase';

export async function getReplies(momentId: string) {
  const { data, error } = await supabase
    .from('moment_replies')
    .select('*, author:profiles(display_name, username, avatar_url)')
    .eq('moment_id', momentId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createReply(momentId: string, body: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from('moment_replies')
    .insert({ moment_id: momentId, author_id: userData.user.id, body })
    .select('*, author:profiles(display_name, username, avatar_url)')
    .single();
  if (error) throw error;
  return data;
}
