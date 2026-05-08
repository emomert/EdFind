-- EdFind — seed data
-- Run after migrations. Idempotent: re-running is a no-op (ON CONFLICT DO NOTHING).
--
-- MVP seed: one university + one program. The placeholder matcher returns
-- this program for every profile until Phase 6+ when real matching ships.

insert into public.universities (
  slug, name, country, city, institution_type, website, description,
  established_year, student_count, is_partner
) values (
  'politecnico-di-milano',
  'Politecnico di Milano',
  'IT',
  'Milan',
  'public',
  'https://www.polimi.it',
  'A leading Italian technical university focused on engineering, architecture, and design. Strong international footprint and one of the most-recognized Italian universities for graduate study in Europe.',
  1863,
  47000,
  false
)
on conflict (slug) do nothing;

insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, start_month, description,
  requirements
)
select
  u.id,
  'msc-management-engineering',
  'MSc in Management Engineering',
  'MSc',
  'business_management',
  'en',
  24,
  3898.00,
  'EUR',
  'September',
  'A two-year English-taught master''s program combining engineering rigor with management, finance, and operations training. Designed for graduates aiming at consulting, technology management, or operations roles in international companies.',
  jsonb_build_object(
    'gpa_min', 'B+',
    'language_tests', jsonb_build_array('IELTS 6.0', 'TOEFL iBT 78', 'Cambridge B2 First'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter')
  )
from public.universities u
where u.slug = 'politecnico-di-milano'
on conflict (university_id, slug) do nothing;
