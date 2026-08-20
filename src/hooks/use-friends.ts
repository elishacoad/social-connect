import { useMemo } from 'react';

import { useAsyncResource } from '@/hooks/use-async-resource';
import { getMyFriendships } from '@/queries/friendships';
import { isFullyFaded } from '@/utils/fade';

export type Friendship = Awaited<ReturnType<typeof getMyFriendships>>[number];

const EMPTY: Friendship[] = [];

export function useFriends() {
  const { data, loading, error, refresh } = useAsyncResource(getMyFriendships, {
    initialData: EMPTY,
    errorFallback: 'Could not load your friends',
    // A new friendship is written by the other device (via the connect RPC),
    // so this list is only live if it watches the table. profiles rides along
    // because the embedded friend record carries name and avatar.
    realtime: {
      channel: 'friendships',
      tables: [{ table: 'friendships' }, { table: 'profiles' }],
    },
  });

  // Memoized so the two lists keep referential identity between renders —
  // both feed FlatLists, which re-render on every new array.
  const { friendships, faded } = useMemo(
    () => ({
      friendships: data.filter((f) => !isFullyFaded(f)),
      faded: data.filter((f) => isFullyFaded(f)),
    }),
    [data]
  );

  return { friendships, faded, loading, error, refresh };
}
