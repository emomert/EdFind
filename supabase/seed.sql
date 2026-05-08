-- EdFind seed data
--
-- 11 universities + 13 master's programs spanning Italy, the Netherlands,
-- Germany, and the United Kingdom. Field-of-study coverage is balanced
-- across all 8 enum values.
--
-- Idempotent: every INSERT uses ON CONFLICT DO UPDATE keyed on the
-- relevant unique constraint, so re-running this file converges existing
-- rows to whatever the file currently says. Run this AFTER applying the
-- migrations under supabase/migrations/.
--
-- Tuition figures and deadlines were sourced from official university
-- pages on 2026-05-08 by parallel research agents. Treat tuition and
-- deadlines as point-in-time and refresh annually — universities update
-- these on their own cadence.
--
-- is_partner is intentionally NOT included in the ON CONFLICT DO UPDATE
-- clause for universities, so any partner deals toggled by hand in the
-- dashboard survive a re-seed.

-- ─────────────────────────────────────────────────────────────────────────
-- Universities
-- ─────────────────────────────────────────────────────────────────────────

insert into public.universities (
  slug, name, country, city, institution_type, website,
  description, established_year, student_count, qs_world_rank, is_partner
) values
  (
    'politecnico-di-milano',
    'Politecnico di Milano',
    'IT', 'Milan', 'public',
    'https://www.polimi.it/en',
    'Italy''s largest technical university, focused on engineering, architecture, and design. Based in Milan with strong international placement and one of the most-recognised Italian institutions for graduate study in technical fields.',
    1863, 48000, 98, false
  ),
  (
    'bocconi-university',
    'Bocconi University',
    'IT', 'Milan', 'private',
    'https://www.unibocconi.it/en',
    'A private Italian university in Milan specialising in economics, management, finance, and law, with strong international placement in business and finance.',
    1902, 14500, null, false
  ),
  (
    'tu-delft',
    'Delft University of Technology',
    'NL', 'Delft', 'public',
    'https://www.tudelft.nl/en',
    'The largest and oldest Dutch technological university, with research strengths across engineering, computer science, and applied sciences.',
    1842, 27000, 47, false
  ),
  (
    'tu-eindhoven',
    'Eindhoven University of Technology',
    'NL', 'Eindhoven', 'public',
    'https://www.tue.nl/en',
    'A research university in the Brainport Eindhoven region, specialising in engineering and technology with close partnerships with the Dutch high-tech industry.',
    1956, 13000, 140, false
  ),
  (
    'erasmus-university-rotterdam',
    'Erasmus University Rotterdam',
    'NL', 'Rotterdam', 'public',
    'https://www.eur.nl/en',
    'A Dutch research university with international reputation in economics, business, social sciences, and health.',
    1913, 33000, 140, false
  ),
  (
    'technical-university-of-munich',
    'Technical University of Munich',
    'DE', 'Munich', 'public',
    'https://www.tum.de/en',
    'A leading German research university covering engineering, natural sciences, life sciences, medicine, and management.',
    1868, 52000, 22, false
  ),
  (
    'karlsruhe-institute-of-technology',
    'Karlsruhe Institute of Technology',
    'DE', 'Karlsruhe', 'public',
    'https://www.kit.edu/english',
    'A German public research university in Baden-Württemberg combining a traditional technical university with a national research centre, with strengths in engineering, natural sciences, and computing.',
    1825, 22800, 102, false
  ),
  (
    'university-of-mannheim',
    'University of Mannheim',
    'DE', 'Mannheim', 'public',
    'https://www.uni-mannheim.de/en',
    'A German public research university in southwestern Germany, particularly well-known for economics, business, and the social sciences.',
    1967, 12000, 421, false
  ),
  (
    'london-school-of-economics',
    'London School of Economics and Political Science',
    'GB', 'London', 'public',
    'https://www.lse.ac.uk',
    'A world-leading social science university in central London, focused on economics, politics, law, and international relations.',
    1895, 13000, 50, false
  ),
  (
    'london-business-school',
    'London Business School',
    'GB', 'London', 'public',
    'https://www.london.edu',
    'A specialist postgraduate business school of the University of London, consistently ranked among the world''s top business schools.',
    1964, 2500, null, false
  ),
  (
    'imperial-college-london',
    'Imperial College London',
    'GB', 'London', 'public',
    'https://www.imperial.ac.uk',
    'A research university in central London focused on science, engineering, medicine, and business.',
    1907, 22000, 2, false
  )
on conflict (slug) do update set
  name = excluded.name,
  country = excluded.country,
  city = excluded.city,
  institution_type = excluded.institution_type,
  website = excluded.website,
  description = excluded.description,
  established_year = excluded.established_year,
  student_count = excluded.student_count,
  qs_world_rank = excluded.qs_world_rank;

-- ─────────────────────────────────────────────────────────────────────────
-- Programs
-- ─────────────────────────────────────────────────────────────────────────

-- Italy: 3 programs across business_management, design, architecture_built_environment, economics_finance.

