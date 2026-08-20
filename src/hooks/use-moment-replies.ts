import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { getReplies } from '@/queries/moment-replies';

export type MomentReply = Awaited<ReturnType<typeof getReplies>>[number];

export function useMomentReplies(momentId: string) {
  const [replies, setReplies] = useState<MomentReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    return getReplies(momentId)
      .then((rows) => {
        setReplies(rows);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load replies'))
      .finally(() => setLoading(false));
  }, [momentId]);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel(`moment-replies-${momentId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'moment_replies', filter: `moment_id=eq.${momentId}` },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [momentId, refresh]);

  return { replies, loading, error, refresh };
}
