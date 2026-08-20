import { useCallback, useOptimistic, useTransition } from 'react';

import { useAsyncResource } from '@/hooks/use-async-resource';
import { createReply, getReplies } from '@/queries/moment-replies';

export type MomentReply = Awaited<ReturnType<typeof getReplies>>[number];

/** The embedded author of a reply, plus the id the row itself is keyed by. */
export type ReplyAuthor = MomentReply['author'] & { id: string };

const EMPTY: MomentReply[] = [];

// Marks a reply that only exists on this device. The row is replaced wholesale
// by the next authoritative read, so nothing downstream has to reconcile ids.
export function isPendingReply(reply: MomentReply) {
  return reply.id.startsWith('pending:');
}

export function useMomentReplies(momentId: string) {
  const fetch = useCallback(() => getReplies(momentId), [momentId]);

  const { data, loading, error, refresh } = useAsyncResource(fetch, {
    initialData: EMPTY,
    errorFallback: 'Could not load replies',
    realtime: {
      channel: `moment-replies-${momentId}`,
      tables: [{ table: 'moment_replies', filter: `moment_id=eq.${momentId}` }],
    },
  });

  const [sending, startSending] = useTransition();
  const [replies, addPendingReply] = useOptimistic(data, (current, pending: MomentReply) => [
    ...current,
    pending,
  ]);

  /**
   * Shows the reply immediately instead of after the insert *and* its realtime
   * echo have round-tripped. React drops the optimistic row when the
   * transition ends, so the insert and the authoritative refetch both have to
   * happen inside it — otherwise the row would blink out between the two.
   */
  const send = useCallback(
    (author: ReplyAuthor, body: string) => {
      const pending: MomentReply = {
        id: `pending:${author.id}:${body}`,
        moment_id: momentId,
        author_id: author.id,
        body,
        created_at: new Date().toISOString(),
        author,
      };

      return new Promise<void>((resolve, reject) => {
        startSending(async () => {
          addPendingReply(pending);
          try {
            await createReply(momentId, body);
            await refresh();
            resolve();
          } catch (err) {
            // The transition still ends cleanly, which is what discards the
            // optimistic row — no manual rollback needed.
            reject(err);
          }
        });
      });
    },
    [momentId, addPendingReply, refresh]
  );

  return { replies, loading, error, refresh, send, sending };
}
