import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { errorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

// supabase.channel() hands back the *existing* channel when a topic name is
// reused, and removeChannel() unsubscribes asynchronously — so a re-run of the
// effect below could grab a channel that was already subscribed and throw
// "cannot add `postgres_changes` callbacks ... after `subscribe()`". Giving
// every subscription its own topic keeps them from colliding.
let channelSeq = 0;

type RealtimeBinding = {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
};

type RealtimeSpec = {
  channel: string;
  /** Every table whose changes should invalidate this resource. */
  tables: RealtimeBinding[];
};

type Options<T> = {
  initialData: T;
  /** Shown instead of a raw Postgres/PostgREST message when the fetch throws. */
  errorFallback: string;
  /** Refetches whenever a matching row changes. RLS re-filters on every read,
   *  so a broad refetch stays correct without replaying the change locally. */
  realtime?: RealtimeSpec;
};

/**
 * One fetch + loading/error/refresh triple, optionally kept live by a
 * Postgres changes subscription. `fetch` must be referentially stable
 * (wrap it in useCallback) — it drives the effect that owns the channel.
 *
 * Liveness has three legs, because a socket subscription alone silently
 * drops everything that happened while it was down:
 *   - postgres_changes, for changes arriving while subscribed
 *   - a refetch on re-SUBSCRIBED, to close the gap after a dropped socket
 *   - a refetch on app foreground, since the socket dies while backgrounded
 */
export function useAsyncResource<T>(fetch: () => Promise<T>, options: Options<T>) {
  const { initialData, errorFallback } = options;
  const { channel: channelName, tables } = options.realtime ?? {};

  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // A refetch that was already in flight when an optimistic write (or a newer
  // refetch) landed must not overwrite the fresher state on arrival.
  const latestRequest = useRef(0);

  const refresh = useCallback(() => {
    const request = ++latestRequest.current;

    return fetch()
      .then((result) => {
        if (request !== latestRequest.current) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (request !== latestRequest.current) return;
        setError(errorMessage(err, errorFallback));
      })
      .finally(() => {
        if (request !== latestRequest.current) return;
        setLoading(false);
      });
  }, [fetch, errorFallback]);

  // Applies a local change immediately and invalidates any in-flight refetch,
  // so an optimistic write survives until the next authoritative read.
  const mutate = useCallback((updater: (previous: T) => T) => {
    latestRequest.current++;
    setData(updater);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!channelName || !tables?.length) return;

    let subscribedBefore = false;
    const channel = supabase.channel(`${channelName}-${++channelSeq}`);

    for (const { table, event = '*', filter } of tables) {
      channel.on('postgres_changes', { event, schema: 'public', table, filter }, () => refresh());
    }

    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      // The first SUBSCRIBED pairs with the mount refetch above; only a
      // *re*-subscribe means we were disconnected and may have missed changes.
      if (subscribedBefore) refresh();
      subscribedBefore = true;
    });

    return () => {
      supabase.removeChannel(channel);
    };
    // `tables` is a fresh array literal on every render, so it is intentionally
    // keyed by its serialization rather than identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, channelName, JSON.stringify(tables)]);

  useEffect(() => {
    let backgrounded = AppState.currentState !== 'active';

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (backgrounded) refresh();
        backgrounded = false;
      } else {
        backgrounded = true;
      }
    });

    return () => subscription.remove();
  }, [refresh]);

  return { data, loading, error, refresh, mutate };
}
