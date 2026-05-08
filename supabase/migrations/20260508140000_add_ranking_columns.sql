-- Add QS rankings to universities and programs.
--
-- Rankings are stored as nullable ints because not every institution or
-- program is QS-ranked, and we'd rather show "no rank listed" than fake one.
-- The subject area is captured as a free-text label (e.g.
-- "Computer Science & Information Systems") rather than a foreign key,
-- because QS subject taxonomy doesn't cleanly map to our coarser
-- field_of_study enum and trying to force the mapping creates noise.

alter table public.universities
  add column qs_world_rank int;

alter table public.programs
  add column qs_subject_rank int,
  add column qs_subject_area text;

-- Helpful for "top N programs" queries later.
create index programs_qs_subject_rank_idx
  on public.programs (qs_subject_rank)
  where qs_subject_rank is not null;