-- Polimi · MSc Management Engineering (existing)
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-management-engineering',
  'MSc in Management Engineering',
  'MSc', 'business_management', 'en',
  24, 3898.00, 'EUR', null, 'September',
  'A two-year English-taught master''s combining engineering rigor with management, finance, and operations training. Designed for graduates aiming at consulting, technology management, or operations roles in international companies.',
  jsonb_build_object(
    'gpa_min', 'B+',
    'language_tests', jsonb_build_array('IELTS 6.0', 'TOEFL iBT 78', 'Cambridge B2 First'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter')
  ),
  null, null
from public.universities u where u.slug = 'politecnico-di-milano'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Polimi · MSc Product Service System Design
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-product-service-system-design',
  'MSc in Product Service System Design',
  'MSc', 'design', 'en',
  24, 3898.20, 'EUR', date '2026-01-29', 'September',
  'A two-year design programme that trains students to conceive integrated product, service, and communication strategies. Coursework blends design studios with project management, sustainability, supply-chain thinking, and ethnographic research. Tuition shown is the maximum non-EU figure; EU/EEA students pay an income-based contribution.',
  jsonb_build_object(
    'gpa_min', 'B',
    'language_tests', jsonb_build_array('IELTS 6.0', 'TOEFL iBT 78'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Portfolio', 'Reference letters')
  ),
  6, 'Art & Design'
from public.universities u where u.slug = 'politecnico-di-milano'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Polimi · MSc Architecture - Built Environment - Interiors
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-architecture-built-environment-interiors',
  'MSc in Architecture - Built Environment - Interiors',
  'MSc', 'architecture_built_environment', 'en',
  24, 3898.20, 'EUR', date '2026-01-29', 'September',
  'A two-year English-taught architecture programme allowing students to personalise their plan through thematic design studios, balancing the theoretical, practical, and applied aspects of designing buildings, interiors, and the broader built environment. Tuition shown is the maximum non-EU figure; EU/EEA students pay an income-based contribution.',
  jsonb_build_object(
    'gpa_min', 'B',
    'language_tests', jsonb_build_array('IELTS 6.0', 'TOEFL iBT 78'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Portfolio', 'Reference letters')
  ),
  7, 'Architecture / Built Environment'
from public.universities u where u.slug = 'politecnico-di-milano'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Bocconi · MSc Finance
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-finance',
  'MSc in Finance',
  'MSc', 'economics_finance', 'en',
  24, 18550.00, 'EUR', date '2026-02-13', 'September',
  'A quantitatively rigorous two-year finance programme covering corporate finance, asset management, financial markets, risk management, and quantitative methods, with electives in fintech and sustainable finance. Strong placement into investment banking, asset management, and consulting in Europe.',
  jsonb_build_object(
    'gpa_min', 'B+',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'GMAT or GRE', 'Reference letters')
  ),
  null, 'Economics & Econometrics'
from public.universities u where u.slug = 'bocconi-university'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Netherlands: 3 programs across data_science, engineering, social_sciences.

-- TU Delft · MSc Data Science and Artificial Intelligence Technology
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-data-science-and-artificial-intelligence-technology',
  'MSc Data Science and Artificial Intelligence Technology',
  'MSc', 'data_science', 'en',
  24, 22290.00, 'EUR', date '2026-01-15', 'September',
  'A research-oriented two-year programme combining advanced machine learning, data engineering, and AI systems with a strong technical computer-science foundation. Includes substantial coursework, electives, and a thesis in collaboration with industry or TU Delft research groups.',
  jsonb_build_object(
    'gpa_min', 'Top quartile of class (≈ GPA 3.0 / 75%)',
    'language_tests', jsonb_build_array('IELTS 6.5 (min 6.0 per section)', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'GRE General Test', 'Letters of recommendation')
  ),
  13, 'Engineering & Technology'
from public.universities u where u.slug = 'tu-delft'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- TU Eindhoven · MSc Mechanical Engineering
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-mechanical-engineering',
  'MSc Mechanical Engineering',
  'MSc', 'engineering', 'en',
  24, 21700.00, 'EUR', date '2026-05-01', 'September',
  'A two-year programme covering dynamics and control, thermo-fluids, materials, and manufacturing, with specialisation tracks aligned to TU/e research groups. Combines advanced coursework with internships and a graduation project, often executed with industrial partners in the Eindhoven high-tech ecosystem.',
  jsonb_build_object(
    'gpa_min', 'Equivalent to a Dutch 7/10',
    'language_tests', jsonb_build_array('IELTS 6.5 (min 6.0 per section)', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Letters of recommendation', 'Passport copy')
  ),
  51, 'Engineering — Mechanical, Aeronautical & Manufacturing'
from public.universities u where u.slug = 'tu-eindhoven'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Erasmus University Rotterdam · MSc Sociology: Engaging Public Issues
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-sociology-engaging-public-issues',
  'MSc Sociology: Engaging Public Issues',
  'MSc', 'social_sciences', 'en',
  12, 21000.00, 'EUR', date '2026-05-01', 'September',
  'A one-year sociology master''s examining contemporary public issues such as inequality, migration, urban life, and digital culture. Combines theoretical seminars with applied research methods and a thesis grounded in real-world social problems.',
  jsonb_build_object(
    'gpa_min', 'Above-average results in a sociology or related social-science bachelor',
    'language_tests', jsonb_build_array('IELTS 7.0 (min 6.5 per section)', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Writing sample / research proposal')
  ),
  51, 'Sociology'
from public.universities u where u.slug = 'erasmus-university-rotterdam'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Germany: 3 programs across computer_science_ai, engineering, economics_finance.
-- Tuition figures reflect non-EU rates; EU students typically pay only a per-semester contribution.

-- TUM · MSc Informatics
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-informatics',
  'MSc in Informatics',
  'MSc', 'computer_science_ai', 'en',
  24, 12000.00, 'EUR', date '2026-05-31', 'October',
  'A research-oriented English-taught master''s covering core and advanced informatics with elective tracks in AI, machine learning, robotics, and software engineering. Bavaria charges non-EU students EUR 6,000 per semester (EUR 12,000/year); EU students pay only the semester contribution.',
  jsonb_build_object(
    'gpa_min', 'B+',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 88'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Proof of English proficiency')
  ),
  30, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'technical-university-of-munich'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- KIT · MSc Electrical Engineering and Information Technology
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-electrical-engineering-and-information-technology',
  'MSc in Electrical Engineering and Information Technology',
  'MSc', 'engineering', 'en',
  24, 3000.00, 'EUR', date '2026-07-15', 'October',
  'An English-taught master''s covering communications, electronics, energy systems, and embedded systems with research-oriented specialisations. Baden-Württemberg charges non-EU international students EUR 1,500 per semester (EUR 3,000/year); EU students pay only the semester contribution.',
  jsonb_build_object(
    'gpa_min', 'B',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Proof of English proficiency')
  ),
  80, 'Engineering — Electrical & Electronic'
from public.universities u where u.slug = 'karlsruhe-institute-of-technology'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Mannheim · MSc Economics
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-economics',
  'MSc in Economics',
  'MSc', 'economics_finance', 'en',
  24, 3000.00, 'EUR', date '2026-05-15', 'September',
  'A fully English-taught research-oriented master''s programme with rigorous coursework in micro, macro, and econometrics, and elective tracks in competition policy, finance, and quantitative economics. Baden-Württemberg charges non-EU international students EUR 1,500 per semester (EUR 3,000/year); EU students pay only the semester contribution.',
  jsonb_build_object(
    'gpa_min', 'B+ with strong quantitative coursework',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'GRE recommended')
  ),
  51, 'Economics & Econometrics'
from public.universities u where u.slug = 'university-of-mannheim'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- United Kingdom: 3 programs across social_sciences, business_management, computer_science_ai.

-- LSE · MSc International Relations
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-international-relations',
  'MSc International Relations',
  'MSc', 'social_sciences', 'en',
  12, 32500.00, 'GBP', date '2026-04-23', 'September',
  'A 12-month taught master''s covering theory and practice of international relations, including foreign policy, international organisations, conflict, and regional studies. Students complete core IR theory courses, optional units, and a 10,000-word dissertation.',
  jsonb_build_object(
    'gpa_min', '2:1 (UK Upper Second) or international equivalent',
    'language_tests', jsonb_build_array('IELTS 7.0 (6.5 per component)', 'TOEFL iBT 100 (25 per component)'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Statement of academic purpose', 'Two academic references')
  ),
  2, 'Politics & International Studies'
from public.universities u where u.slug = 'london-school-of-economics'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- LBS · Masters in Management
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'masters-in-management',
  'Masters in Management (MiM)',
  'MSc', 'business_management', 'en',
  12, 52950.00, 'GBP', date '2026-05-31', 'August',
  'A 12-month management master''s for recent graduates with up to two years of work experience. Combines core business courses (microeconomics, finance, accounting, marketing, strategy) with 90+ electives, the LondonLAB consulting project, and optional global immersion trips.',
  jsonb_build_object(
    'gpa_min', '2:1 (UK Upper Second) or international equivalent',
    'language_tests', jsonb_build_array('IELTS 7.5', 'TOEFL iBT 110'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'GMAT/GMAT Focus or GRE score', 'Essays', 'Two references', 'Interview')
  ),
  4, 'Business & Management Studies'
from public.universities u where u.slug = 'london-business-school'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Imperial · MSc Artificial Intelligence
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-artificial-intelligence',
  'MSc Artificial Intelligence',
  'MSc', 'computer_science_ai', 'en',
  12, 46000.00, 'GBP', date '2026-06-30', 'September',
  'A 12-month intensive master''s for mathematically strong STEM graduates covering programming, machine learning fundamentals, and applied AI. Students undertake industry-linked projects, examine ethical implications of AI, and complete an individual project that may take the form of a company internship.',
  jsonb_build_object(
    'gpa_min', 'First-class honours (UK 1st)',
    'language_tests', jsonb_build_array('IELTS 7.0 (6.5 per component)', 'TOEFL iBT 100 (22 per component)'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two academic references')
  ),
  8, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'imperial-college-london'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;
