-- EdFind — uninstall application_tasks.
--
-- NOT applied automatically. Run by hand from the dashboard SQL editor if
-- the task kanban feature is being removed:
--   1. Make sure no code path still references public.application_tasks.
--   2. Run this file.
--
-- Mirror of 20260514120000_add_application_tasks.sql.

drop trigger if exists application_tasks_set_updated_at on public.application_tasks;
drop index if exists application_tasks_application_id_idx;
drop index if exists application_tasks_status_idx;
drop index if exists application_tasks_user_id_idx;
drop table if exists public.application_tasks;
drop type if exists task_category;
drop type if exists task_status;
