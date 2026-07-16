import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { getFeed } from '@/queries/moments';

export type FeedMoment = Awaited<ReturnType<typeof getFeed>>[number];

export function useFeed() {
  const [moments, setMoments] = useState<FeedMoment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    return getFeed()
      .then(setMoments)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();

    // RLS re-evaluates per row, so a broad refetch on any insert is simplest
    // and correct — the DB still filters to what this user can see.
    const channel = supabase
      .channel('moments-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moments' }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { moments, loading, refresh };
}
