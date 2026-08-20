import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/queries/session';

// friendships enforces `check (user_a_id < user_b_id)`, so every lookup by
// pair has to sort the two ids the same way the row was written.
export function sortedPair(x: string, y: string) {
  return x < y ? ([x, y] as const) : ([y, x] as const);
}

// Fetches every non-removed friendship (active AND faded) in one query so
// the two lists can never momentarily disagree — callers split them
// client-side with isFullyFaded(). Still sorted by last_interaction_at even
// though neither list displays the raw timestamp (product.md: no scores).
export async function getMyFriendships() {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('friendships')
    .select('*, user_a:profiles!friendships_user_a_id_fkey(*), user_b:profiles!friendships_user_b_id_fkey(*)')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .is('removed_at', null)
    .order('last_interaction_at', { ascending: false });
  if (error) throw error;

  // Normalize to "the other person," since a friendship row doesn't know
  // which side is "me."
  return data.map((row) => ({
    ...row,
    friend: row.user_a_id === userId ? row.user_b : row.user_a,
  }));
}

export async function getFriendship(otherUserId: string) {
  const userId = await getCurrentUserId();

  const [a, b] = sortedPair(userId, otherUserId);

  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('user_a_id', a)
    .eq('user_b_id', b)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// The scanning device gets its friendship id straight back from the
// match_connect_session RPC. The scanned device only learns it was matched
// via realtime, so it resolves the friendship from the other party's session.
export async function getFriendshipForMatchedSession(matchedSessionId: string) {
  const userId = await getCurrentUserId();

  const { data: otherSession, error: sessionError } = await supabase
    .from('connect_sessions')
    .select('user_id')
    .eq('id', matchedSessionId)
    .single();
  if (sessionError) throw sessionError;

  const [a, b] = sortedPair(userId, otherSession.user_id);
  const { data, error } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_a_id', a)
    .eq('user_b_id', b)
    .maybeSingle();
  if (error) throw error;
  return data;
}
