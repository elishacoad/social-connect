-- Product decision: remove the one-moment-per-day limit. Users can now post
-- as many moments as they like; posted_date only ever existed to back the
-- unique(author_id, posted_date) constraint, so it goes with it.
alter table public.moments drop constraint moments_author_id_posted_date_key;
alter table public.moments drop column posted_date;
