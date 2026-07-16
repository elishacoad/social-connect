import { supabase } from '@/lib/supabase';

// Fetches every non-removed friendship (active AND faded) in one query so
// the two lists can never momentarily disagree — callers split them
// client-side with isFullyFaded(). Still sorted by last_interaction_at even
// though neither list displays the raw timestamp (product.md: no scores).
export async function getMyFriendships() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from('friendships')
    .select('*, user_a:profiles!friendships_user_a_id_fkey(*), user_b:profiles!friendships_user_b_id_fkey(*)')
    .or(`user_a_id.eq.${userData.user.id},user_b_id.eq.${userData.user.id}`)
    .is('removed_at', null)
    .order('last_interaction_at', { ascending: false });
  if (error) throw error;

  // Normalize to "the other person," since a friendship row doesn't know
  // which side is "me."
  return data.map((row) => ({
    ...row,
    friend: row.user_a_id === userData.user.id ? row.user_b : row.user_a,
  }));
}

export async function getFriendship(otherUserId: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const a = userData.user.id < otherUserId ? userData.user.id : otherUserId;
  const b = userData.user.id < otherUserId ? otherUserId : userData.user.id;

  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('user_a_id', a)
    .eq('user_b_id', b)
    .maybeSingle();
  if (error) throw error;
  return data;
}
