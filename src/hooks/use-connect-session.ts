import { useEffect } from 'react';

import { errorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { createConnectSession } from '@/queries/connect-sessions';
import { getFriendshipForMatchedSession } from '@/queries/friendships';
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
      .catch((err) => setError(errorMessage(err, 'Could not start connect')));
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

          const friendship = await getFriendshipForMatchedSession(row.matched_with_session_id).catch(
            () => null
          );
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
