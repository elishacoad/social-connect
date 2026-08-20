import { useAsyncResource } from '@/hooks/use-async-resource';
import { getFeed } from '@/queries/moments';

export type FeedMoment = Awaited<ReturnType<typeof getFeed>>[number];

const EMPTY: FeedMoment[] = [];

export function useFeed() {
  const { data, loading, error, refresh, mutate } = useAsyncResource(getFeed, {
    initialData: EMPTY,
    errorFallback: 'Could not load your timeline',
    // Reply counts ride along as an embedded aggregate, so a new reply changes
    // the feed without touching the moments table — it needs its own binding.
    realtime: {
      channel: 'moments-feed',
      tables: [{ table: 'moments' }, { table: 'moment_replies' }],
    },
  });

  function removeMoment(id: string) {
    mutate((moments) => moments.filter((moment) => moment.id !== id));
  }

  return { moments: data, loading, error, refresh, removeMoment };
}
