import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { createConnectSession } from '@/queries/connect-sessions';
import { useConnectStore } from '@/stores/connect-store';

// Owns the lifecycle of one connect ritual: creates a session, renders its
// QR, and listens for the moment either side's scan flips this session's
// row to 'matched' (see the match_connect_session RPC).
export function useConnectSession() {
  const { status, sessionId, token, setWaiting, setError, setMatched } = useConnectStore();

  useEffect(() => {
    if (status !== 'idle') return;

    createConnectSession()
      .then((session) => setWaiting(session.id, session.token))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not start connect'));
  }, [status, setWaiting, setError]);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`connect-session-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'connect_sessions', filter: `id=eq.${sessionId}` },
        async (payload) => {
          const row = payload.new as { status: string; matched_with_session_id: string | null };
          if (row.status !== 'matched' || !row.matched_with_session_id) return;

          // The scanning device already has the friendship id from the RPC
          // return value; the scanned device learns about the match here and
          // resolves the friendship from the other party's session record.
          const [{ data: userData }, { data: otherSession }] = await Promise.all([
            supabase.auth.getUser(),
            supabase
              .from('connect_sessions')
              .select('user_id')
              .eq('id', row.matched_with_session_id)
              .single(),
          ]);
          if (!userData?.user || !otherSession) return;

          const a = userData.user.id < otherSession.user_id ? userData.user.id : otherSession.user_id;
          const b = userData.user.id < otherSession.user_id ? otherSession.user_id : userData.user.id;
          const { data: friendship } = await supabase
            .from('friendships')
            .select('id')
            .eq('user_a_id', a)
            .eq('user_b_id', b)
            .single();
          if (friendship) setMatched(friendship.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, setMatched]);

  return { status, sessionId, token };
}
