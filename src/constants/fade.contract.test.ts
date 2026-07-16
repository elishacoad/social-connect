import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FADE_INTERACTION_DAYS, FADE_PHYSICAL_DAYS } from './fade';

// The `active_friendships` SQL view (supabase/migrations/…create_friendships.sql)
// re-implements this same 270/90 day threshold independently in Postgres, because
// it gates RLS-visible rows and can't call back into the TS client. The two are
// kept in sync only by comment ("Values mirror src/constants/fade.ts") — this
// test makes that contract enforceable: it reads the actual interval literals out
// of the migration SQL and fails if either side changes without the other.
const MIGRATIONS_DIR = join(__dirname, '../../supabase/migrations');
const FRIENDSHIPS_MIGRATION = '20260716025705_create_friendships.sql';

function activeFriendshipsViewSql(): string {
  const sql = readFileSync(join(MIGRATIONS_DIR, FRIENDSHIPS_MIGRATION), 'utf8');
  const viewStart = sql.indexOf('create view public.active_friendships');
  if (viewStart === -1) {
    throw new Error(`active_friendships view not found in ${FRIENDSHIPS_MIGRATION} — did it move?`);
  }
  const viewEnd = sql.indexOf(';', viewStart);
  return sql.slice(viewStart, viewEnd);
}

function extractIntervalDays(viewSql: string, column: 'last_physical_at' | 'last_interaction_at'): number {
  const pattern = new RegExp(`${column}\\s*>\\s*now\\(\\)\\s*-\\s*interval '(\\d+) days'`);
  const match = viewSql.match(pattern);
  if (!match) {
    throw new Error(
      `could not find "${column} > now() - interval '<n> days'" in active_friendships — did the SQL shape change?`
    );
  }
  return Number(match[1]);
}

describe('Freshness threshold contract (TS vs SQL)', () => {
  const viewSql = activeFriendshipsViewSql();

  it('FADE_PHYSICAL_DAYS matches the active_friendships view', () => {
    expect(FADE_PHYSICAL_DAYS).toBe(extractIntervalDays(viewSql, 'last_physical_at'));
  });

  it('FADE_INTERACTION_DAYS matches the active_friendships view', () => {
    expect(FADE_INTERACTION_DAYS).toBe(extractIntervalDays(viewSql, 'last_interaction_at'));
  });
});
