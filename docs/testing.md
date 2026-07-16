# Testing

Read this before writing or running any test — commands, conventions, and the gotchas that cost real time to figure out the first time.

## Two layers

**JS/React logic → Jest.** Pure functions and stores only — `src/utils/*.ts`, `src/lib/utils.ts`, `src/stores/*.ts`. Colocate as `<file>.test.ts`. Run with `npm test` (or `npm run test:watch`). Config lives in `package.json`'s `"jest"` key using the `jest-expo` preset — don't add a separate `jest.config.js`. These tests need no network, no database, no simulator; if a function doesn't touch Supabase/storage/the DOM, it gets a unit test here.

**RLS / constraints / RPC logic → pgTAP.** This is the layer people building on Supabase usually skip, and it's the one that actually enforces the app's rules (fade cutoff, one-moment-per-day, mutual-connect matching) — none of that lives in TypeScript, it lives in Postgres, so a mocked Supabase client can't catch a bug in it. Tests live in `supabase/tests/database/*.sql`, written as pgTAP (`plan()`, `ok()`, `results_eq()`, `throws_ok()`, `finish()`), wrapped in `begin; ... rollback;` so nothing ever persists.

## Running pgTAP tests

Real path: `supabase test db` — requires `supabase start` first, which requires **Docker Desktop running**.

If Docker isn't up, validate a test file's logic directly against the live dev DB via the Supabase MCP's `execute_sql`, pasting the file's body verbatim (still wrapped in `begin`/`rollback` — never drop that wrapper against a real project).

`execute_sql` only returns the last statement's result, so to see each individual `ok`/`not ok` line instead of just `finish()`'s summary:

```sql
create temporary table test_results (line text);
grant insert on test_results to authenticated; -- set local role authenticated runs as a
                                                 -- different role than the one that created the table

insert into test_results select plan(N);
insert into test_results select ok(...);        -- repeat per assertion
insert into test_results select finish();

select line from test_results;
```

## Simulating a specific user in raw SQL

Inside a pgTAP block, or any ad-hoc debugging session:

```sql
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<user-uuid>"}';
```

This is what `auth.uid()` reads inside RLS policies and `SECURITY DEFINER` functions. `reset role;` when a check needs to see across both users' rows — each user's own RLS legitimately hides the other's (e.g. asserting on both sides of a connect match).

## Manually provisioning a test user

To test without burning Supabase's free-tier signup email rate limit, insert directly into `auth.users`. A minimal `email`/`encrypted_password` row is **not enough** — GoTrue also needs:

- `instance_id = '00000000-0000-0000-0000-000000000000'`
- The token columns (`confirmation_token`, `recovery_token`, `email_change_token_new`, `email_change`) set to `''`, not left `NULL`
- A matching row in `auth.identities` (provider `'email'`, `identity_data` containing `sub`/`email`/`email_verified`)

Skip the `identities` row and sign-in fails with "Invalid login credentials" even though the user row looks completely correct — this is the mistake to check first if a manually-provisioned user won't log in.

## What's not covered

End-to-end/UI tests (Detox/Maestro) aren't set up. Skipped deliberately for now — slow and brittle relative to payoff at this stage. Revisit once core flows stabilize and the concern shifts from "is this correct" to "did I just regress something."
