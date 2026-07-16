import { useCallback, useEffect, useState } from 'react';

import { getMyMomentsToday } from '@/queries/moments';

export function useDailyPostStatus() {
  const [postedToday, setPostedToday] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    getMyMomentsToday()
      .then((moments) => setPostedToday(moments.length > 0))
      .catch(() => setPostedToday(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { postedToday, refresh };
}
