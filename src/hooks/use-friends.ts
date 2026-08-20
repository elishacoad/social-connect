import { useCallback, useEffect, useState } from 'react';

import { getMyFriendships } from '@/queries/friendships';
import { isFullyFaded } from '@/utils/fade';

export type Friendship = Awaited<ReturnType<typeof getMyFriendships>>[number];

export function useFriends() {
  const [all, setAll] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    return getMyFriendships()
      .then((rows) => {
        setAll(rows);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load your friends'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const friendships = all.filter((f) => !isFullyFaded(f));
  const faded = all.filter((f) => isFullyFaded(f));

  return { friendships, faded, loading, error, refresh };
}
