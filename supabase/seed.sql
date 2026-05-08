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

-- ═════════════════════════════════════════════════════════════════════════
-- PHASE 7 — pan-European catalog expansion (2026-05-08)
-- 27 universities + 41 master's programs sourced by 5 parallel research
-- agents. Sections: Spain/Portugal · France · Switzerland/Austria ·
-- Sweden/Denmark/Finland · UK/Ireland/Belgium top-up.
-- Post-Phase-7 totals: 38 universities, 54 programs across 11 countries.
-- ═════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- Spain & Portugal: 5 universities, 8 master's programs across
-- business_management, data_science, economics_finance, computer_science_ai.
-- ─────────────────────────────────────────────────────────────────────────

insert into public.universities (
  slug, name, country, city, institution_type, website,
  description, established_year, student_count, qs_world_rank, is_partner
) values
  (
    'ie-university',
    'IE University',
    'ES', 'Madrid', 'private',
    'https://www.ie.edu/university',
    'A private Spanish university with campuses in Madrid and Segovia, internationally recognised for its business school and graduate programmes. Highly diverse student body (160+ nationalities) with English-taught masters across management, finance, analytics, law, and the humanities.',
    1973, 10000, 435, false
  ),
  (
    'esade-business-school',
    'Esade',
    'ES', 'Barcelona', 'private',
    'https://www.esade.edu/en',
    'A private Spanish business and law school based in Barcelona, part of Ramon Llull University. Consistently ranked among the world''s top business schools for its Master in Management, Master in Finance, and MBA programmes.',
    1958, 15500, 436, false
  ),
  (
    'universidad-carlos-iii-de-madrid',
    'Universidad Carlos III de Madrid',
    'ES', 'Madrid', 'public',
    'https://www.uc3m.es/Home',
    'A young public Spanish research university based in Madrid (Getafe, Leganés, Colmenarejo), known for strengths in economics, business, engineering, and law, with a notable share of English-taught masters.',
    1989, 22000, 285, false
  ),
  (
    'iese-business-school',
    'IESE Business School',
    'ES', 'Barcelona', 'private',
    'https://www.iese.edu',
    'The graduate business school of the University of Navarra, based in Barcelona with additional campuses in Madrid, Munich, New York, and São Paulo. Consistently ranked among the world''s top business schools for its MBA, Executive MBA, and Master in Management.',
    1958, 5500, null, false
  ),
  (
    'nova-school-of-business-and-economics',
    'NOVA School of Business and Economics',
    'PT', 'Lisbon', 'public',
    'https://www.novasbe.unl.pt/en',
    'The business and economics school of NOVA University Lisbon, based on a modern campus in Carcavelos near Lisbon. The parent NOVA University Lisbon is ranked in the QS World University Rankings 2025; NOVA SBE is consistently ranked among Europe''s top business schools for finance, management, and economics.',
    1978, 3200, 388, false
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

-- IE University · Master in Management
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-management',
  'Master in Management',
  'MSc', 'business_management', 'en',
  11, 47300.00, 'EUR', null, 'September',
  'An intensive English-taught one-year management master''s for recent graduates, blending core business fundamentals (finance, marketing, strategy, accounting, operations) with project-based learning, electives, and an international exchange or internship. IE operates rolling admissions; the September intake is the larger one. Tuition shown is the full single-payment fee for the September 2026 intake; an additional EUR 1,200 enrollment contribution to the IE Foundation applies.',
  jsonb_build_object(
    'gpa_min', 'Strong undergraduate record',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Essays', 'GMAT/GRE/IE Admissions Test', 'Two references', 'Interview')
  ),
  9, 'Business & Management Studies'
from public.universities u where u.slug = 'ie-university'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- IE University · Master in Business Analytics & Big Data
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-business-analytics-and-big-data',
  'Master in Business Analytics & Big Data',
  'MSc', 'data_science', 'en',
  10, 39200.00, 'EUR', null, 'September',
  'An English-taught analytics master''s training students in machine learning, big-data engineering, business intelligence, and data-driven decision making, with strong emphasis on applied projects with corporate partners. IE operates rolling admissions. Tuition shown is the full single-payment fee for the September 2026 intake; an additional EUR 1,200 enrollment contribution to the IE Foundation applies.',
  jsonb_build_object(
    'gpa_min', 'Strong undergraduate record',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Essays', 'GMAT/GRE/IE Admissions Test', 'Two references', 'Interview')
  ),
  10, 'Business Analytics'
from public.universities u where u.slug = 'ie-university'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- ESADE · MSc in Finance
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-in-finance',
  'MSc in Finance',
  'MSc', 'economics_finance', 'en',
  12, 37500.00, 'EUR', null, 'September',
  'A 10-12 month full-time English-taught master''s combining rigorous quantitative finance coursework with applied projects across corporate finance, asset management, and capital markets. Optional electives in language (Spanish, German, French, Mandarin) and strong placement into investment banking and asset management. ESADE uses a multi-round rolling admissions calendar.',
  jsonb_build_object(
    'gpa_min', 'Strong undergraduate record in a quantitative discipline',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation essays', 'GMAT/GRE/ESADE Admissions Test', 'Two references', 'Interview')
  ),
  7, 'Finance'
from public.universities u where u.slug = 'esade-business-school'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- UC3M · Master in Big Data Analytics
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-big-data-analytics',
  'Master in Big Data Analytics',
  'MSc', 'computer_science_ai', 'en',
  12, 7200.00, 'EUR', null, 'September',
  'A 12-month English-taught master''s training students to extract value from very large datasets in companies and organisations, with a balanced curriculum across data engineering, statistical learning, and business analytics. Tuition shown is the public-tuition figure for the most recent confirmed academic year; the 2026/27 fee is pending approval by the Community of Madrid.',
  jsonb_build_object(
    'gpa_min', 'Bachelor with quantitative or computing background',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 87', 'Cambridge B2 First'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Reference letters')
  ),
  null, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'universidad-carlos-iii-de-madrid'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- UC3M · Master in Economic Analysis
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-economic-analysis',
  'Master in Economic Analysis',
  'MSc', 'economics_finance', 'en',
  24, 5500.00, 'EUR', null, 'September',
  'A two-year English-taught research-oriented master''s with rigorous coursework in microeconomics, macroeconomics, and econometrics, designed as a stepping stone to a PhD in economics or to a research-analyst career. Tuition is the indicative public-tuition figure; the official 2026/27 fee is pending approval by the Community of Madrid.',
  jsonb_build_object(
    'gpa_min', 'Strong record in economics, mathematics, or statistics',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 87'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Two academic references', 'GRE recommended')
  ),
  null, 'Economics & Econometrics'
from public.universities u where u.slug = 'universidad-carlos-iii-de-madrid'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- IESE · Master in Management
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-management',
  'Master in Management',
  'MSc', 'business_management', 'en',
  11, 39000.00, 'EUR', null, 'September',
  'An 11-month English-taught leadership-development master''s for recent graduates, with core coursework in finance, marketing, strategy, and operations alongside electives, an international module, and an applied capstone. Tuition shown is the indicative annualised figure (program total approximately EUR 114,000 across the 11-month programme, payable in instalments); a EUR 10,000 commitment fee is deducted from the total upon admission. Applications submitted before December 31 receive a EUR 5,000 reduction.',
  jsonb_build_object(
    'gpa_min', 'Strong undergraduate record',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Essays', 'GMAT or GRE', 'Two references', 'Interview')
  ),
  11, 'Business & Management Studies'
from public.universities u where u.slug = 'iese-business-school'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- NOVA SBE · Master in Finance
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-finance',
  'Master in Finance',
  'MSc', 'economics_finance', 'en',
  18, 14500.00, 'EUR', date '2026-04-30', 'September',
  'A three-semester (18-month) English-taught finance master''s with a quantitative core and elective tracks across corporate finance, asset management, and financial markets. Strong CFA alignment and placement across European banking and asset management. Tuition shown is the indicative regular-track total fee; an earlier deadline (March 23) applies for the international/double-degree and CEMS MIM tracks.',
  jsonb_build_object(
    'gpa_min', 'Strong quantitative undergraduate record',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'GMAT/GRE/NOVA SBE Admission Test', 'Two references')
  ),
  35, 'Economics & Econometrics'
from public.universities u where u.slug = 'nova-school-of-business-and-economics'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- NOVA SBE · Master in Management
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-management',
  'Master in Management',
  'MSc', 'business_management', 'en',
  18, 11650.00, 'EUR', date '2026-04-30', 'September',
  'A three-semester (18-month) English-taught management master''s combining core business courses with electives, capstone projects, and the option to add an exchange semester or the CEMS MIM (combined fee approximately EUR 19,650). Strong recruiter relationships across consulting, FMCG, and tech in Iberia and beyond.',
  jsonb_build_object(
    'gpa_min', 'Strong undergraduate record',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'GMAT/GRE/NOVA SBE Admission Test', 'Two references')
  ),
  29, 'Business & Management Studies'
from public.universities u where u.slug = 'nova-school-of-business-and-economics'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- ─────────────────────────────────────────────────────────────────────────
-- France: 5 universities, 7 programs across business_management,
-- data_science, computer_science_ai, social_sciences, economics_finance.
-- HEC, ESSEC, ESCP are specialised business schools and are not listed in
-- the QS World University Rankings overall — qs_world_rank is NULL.
-- ─────────────────────────────────────────────────────────────────────────

insert into public.universities (
  slug, name, country, city, institution_type, website,
  description, established_year, student_count, qs_world_rank, is_partner
) values
  (
    'hec-paris',
    'HEC Paris',
    'FR', 'Jouy-en-Josas', 'private',
    'https://www.hec.edu',
    'A leading French grande école and graduate business school based on the Jouy-en-Josas campus south of Paris, consistently ranked among the world''s top schools for its Master in Management and other specialised masters, with strong placement in consulting, finance, and tech across Europe.',
    1881, 4500, null, false
  ),
  (
    'institut-polytechnique-de-paris',
    'Institut Polytechnique de Paris',
    'FR', 'Palaiseau', 'public',
    'https://www.ip-paris.fr/en',
    'A public institute of science and technology grouping École Polytechnique with ENSTA, ENSAE, Télécom Paris, and Télécom SudParis on the Paris-Saclay plateau. Known for elite engineering, mathematics, computer science, and quantitative finance programmes, with a growing portfolio of English-taught masters.',
    2019, 8800, 46, false
  ),
  (
    'sciences-po',
    'Sciences Po',
    'FR', 'Paris', 'private',
    'https://www.sciencespo.fr/en',
    'A French research university in central Paris specialising in the social sciences — political science, international affairs, public policy, economics, sociology, and law — with seven graduate schools and a strong international student body.',
    1872, 14000, 267, false
  ),
  (
    'essec-business-school',
    'ESSEC Business School',
    'FR', 'Cergy-Pontoise', 'private',
    'https://www.essec.edu/en',
    'A French grande école based north-west of Paris with additional campuses in Singapore and Rabat, particularly strong in management, finance, and luxury brand management, and consistently ranked among the top European business schools.',
    1907, 7700, null, false
  ),
  (
    'escp-business-school',
    'ESCP Business School',
    'FR', 'Paris', 'private',
    'https://escp.eu',
    'The world''s oldest business school, founded in Paris in 1819, with six European campuses (Paris, London, Berlin, Madrid, Turin, Warsaw) and a flagship multi-campus Master in Management ranked among the very best in the world.',
    1819, 9000, null, false
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

-- HEC Paris · Master in Management
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-management',
  'Master in Management (Grande École)',
  'MSc', 'business_management', 'en',
  24, 27900.00, 'EUR', date '2026-04-16', 'September',
  'A two-year Grande École Master in Management, fully customisable with 20+ specialisations across strategy, finance, marketing, entrepreneurship, and sustainability. Courses are taught in English on the Jouy-en-Josas campus, with optional double degrees, exchanges, and a gap year for internships. Ranked #1 worldwide for Master in Management by QS in recent years.',
  jsonb_build_object(
    'gpa_min', 'Top of class in a strong undergraduate degree',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'TOEIC 850', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Essays', 'GMAT/GRE/TAGE-MAGE score', 'Two references', 'Interview')
  ),
  1, 'Business & Management Studies'
from public.universities u where u.slug = 'hec-paris'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- IP Paris (École Polytechnique) · MSc Data Science & AI for Business (X-HEC)
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-data-science-and-ai-for-business',
  'MSc Data Science & AI for Business (X-HEC)',
  'MSc', 'data_science', 'en',
  24, 27900.00, 'EUR', null, 'September',
  'A two-year fully English-taught joint MSc&T delivered by École Polytechnique and HEC Paris, combining advanced machine learning, deep learning, and data engineering with business strategy, product management, and entrepreneurship. Year 2 is taught on the HEC campus and includes a capstone project with a corporate partner.',
  jsonb_build_object(
    'gpa_min', 'Strong quantitative undergraduate background (engineering, CS, math, or stats)',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 90', 'Cambridge C1'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Cover letter', 'Two references', 'Interview')
  ),
  null, 'Data Science & Artificial Intelligence'
from public.universities u where u.slug = 'institut-polytechnique-de-paris'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- IP Paris (École Polytechnique) · MSc&T Cybersecurity
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-cybersecurity',
  'MSc&T Cybersecurity',
  'MSc', 'computer_science_ai', 'en',
  24, 16500.00, 'EUR', null, 'September',
  'A two-year MSc of Science and Technology fully taught in English, providing deep technical training in cryptography, network and system security, secure software, and applied research, complemented by management, law, and economics modules from partner schools of Institut Polytechnique de Paris.',
  jsonb_build_object(
    'gpa_min', 'Strong undergraduate degree in computer science, math, or engineering',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Cover letter', 'Two references', 'Interview')
  ),
  null, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'institut-polytechnique-de-paris'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Sciences Po · Master in International Affairs (PSIA)
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-international-affairs',
  'Master in International Affairs',
  'MA', 'social_sciences', 'en',
  24, 17020.00, 'EUR', null, 'September',
  'A two-year master''s offered by the Paris School of International Affairs (PSIA), with concentrations in international security, diplomacy, environmental policy, development, human rights, economics, and global governance. Fully English-taught with optional regional and language streams. Tuition shown is the maximum tier; Sciences Po applies an income-based progressive scale starting from EUR 0.',
  jsonb_build_object(
    'gpa_min', 'Strong undergraduate record in any discipline',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Two essays', 'Two references', 'Online interview')
  ),
  4, 'Politics & International Studies'
from public.universities u where u.slug = 'sciences-po'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Sciences Po · Master in Economics and Public Policy
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-economics-and-public-policy',
  'Master in Economics and Public Policy',
  'MA', 'economics_finance', 'en',
  24, 17020.00, 'EUR', null, 'September',
  'A two-year fully English-taught master''s jointly delivered with École Polytechnique and ENSAE, combining rigorous training in micro, macro, and econometrics with applied public policy analysis. Trains future economic-policy specialists for ministries, central banks, international organisations, think tanks, and consultancies. Tuition shown is the maximum tier; Sciences Po applies an income-based progressive scale starting from EUR 0.',
  jsonb_build_object(
    'gpa_min', 'Strong quantitative undergraduate record',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Two essays', 'Two references', 'Online interview')
  ),
  null, 'Economics & Econometrics'
from public.universities u where u.slug = 'sciences-po'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- ESSEC · Master in Finance
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-finance',
  'Master in Finance',
  'MSc', 'economics_finance', 'en',
  18, 31000.00, 'EUR', date '2026-04-09', 'September',
  'An English-taught one- or two-year Master in Finance covering corporate finance, asset management, financial markets, and financial engineering, with electives in fintech, sustainable finance, and private equity. Strong placement into investment banking, asset management, and consulting in Paris, London, and Singapore.',
  jsonb_build_object(
    'gpa_min', 'B+ with strong quantitative coursework',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'TOEIC 850', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Essays', 'GMAT/GRE/TAGE-MAGE score', 'Two references', 'Interview')
  ),
  6, 'Finance'
from public.universities u where u.slug = 'essec-business-school'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- ESCP · Master in Management
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-management',
  'Master in Management (Grande École)',
  'MSc', 'business_management', 'en',
  24, 25200.00, 'EUR', date '2026-05-07', 'September',
  'A two-year multi-campus Master in Management taught in English (with optional French/German/Spanish/Italian tracks), where students study on at least two of ESCP''s six European campuses (Paris, London, Berlin, Madrid, Turin, Warsaw). Curriculum spans core management, sectoral specialisations, and a compulsory internship.',
  jsonb_build_object(
    'gpa_min', 'Strong undergraduate degree in any discipline',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 90', 'TOEIC 800', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Essays', 'GMAT/GRE/TAGE-MAGE/CAT score', 'Two references', 'Interview')
  ),
  3, 'Business & Management Studies'
from public.universities u where u.slug = 'escp-business-school'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- ─────────────────────────────────────────────────────────────────────────
-- Switzerland & Austria: 5 universities, 8 programs across
-- computer_science_ai, data_science, engineering, business_management,
-- economics_finance, architecture_built_environment.
-- ─────────────────────────────────────────────────────────────────────────

insert into public.universities (
  slug, name, country, city, institution_type, website,
  description, established_year, student_count, qs_world_rank, is_partner
) values
  (
    'eth-zurich',
    'ETH Zurich',
    'CH', 'Zurich', 'public',
    'https://ethz.ch/en.html',
    'A Swiss federal institute of technology in Zurich, ETH is one of the world''s leading STEM-focused research universities, with 22 affiliated Nobel laureates and broad strengths across engineering, computer science, natural sciences, and architecture.',
    1855, 26000, 7, false
  ),
  (
    'epfl-lausanne',
    'École Polytechnique Fédérale de Lausanne',
    'CH', 'Lausanne', 'public',
    'https://www.epfl.ch/en/',
    'A Swiss federal institute of technology in Lausanne, EPFL is one of Europe''s most international technical universities, with strong programmes across computer science, engineering, life sciences, and architecture.',
    1853, 14000, 26, false
  ),
  (
    'university-of-st-gallen',
    'University of St. Gallen',
    'CH', 'St. Gallen', 'public',
    'https://www.unisg.ch/en',
    'A Swiss public university specialising in business administration, economics, law, international affairs, and computer science. HSG is consistently ranked among Europe''s leading business schools and is known for strong placement into consulting, banking, and corporate management.',
    1898, 9500, null, false
  ),
  (
    'tu-wien',
    'TU Wien',
    'AT', 'Vienna', 'public',
    'https://www.tuwien.at/en/',
    'Austria''s largest technical research university, founded in 1815 and based in Vienna, with strengths in computer science, data science, engineering, mathematics, and architecture.',
    1815, 28000, 190, false
  ),
  (
    'wu-vienna',
    'WU Vienna University of Economics and Business',
    'AT', 'Vienna', 'public',
    'https://www.wu.ac.at/en/',
    'Austria''s leading public university for business and economics, based in Vienna. Triple-accredited (AACSB, EQUIS, AMBA) with a strongly international student body and an extensive portfolio of English-taught master''s programmes.',
    1898, 21500, null, false
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

-- ETH Zurich · MSc Computer Science
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-computer-science',
  'MSc in Computer Science',
  'MSc', 'computer_science_ai', 'en',
  24, 4380.00, 'CHF', date '2026-03-31', 'September',
  'A two-year English-taught research-oriented master''s covering theoretical computer science, systems, machine learning, and visual computing, with the option to specialise in tracks such as Theoretical CS, Information Security, Data Management, and Visual Computing. Tuition shown is the non-Swiss rate (CHF 2,190/semester); Swiss residents pay a reduced fee.',
  jsonb_build_object(
    'gpa_min', 'Top of class in a relevant Bachelor''s (≈ ECTS grade A/B)',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Two letters of recommendation', 'Proof of English proficiency')
  ),
  10, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'eth-zurich'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- ETH Zurich · MSc Architecture
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-architecture',
  'MSc in Architecture',
  'MSc', 'architecture_built_environment', 'en',
  18, 4380.00, 'CHF', date '2026-03-15', 'September',
  'A three-semester architecture master''s combining design studios with electives in history, theory, technology, and urban design. Studios are led by internationally recognised practitioners, and a final design thesis caps the programme. Tuition shown is the non-Swiss rate (CHF 2,190/semester); Swiss residents pay a reduced fee.',
  jsonb_build_object(
    'gpa_min', 'Strong Bachelor''s in Architecture from a recognised institution',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Portfolio', 'Two letters of recommendation')
  ),
  10, 'Architecture / Built Environment'
from public.universities u where u.slug = 'eth-zurich'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- EPFL · MSc Data Science
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-data-science',
  'MSc in Data Science',
  'MSc', 'data_science', 'en',
  24, 1266.00, 'CHF', date '2026-04-15', 'September',
  'A two-year English-taught programme combining advanced machine learning, statistics, large-scale data systems, and applied data science. Strong emphasis on hands-on projects in collaboration with EPFL''s research labs and industry partners. Tuition is the standard EPFL fee (CHF 633/semester) applied to all students regardless of nationality.',
  jsonb_build_object(
    'gpa_min', 'Top of class in a relevant Bachelor''s (CS, mathematics, statistics, or quantitative engineering)',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Three letters of recommendation', 'Proof of English proficiency')
  ),
  null, 'Data Science & Artificial Intelligence'
from public.universities u where u.slug = 'epfl-lausanne'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- EPFL · MSc Robotics
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-robotics',
  'MSc in Robotics',
  'MSc', 'engineering', 'en',
  24, 1266.00, 'CHF', date '2026-04-15', 'September',
  'A two-year interdisciplinary master''s spanning mechanical design, control, perception, and autonomous systems, with deep links to EPFL''s robotics, AI, and biomedical research groups. Includes a compulsory industry- or research-oriented master project. Tuition is the standard EPFL fee (CHF 633/semester) applied to all students regardless of nationality.',
  jsonb_build_object(
    'gpa_min', 'Top of class in a relevant engineering or CS Bachelor''s',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Three letters of recommendation', 'Proof of English proficiency')
  ),
  null, 'Engineering & Technology'
from public.universities u where u.slug = 'epfl-lausanne'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- HSG · Master in Banking and Finance
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-banking-and-finance',
  'Master in Banking and Finance (MBF)',
  'MA', 'economics_finance', 'en',
  18, 6258.00, 'CHF', date '2026-04-30', 'September',
  'A three-semester English-taught master''s combining theoretical finance, capital markets, asset management, corporate finance, and risk management with applied case work. Strong placement into Swiss and European banking, asset management, and consulting. Tuition shown is the international rate (CHF 3,129/semester); Swiss residents pay a reduced fee.',
  jsonb_build_object(
    'gpa_min', 'Strong Bachelor''s in business, economics, or a quantitative discipline',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'GMAT or GRE', 'Proof of English proficiency')
  ),
  null, 'Accounting & Finance'
from public.universities u where u.slug = 'university-of-st-gallen'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- TU Wien · MSc Data Science
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-data-science',
  'MSc in Data Science',
  'MSc', 'data_science', 'en',
  24, 1453.44, 'EUR', date '2026-09-05', 'October',
  'A two-year English-taught interdisciplinary master''s on collecting, processing, analysing, and visualising large-scale data. Curriculum spans machine learning, statistics, data engineering, and visual analytics, jointly hosted by TU Wien''s informatics, mathematics, and economics faculties. Tuition shown is the non-EU rate (EUR 726.72/semester); EU/EEA students pay only the per-semester student-union contribution (≈ EUR 24/semester).',
  jsonb_build_object(
    'gpa_min', 'Strong Bachelor''s in computer science, mathematics, statistics, or related',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 92'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Proof of English proficiency')
  ),
  null, 'Data Science & Artificial Intelligence'
from public.universities u where u.slug = 'tu-wien'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- WU Vienna · MSc Quantitative Finance
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-quantitative-finance',
  'MSc in Quantitative Finance',
  'MSc', 'economics_finance', 'en',
  24, 1453.44, 'EUR', date '2026-03-08', 'October',
  'A two-year English-taught master''s combining financial economics, microeconomics, mathematics, statistics, and computing, with mandatory R-programming training. Choice of a Science Track for academic careers or an Industry Track for quantitative finance roles in banking, asset management, and risk. Tuition shown is the non-EU rate (EUR 726.72/semester); EU/EEA students pay only the per-semester student-union contribution.',
  jsonb_build_object(
    'gpa_min', 'Strong Bachelor''s with quantitative coursework (math, statistics, econometrics)',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'GMAT or GRE recommended', 'Proof of English proficiency')
  ),
  null, 'Accounting & Finance'
from public.universities u where u.slug = 'wu-vienna'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- WU Vienna · MSc Strategy, Innovation and Management Control
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-strategy-innovation-and-management-control',
  'MSc in Strategy, Innovation and Management Control (SIMC)',
  'MSc', 'business_management', 'en',
  24, 1453.44, 'EUR', date '2026-03-08', 'October',
  'A two-year English-taught master''s preparing graduates for strategic, innovation, and management-control roles in international firms and entrepreneurial ventures. Combines coursework in strategy, organisation theory, controlling, and innovation with case work and applied projects. Tuition shown is the non-EU rate (EUR 726.72/semester); EU/EEA students pay only the per-semester student-union contribution.',
  jsonb_build_object(
    'gpa_min', 'Strong Bachelor''s in business, economics, or a related discipline',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Proof of English proficiency')
  ),
  null, 'Business & Management Studies'
from public.universities u where u.slug = 'wu-vienna'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- ─────────────────────────────────────────────────────────────────────────
-- Nordics (Sweden, Denmark, Finland): 6 universities + 9 programs.
-- Tuition figures are non-EU/EEA rates per academic year; EU/EEA/Swiss
-- citizens typically pay zero tuition at SE, DK, FI public universities.
-- Stockholm School of Economics is private but applies the same EU exemption.
-- ─────────────────────────────────────────────────────────────────────────

insert into public.universities (
  slug, name, country, city, institution_type, website,
  description, established_year, student_count, qs_world_rank, is_partner
) values
  (
    'kth-royal-institute-of-technology',
    'KTH Royal Institute of Technology',
    'SE', 'Stockholm', 'public',
    'https://www.kth.se/en',
    'Sweden''s largest technical university, with research and teaching strengths across engineering and technology. Member of the CESAER and UNITE! European university networks, with consistently top-25 QS subject placements in mechanical, materials, and electrical engineering.',
    1827, 14000, 74, false
  ),
  (
    'lund-university',
    'Lund University',
    'SE', 'Lund', 'public',
    'https://www.lunduniversity.lu.se',
    'One of Northern Europe''s oldest and most comprehensive research universities, with eight faculties spanning engineering, sciences, economics, social sciences, law, and the humanities. Anchors major research infrastructures including MAX IV and the European Spallation Source.',
    1666, 46000, 72, false
  ),
  (
    'stockholm-school-of-economics',
    'Stockholm School of Economics',
    'SE', 'Stockholm', 'private',
    'https://www.hhs.se/en',
    'A small, selective private business school in central Stockholm focused on economics, finance, accounting, and management. Triple-crown-adjacent through EQUIS accreditation and CEMS membership, with consistent top-30 Financial Times rankings for its master''s programmes.',
    1909, 1800, null, false
  ),
  (
    'technical-university-of-denmark',
    'Technical University of Denmark',
    'DK', 'Kongens Lyngby', 'public',
    'https://www.dtu.dk/english',
    'A leading European engineering university just north of Copenhagen, member of the EuroTech Universities Alliance alongside EPFL and TU Munich. Strong research output across engineering, applied sciences, and biotechnology.',
    1829, 13000, 121, false
  ),
  (
    'copenhagen-business-school',
    'Copenhagen Business School',
    'DK', 'Frederiksberg', 'public',
    'https://www.cbs.dk/en',
    'One of the largest business schools in Northern Europe, holding triple-crown accreditation (EQUIS, AMBA, AACSB). Programmes span economics, business administration, and interdisciplinary tracks combining business with humanities, social sciences, and technology.',
    1917, 20000, null, false
  ),
  (
    'aalto-university',
    'Aalto University',
    'FI', 'Espoo', 'public',
    'https://www.aalto.fi/en',
    'Finnish research university created in 2010 by merging the Helsinki University of Technology, Helsinki School of Economics, and University of Art and Design Helsinki. Distinctive cross-disciplinary structure across engineering, business, and design — globally top-ranked for art & design.',
    2010, 17000, 113, false
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

-- KTH · MSc Computer Science
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-computer-science',
  'MSc in Computer Science',
  'MSc', 'computer_science_ai', 'en',
  24, 180000.00, 'SEK', date '2026-01-15', 'August',
  'A two-year English-taught master''s providing a broad foundation in computer science with specialisation tracks across algorithms, security, artificial intelligence, software engineering, and computer systems. Tuition shown is the non-EU/EEA rate (SEK 360,000 total for the programme); EU/EEA/Swiss citizens pay no tuition.',
  jsonb_build_object(
    'gpa_min', 'B (upper second class) in a relevant bachelor',
    'language_tests', jsonb_build_array('IELTS 6.5 (no band below 5.5)', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Proof of English proficiency', 'Application fee receipt')
  ),
  39, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'kth-royal-institute-of-technology'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- KTH · MSc Sustainable Energy Engineering
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-sustainable-energy-engineering',
  'MSc in Sustainable Energy Engineering',
  'MSc', 'engineering', 'en',
  24, 155000.00, 'SEK', date '2026-01-15', 'August',
  'A two-year English-taught engineering programme covering renewable energy systems, energy efficiency, power generation, and smart grids. Strong industry links across the Stockholm clean-energy sector. Tuition shown is the non-EU/EEA annual rate; EU/EEA/Swiss citizens pay no tuition.',
  jsonb_build_object(
    'gpa_min', 'B in a relevant engineering or science bachelor',
    'language_tests', jsonb_build_array('IELTS 6.5 (no band below 5.5)', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Proof of English proficiency', 'Application fee receipt')
  ),
  23, 'Engineering — Mechanical, Aeronautical & Manufacturing'
from public.universities u where u.slug = 'kth-royal-institute-of-technology'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Lund · MSc Entrepreneurship and Innovation
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-entrepreneurship-and-innovation',
  'MSc in Entrepreneurship and Innovation',
  'MSc', 'business_management', 'en',
  12, 130000.00, 'SEK', date '2026-01-15', 'August',
  'A one-year English-taught programme run by Lund School of Economics and Management, equipping students to launch ventures or drive innovation inside established firms. Combines venture-creation tracks with hands-on coaching and a thesis or new-venture project. Tuition shown is the non-EU/EEA annual rate; EU/EEA/Swiss citizens pay no tuition.',
  jsonb_build_object(
    'gpa_min', 'Above-average results in a relevant bachelor',
    'language_tests', jsonb_build_array('IELTS 6.5 (no band below 5.5)', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Proof of English proficiency')
  ),
  null, 'Business & Management Studies'
from public.universities u where u.slug = 'lund-university'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- SSE · MSc Finance
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-finance',
  'MSc in Finance',
  'MSc', 'economics_finance', 'en',
  24, 220000.00, 'SEK', date '2026-01-16', 'August',
  'A two-year English-taught finance master''s consistently ranked in the Financial Times Global Masters in Finance. Quantitatively rigorous coursework spans corporate finance, asset pricing, derivatives, and financial econometrics, with strong placement into investment banking and asset management across the Nordics and Europe. EU/EEA/Swiss/Ukrainian citizens are exempt from tuition; the figure shown is the standard fee-paying rate.',
  jsonb_build_object(
    'gpa_min', 'Strong upper second / B+ in a quantitative bachelor',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'GMAT or GRE score', 'Letters of recommendation')
  ),
  null, 'Accounting & Finance'
from public.universities u where u.slug = 'stockholm-school-of-economics'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- DTU · MSc Computer Science and Engineering
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-computer-science-and-engineering',
  'MSc in Computer Science and Engineering',
  'MSc', 'computer_science_ai', 'en',
  24, 111750.00, 'DKK', date '2026-01-15', 'September',
  'A two-year English-taught engineering master''s with specialisation tracks in artificial intelligence and algorithms, computer security, cybersecurity, digital systems, embedded and distributed systems, and software engineering. Tuition is DKK 7,500 per semester for non-EU/EEA students (≈ DKK 111,750 / EUR 15,000 per year); EU/EEA/Swiss citizens pay no tuition. Industry-MSc track combines part-time study with employment.',
  jsonb_build_object(
    'gpa_min', 'Relevant bachelor in computer science, software engineering, or related discipline',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 88', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Proof of English proficiency')
  ),
  null, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'technical-university-of-denmark'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- DTU · MSc Wind Energy
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-wind-energy',
  'MSc in Wind Energy',
  'MSc', 'engineering', 'en',
  24, 111750.00, 'DKK', date '2026-01-15', 'September',
  'A two-year English-taught programme drawing on DTU''s world-leading wind energy research at DTU Risø. Covers aerodynamics, structural mechanics, control systems, electrical integration, and wind farm planning, with thesis projects often run with Vestas, Ørsted, or Siemens Gamesa. Tuition is DKK 7,500 per semester for non-EU/EEA students; EU/EEA/Swiss citizens pay no tuition.',
  jsonb_build_object(
    'gpa_min', 'Relevant engineering or physics bachelor',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 88'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Proof of English proficiency')
  ),
  null, 'Engineering & Technology'
from public.universities u where u.slug = 'technical-university-of-denmark'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- CBS · MSc Finance and Investments
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-finance-and-investments',
  'MSc in Economics and Business Administration — Finance and Investments',
  'MSc', 'economics_finance', 'en',
  24, 105000.00, 'DKK', date '2026-01-15', 'September',
  'A selective two-year English-taught finance master''s (≈130 students per intake, 68% international) combining state-of-the-art theoretical and empirical models for investment decisions, asset pricing, and risk management. Third-semester options include electives, exchange, internship, or a CEMS double-degree track. EU/EEA/Swiss citizens pay no tuition; the figure shown is the non-EU annual rate.',
  jsonb_build_object(
    'gpa_min', 'Relevant business / economics bachelor (≥ 90 ECTS in core areas)',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Documentation of English level')
  ),
  18, 'Business & Management Studies'
from public.universities u where u.slug = 'copenhagen-business-school'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Aalto · MSc Machine Learning, Data Science and Artificial Intelligence
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-machine-learning-data-science-and-ai',
  'MSc in Machine Learning, Data Science and Artificial Intelligence (Macadamia)',
  'MSc', 'data_science', 'en',
  24, 17000.00, 'EUR', date '2026-01-08', 'September',
  'A two-year English-taught programme (commonly known as Macadamia) covering statistical machine learning, deep learning, probabilistic modelling, and large-scale data systems. Anchored by Aalto''s strong AI research community and the Finnish Center for Artificial Intelligence (FCAI). Tuition shown is the non-EU/EEA annual rate; EU/EEA/Swiss citizens pay no tuition.',
  jsonb_build_object(
    'gpa_min', 'Relevant bachelor in computer science, math, statistics, or engineering',
    'language_tests', jsonb_build_array('IELTS 6.5 (no band below 5.5)', 'TOEFL iBT 92'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Proof of English proficiency')
  ),
  null, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'aalto-university'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Aalto · MSc International Design Business Management (IDBM)
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-international-design-business-management',
  'MSc in International Design Business Management (IDBM)',
  'MSc', 'design', 'en',
  24, 17000.00, 'EUR', date '2026-01-08', 'September',
  'A flagship cross-disciplinary two-year programme jointly run by Aalto''s schools of business, art & design, and engineering. Students from arts, business, and technology backgrounds collaborate on a six-month real-life industry project, building skills to lead innovation in global ventures. Multiple exit degrees available (MA, MSc Econ & Bus Admin, MSc Tech). Non-EU/EEA tuition is EUR 17,000/year; EU/EEA/Swiss citizens pay no tuition.',
  jsonb_build_object(
    'gpa_min', 'Strong bachelor in design, business, engineering, or related field',
    'language_tests', jsonb_build_array('IELTS 6.5 (no band below 5.5)', 'TOEFL iBT 92'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Portfolio (design applicants)', 'Proof of English proficiency')
  ),
  6, 'Art & Design'
from public.universities u where u.slug = 'aalto-university'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- ─────────────────────────────────────────────────────────────────────────
-- UK / Ireland / Belgium top-up: 6 universities, 9 master's programs.
-- Adds Oxford and Cambridge (notably missing from Phase 6) plus UCL,
-- Edinburgh, Trinity College Dublin, and KU Leuven. Fields covered:
-- business_management, computer_science_ai, social_sciences, data_science,
-- architecture_built_environment, economics_finance.
-- Tuition rates are non-EU (UK overseas / IE non-EU / BE non-EEA);
-- EU/EEA rates are typically lower and are noted in each description.
-- ─────────────────────────────────────────────────────────────────────────

insert into public.universities (
  slug, name, country, city, institution_type, website,
  description, established_year, student_count, qs_world_rank, is_partner
) values
  (
    'university-of-oxford',
    'University of Oxford',
    'GB', 'Oxford', 'public',
    'https://www.ox.ac.uk',
    'A collegiate research university and the oldest university in the English-speaking world, with teaching dating back to 1096. Comprises 43 colleges and four academic divisions across the city of Oxford, with global research strengths spanning humanities, social sciences, mathematical and physical sciences, and medicine.',
    1096, 26225, 3, false
  ),
  (
    'university-of-cambridge',
    'University of Cambridge',
    'GB', 'Cambridge', 'public',
    'https://www.cam.ac.uk',
    'A collegiate research university and the world''s third-oldest university in continuous operation, founded in 1209 by scholars who departed Oxford. Comprises 31 self-governing colleges and more than 150 academic departments, with affiliated academics having won 126 Nobel Prizes.',
    1209, 22565, 5, false
  ),
  (
    'university-college-london',
    'University College London',
    'GB', 'London', 'public',
    'https://www.ucl.ac.uk',
    'A large public research university and a member of the Russell Group, founded in 1826 as the first university institution established in London. Operates across eleven faculties from its main Bloomsbury campus, with broad strength across the sciences, engineering, humanities, and social sciences.',
    1826, 51315, 9, false
  ),
  (
    'university-of-edinburgh',
    'University of Edinburgh',
    'GB', 'Edinburgh', 'public',
    'https://www.ed.ac.uk',
    'A public research university and one of Scotland''s ancient universities, founded by royal charter in 1582. The largest university in Scotland, with five main campuses across the city and particular strengths in informatics, data science, life sciences, and the social sciences.',
    1583, 39015, 27, false
  ),
  (
    'trinity-college-dublin',
    'Trinity College Dublin',
    'IE', 'Dublin', 'public',
    'https://www.tcd.ie',
    'The sole constituent college of the University of Dublin and Ireland''s oldest university, established by royal charter in 1592. A research-led university with three faculties and 25 schools, consistently the highest-ranked university in Ireland.',
    1592, 20490, 87, false
  ),
  (
    'ku-leuven',
    'KU Leuven',
    'BE', 'Leuven', 'public',
    'https://www.kuleuven.be/english',
    'The largest university in Belgium and the oldest university in the Low Countries, founded in 1425. A leading European research university with broad disciplinary coverage; many graduate programmes are taught in English despite Dutch being the primary language of instruction.',
    1425, 65534, 60, false
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

-- Oxford · MSc Sustainability, Enterprise and the Environment
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-sustainability-enterprise-and-the-environment',
  'MSc in Sustainability, Enterprise and the Environment',
  'MSc', 'business_management', 'en',
  12, 48820.00, 'GBP', date '2026-01-27', 'October',
  'A one-year master''s at the Smith School of Enterprise and the Environment training students to accelerate the transition to a zero-carbon, environmentally sustainable economy. Combines finance, economics, and enterprise perspectives with environmental and data sciences across ten core modules, two electives, and a 15,000-word dissertation.',
  jsonb_build_object(
    'gpa_min', 'First-class undergraduate degree (UK 1st) or international equivalent',
    'language_tests', jsonb_build_array('IELTS 7.5 (min 7.0 per component)', 'TOEFL iBT 110 (min 22 per component)'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Statement of purpose', 'Three references', 'Written work sample')
  ),
  3, 'Business & Management Studies'
from public.universities u where u.slug = 'university-of-oxford'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Oxford · MSc Advanced Computer Science
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-advanced-computer-science',
  'MSc in Advanced Computer Science',
  'MSc', 'computer_science_ai', 'en',
  12, 43730.00, 'GBP', date '2026-01-23', 'October',
  'A research-led one-year master''s for computer science graduates wishing to pursue advanced study in algorithms, machine learning, programming languages, computer security, computational biology, or theoretical computer science. Students take eight options drawn from the Department of Computer Science''s research-led catalogue, plus a substantial dissertation. Deadline shown is the typical Oxford January deadline; check the course page for the exact date in the next admissions cycle.',
  jsonb_build_object(
    'gpa_min', 'First-class undergraduate degree (UK 1st) in computer science, mathematics, or a closely related quantitative discipline',
    'language_tests', jsonb_build_array('IELTS 7.5 (min 7.0 per component)', 'TOEFL iBT 110 (min 22 per component)'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Statement of purpose', 'Three academic references', 'Written work sample')
  ),
  null, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'university-of-oxford'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Cambridge · MPhil in Public Policy
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'mphil-public-policy',
  'MPhil in Public Policy',
  'MPhil', 'social_sciences', 'en',
  9, 42000.00, 'GBP', date '2026-02-26', 'October',
  'A nine-month practice-oriented master''s at the Bennett School of Public Policy, designed for those aiming at leading roles in government, multilateral organisations, NGOs, or industry. Combines core training in policy analysis, economics, statistics, and the politics of policy-making with electives and a thesis. Tuition is an approximation: Cambridge no longer publishes course-level PG fees on the public course directory; verify current figure with the Bennett School before applying.',
  jsonb_build_object(
    'gpa_min', 'First-class or strong upper second-class undergraduate degree (UK 1st or 2:1) or international equivalent',
    'language_tests', jsonb_build_array('IELTS 7.5 (min 7.0 per component)', 'TOEFL iBT 110 (min 25 per component)'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Statement of interest', 'Two academic references', 'Research proposal')
  ),
  null, 'Politics & International Studies'
from public.universities u where u.slug = 'university-of-cambridge'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- UCL · MSc Data Science and Machine Learning
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-data-science-and-machine-learning',
  'MSc Data Science and Machine Learning',
  'MSc', 'data_science', 'en',
  12, 42700.00, 'GBP', date '2026-03-27', 'September',
  'A one-year technical master''s for highly quantitative graduates covering supervised and unsupervised learning, probabilistic models, statistical inference, optimisation, and applied machine learning. Includes an individual research project supervised by UCL Computer Science academics. International applicants requiring a visa must apply by 27 March 2026.',
  jsonb_build_object(
    'gpa_min', 'UK upper second-class (2:1) or international equivalent in a highly quantitative subject (CS, mathematics, engineering, physics, statistics)',
    'language_tests', jsonb_build_array('IELTS 7.0 (min 6.5 per section)', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two academic references')
  ),
  null, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'university-college-london'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- UCL · MSc Urban Design and City Planning
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-urban-design-and-city-planning',
  'MSc Urban Design and City Planning',
  'MSc', 'architecture_built_environment', 'en',
  12, 39200.00, 'GBP', date '2026-06-26', 'September',
  'A one-year multidisciplinary master''s at The Bartlett combining urban design as a creative planning tool with strategic city planning practice. Delivered through lectures, design studios, seminars, and a residential field trip, the programme is accredited by the Royal Town Planning Institute and prepares graduates for careers across public authorities, planning consultancies, and international organisations.',
  jsonb_build_object(
    'gpa_min', 'UK upper second-class (2:1) or international equivalent',
    'language_tests', jsonb_build_array('IELTS 7.0 (min 6.5 per section)', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two references', 'Portfolio (design-led applicants)')
  ),
  null, 'Architecture / Built Environment'
from public.universities u where u.slug = 'university-college-london'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Edinburgh · MSc Climate Change Finance and Investment
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-climate-change-finance-and-investment',
  'MSc Climate Change Finance and Investment',
  'MSc', 'economics_finance', 'en',
  12, 36500.00, 'GBP', date '2026-04-22', 'September',
  'A one-year master''s at the University of Edinburgh Business School developing professionals for low-carbon finance and investment. Built on an interdisciplinary foundation of carbon accounting, climate policy, and financial economics, with applied coursework in green finance, ESG investing, and climate-related disclosures. Tuition shown is an approximate Edinburgh Business School band figure for 2026; verify the exact rate on the programme page before applying.',
  jsonb_build_object(
    'gpa_min', 'UK upper second-class (2:1) or international equivalent in business, economics, engineering, or science',
    'language_tests', jsonb_build_array('IELTS 7.0 (min 6.0 per component)', 'TOEFL iBT 100 (min 20 per component)'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two references')
  ),
  null, 'Accounting & Finance'
from public.universities u where u.slug = 'university-of-edinburgh'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Trinity College Dublin · MSc Smart and Sustainable Cities
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-smart-and-sustainable-cities',
  'MSc in Smart and Sustainable Cities',
  'MSc', 'architecture_built_environment', 'en',
  12, 22575.00, 'EUR', date '2026-07-31', 'September',
  'A new interdisciplinary one-year master''s from Trinity''s School of Natural Sciences and Future Cities Research Centre, examining urban development through environmental, technological, and social lenses. Coursework spans urban governance, GIS, sustainability, machine learning, and smart-city technologies, with a mandatory field trip (Amsterdam in 2026) and a workplace placement. Tuition shown is the non-EU rate; EU rates are typically lower.',
  jsonb_build_object(
    'gpa_min', 'Upper second-class (2:1) Honours degree or international equivalent in science or social science',
    'language_tests', jsonb_build_array('IELTS 6.5 (min 6.0 per section)', 'TOEFL iBT 88'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two references')
  ),
  null, 'Architecture / Built Environment'
from public.universities u where u.slug = 'trinity-college-dublin'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- KU Leuven · Master of Artificial Intelligence
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-of-artificial-intelligence',
  'Master of Artificial Intelligence',
  'MSc', 'computer_science_ai', 'en',
  12, 6000.00, 'EUR', date '2026-03-01', 'September',
  'A one-year advanced master''s training students from diverse backgrounds in knowledge-based technology and applied AI. Three specialisation tracks: Engineering and Computer Science, Speech and Language Technology, and Big Data Analytics. Coursework covers machine learning, deep learning, natural language processing, computer vision, robotics, and AI ethics. Tuition shown is the non-EEA rate; EU/EEA students pay only the standard contribution (around EUR 1,200/year).',
  jsonb_build_object(
    'gpa_min', 'Bachelor or master''s degree with strong quantitative coursework in computer science, mathematics, engineering, or a related discipline',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 87'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Reference letters')
  ),
  null, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'ku-leuven'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- KU Leuven · Master of Bioinformatics
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-of-bioinformatics',
  'Master of Bioinformatics',
  'MSc', 'data_science', 'en',
  24, 9493.00, 'EUR', date '2026-03-01', 'September',
  'A two-year English-taught master''s at the Faculty of Bioscience Engineering combining biology, computer science, mathematics, and statistics to analyse and interpret biological big data. Students learn to formulate biological questions, design computational solutions, analyse high-throughput sequencing data, and interpret results in modern biotechnology contexts. Tuition shown is the non-EEA rate; EU/EEA students pay around EUR 1,200/year.',
  jsonb_build_object(
    'gpa_min', 'Bachelor''s degree in a quantitative or life-science discipline (bioscience engineering, biology, computer science, or related)',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 87'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Reference letters')
  ),
  null, 'Biological Sciences'
from public.universities u where u.slug = 'ku-leuven'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- ═════════════════════════════════════════════════════════════════════════
-- PHASE 8 — catalog deepening + new countries + new universities (2026-05-08)
-- 20 new universities + 44 new programs sourced by 4 parallel research
-- agents. Sections:
--   A. Existing-uni program deepening (13 programs at existing universities)
--   B. New universities in existing countries (8 unis, 12 programs)
--   C. New countries: Norway, Czech Republic, Poland, Estonia (7 unis, 10 programs)
--   D. Design + architecture + social-sciences fillers (5 new unis, 9 programs)
-- Post-Phase-8 totals: ~58 universities, ~98 programs across ~15 countries.
-- ═════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- B. New universities in existing countries (Italy, UK, Germany, NL, Spain)
-- ─────────────────────────────────────────────────────────────────────────

insert into public.universities (
  slug, name, country, city, institution_type, website,
  description, established_year, student_count, qs_world_rank, is_partner
) values
  (
    'sapienza-universita-di-roma',
    'Sapienza Università di Roma',
    'IT', 'Rome', 'public',
    'https://www.uniroma1.it/en',
    'One of Europe''s largest and oldest universities, founded in 1303 by Pope Boniface VIII. A comprehensive public research university in central Rome with broad strengths across the humanities, social sciences, engineering, computer science, and the natural sciences. Hosts a growing portfolio of English-taught master''s programmes for international students.',
    1303, 112000, 128, false
  ),
  (
    'university-of-bologna',
    'University of Bologna',
    'IT', 'Bologna', 'public',
    'https://www.unibo.it/en',
    'The oldest university in continuous operation in the Western world, founded in 1088. A comprehensive public research university with its main campus in Bologna and additional campuses in Cesena, Forlì, Ravenna, and Rimini. Strong international presence with a wide range of English-taught second-cycle (master''s) degree programmes.',
    1088, 90000, 138, false
  ),
  (
    'university-of-warwick',
    'University of Warwick',
    'GB', 'Coventry', 'public',
    'https://warwick.ac.uk',
    'A leading UK research university near Coventry, founded in 1965. Particularly recognised for Warwick Business School (WBS), economics, mathematics, and computer science. Strong industry links and consistently ranked in the UK top 10 and the world top 100.',
    1965, 27880, 74, false
  ),
  (
    'university-of-manchester',
    'University of Manchester',
    'GB', 'Manchester', 'public',
    'https://www.manchester.ac.uk',
    'A major Russell Group research university in northern England, with origins going back to 1824. Comprehensive academic portfolio across engineering, life sciences, business (Alliance Manchester Business School), social sciences, and the humanities, with one of the largest postgraduate communities in the UK.',
    1824, 46000, 35, false
  ),
  (
    'ludwig-maximilian-university-of-munich',
    'Ludwig Maximilian University of Munich',
    'DE', 'Munich', 'public',
    'https://www.lmu.de/en',
    'A leading German public research university in Munich, founded in 1472, consistently ranked among the top universities in continental Europe. Particularly strong in economics, the humanities, life sciences, physics, and medicine, with a growing offer of English-taught master''s programmes.',
    1472, 52000, 58, false
  ),
  (
    'rwth-aachen-university',
    'RWTH Aachen University',
    'DE', 'Aachen', 'public',
    'https://www.rwth-aachen.de/lang/en',
    'Germany''s largest technical university and a member of the IDEA League and TU9 alliance of leading German technical universities. Located in Aachen close to the Belgian and Dutch borders, with a strong industry-oriented research profile in mechanical engineering, electrical engineering, computer science, and materials science.',
    1870, 44000, 105, false
  ),
  (
    'university-of-amsterdam',
    'University of Amsterdam',
    'NL', 'Amsterdam', 'public',
    'https://www.uva.nl/en',
    'The largest comprehensive research university in the Netherlands, located in Amsterdam, with origins as the Athenaeum Illustre in 1632. Wide-ranging academic profile covering economics and business, social and behavioural sciences, humanities, law, science, and medicine, with more than 150 English-taught master''s programmes.',
    1632, 42000, 55, false
  ),
  (
    'universitat-pompeu-fabra',
    'Universitat Pompeu Fabra',
    'ES', 'Barcelona', 'public',
    'https://www.upf.edu/en',
    'A young public research university in Barcelona, founded in 1990 and named after Catalan philologist Pompeu Fabra. Internationally recognised for economics, finance, political and social sciences, and communication, and closely associated with the Barcelona School of Economics (BSE) for graduate programmes.',
    1990, 12500, 265, false
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
-- C. New countries (Norway, Czech Republic, Poland, Estonia)
-- ─────────────────────────────────────────────────────────────────────────

insert into public.universities (
  slug, name, country, city, institution_type, website,
  description, established_year, student_count, qs_world_rank, is_partner
) values
  (
    'ntnu',
    'Norwegian University of Science and Technology',
    'NO', 'Trondheim', 'public',
    'https://www.ntnu.edu',
    'Norway''s largest university and its primary institution for engineering and the natural sciences, with strong programmes across technology, architecture, medicine, social sciences, and the humanities. As a Norwegian public university, NTNU charges no tuition to students from the EU/EEA and Switzerland; non-EEA students pay tuition fees set by the institution.',
    1996, 42000, 264, false
  ),
  (
    'university-of-oslo',
    'University of Oslo',
    'NO', 'Oslo', 'public',
    'https://www.uio.no/english',
    'Norway''s oldest and most comprehensive research university, with broad strengths across natural sciences, social sciences, humanities, law, and medicine. As a Norwegian public university, UiO charges no tuition to students from the EU/EEA and Switzerland; non-EEA students pay tuition fees from the 2023/2024 academic year onward.',
    1811, 28000, 119, false
  ),
  (
    'bi-norwegian-business-school',
    'BI Norwegian Business School',
    'NO', 'Oslo', 'private',
    'https://www.bi.no/en',
    'Norway''s largest business school and one of Europe''s leading institutions for management education, with a triple-accredited (EQUIS, AACSB, AMBA) portfolio of English-taught master''s programmes in finance, business analytics, and strategic management. Unlike Norwegian public universities, BI charges tuition to all students regardless of nationality.',
    1943, 20000, null, false
  ),
  (
    'charles-university',
    'Charles University',
    'CZ', 'Prague', 'public',
    'https://cuni.cz/UKEN-1.html',
    'Founded in 1348, Charles University is one of the oldest universities in the world and the largest and most prestigious in the Czech Republic, with strengths across the humanities, social sciences, law, medicine, and the natural sciences. Czech-taught programmes are tuition-free for all nationalities at public universities; English-taught programmes charge tuition.',
    1348, 49000, 265, false
  ),
  (
    'czech-technical-university',
    'Czech Technical University in Prague',
    'CZ', 'Prague', 'public',
    'https://www.cvut.cz/en',
    'Founded in 1707, CTU is one of the oldest technical universities in Europe and the leading Czech institution for engineering, computer science, and architecture, with a broad portfolio of English-taught master''s programmes including the well-known Open Informatics track at the Faculty of Electrical Engineering.',
    1707, 18000, 416, false
  ),
  (
    'university-of-warsaw',
    'University of Warsaw',
    'PL', 'Warsaw', 'public',
    'https://en.uw.edu.pl',
    'Poland''s leading research university and the country''s only institution ranked among the top 300 globally, with established strengths in economics, the social sciences, mathematics, and the humanities, and a growing portfolio of English-taught master''s programmes in the Faculty of Economic Sciences.',
    1816, 39000, 271, false
  ),
  (
    'university-of-tartu',
    'University of Tartu',
    'EE', 'Tartu', 'public',
    'https://ut.ee/en',
    'Estonia''s national university and the leading research institution in the Baltic region, founded in 1632 by King Gustav II Adolf of Sweden. Strengths include computer science, life sciences, semiotics, and the social sciences, with around 70 master''s programmes available, many taught in English.',
    1632, 13000, 362, false
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
-- D. Design / architecture / social-sciences fillers (new universities)
-- ─────────────────────────────────────────────────────────────────────────

insert into public.universities (
  slug, name, country, city, institution_type, website,
  description, established_year, student_count, qs_world_rank, is_partner
) values
  (
    'royal-college-of-art',
    'Royal College of Art',
    'GB', 'London', 'public',
    'https://www.rca.ac.uk',
    'A wholly postgraduate art and design university in London, ranked the world''s number one university for art and design by QS for twelve consecutive years (2014–2026). Programmes span design, architecture, communication, fine art, and humanities, with strong industry collaboration across the Battersea, Kensington, and White City campuses.',
    1837, 2300, null, false
  ),
  (
    'goldsmiths-university-of-london',
    'Goldsmiths, University of London',
    'GB', 'London', 'public',
    'https://www.gold.ac.uk',
    'A constituent college of the University of London, internationally recognised for the arts, design, media, and social sciences. Based in New Cross, south-east London, with a creative-practice ethos and ranked among the top universities globally for art and design and communication and media studies.',
    1891, 11000, null, false
  ),
  (
    'hertie-school',
    'Hertie School',
    'DE', 'Berlin', 'private',
    'https://www.hertie-school.org/en',
    'Germany''s leading private graduate school of governance and public policy, based in central Berlin. Offers English-taught masters and PhD programmes combining political science, economics, law, and data science to train future policymakers and public-sector leaders.',
    2003, 800, null, false
  ),
  (
    'geneva-graduate-institute',
    'Geneva Graduate Institute',
    'CH', 'Geneva', 'private',
    'https://www.graduateinstitute.ch',
    'A graduate-level research institute in Geneva (IHEID), founded in 1927 as the world''s first graduate school dedicated solely to international affairs. Specialises in international relations, development studies, international law, and global governance, with deep links to the Geneva-based UN system and international organisations.',
    1927, 1100, null, false
  ),
  (
    'kings-college-london',
    'King''s College London',
    'GB', 'London', 'public',
    'https://www.kcl.ac.uk',
    'A research-intensive Russell Group university and a constituent college of the University of London, founded in 1829. Strong global standing in the humanities, social sciences, law, medicine, and war studies, with five central London campuses on or near the Strand.',
    1829, 33000, 31, false
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

-- ═════════════════════════════════════════════════════════════════════════
-- A. Existing-university program deepening (13 programs)
-- ═════════════════════════════════════════════════════════════════════════

-- Polimi · MSc Computer Science and Engineering
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-computer-science-and-engineering',
  'MSc in Computer Science and Engineering',
  'MSc', 'computer_science_ai', 'en',
  24, 3898.20, 'EUR', date '2026-01-29', 'September',
  'A two-year English-taught master''s covering the full spectrum of computer science and software engineering, with electives in AI & machine learning, data science, cybersecurity, distributed systems, software engineering, and human-computer interaction. Tuition shown is the maximum non-EU figure; EU/EEA students pay an income-based contribution.',
  jsonb_build_object(
    'gpa_min', 'B+',
    'language_tests', jsonb_build_array('IELTS 6.0', 'TOEFL iBT 78'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Reference letters')
  ),
  null, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'politecnico-di-milano'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- TUM · MSc Data Engineering and Analytics
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-data-engineering-and-analytics',
  'MSc in Data Engineering and Analytics',
  'MSc', 'data_science', 'en',
  24, 12000.00, 'EUR', date '2026-05-31', 'October',
  'A two-year English-taught master''s training students to design, build, and operate large-scale data systems and apply machine learning to real-world problems. Coursework spans algorithms, distributed systems, data engineering, and analytics, with elective tracks across computer science. Bavaria charges non-EU students EUR 6,000 per semester (EUR 12,000/year); EU students pay only the semester contribution.',
  jsonb_build_object(
    'gpa_min', 'B+ in a computer-science or strongly quantitative bachelor''s',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 88'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Curriculum analysis form', 'Proof of English proficiency')
  ),
  null, 'Data Science & Artificial Intelligence'
from public.universities u where u.slug = 'technical-university-of-munich'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- TUM · MSc Management and Technology
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-management-and-technology',
  'MSc in Management and Technology',
  'MSc', 'business_management', 'en',
  24, 12000.00, 'EUR', date '2026-05-31', 'October',
  'A flagship two-year master''s at the TUM School of Management combining a rigorous management core (strategy, finance, marketing, operations, innovation) with a compulsory technology track in fields such as computer science, electrical engineering, mechanical engineering, or life sciences. Bavaria charges non-EU students EUR 6,000 per semester (EUR 12,000/year); EU students pay only the semester contribution.',
  jsonb_build_object(
    'gpa_min', 'B+ with strong quantitative background',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 88'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'GMAT or GRE recommended', 'Reference letters')
  ),
  null, 'Business & Management Studies'
from public.universities u where u.slug = 'technical-university-of-munich'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Imperial · MSc Climate Change, Management and Finance
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-climate-change-management-and-finance',
  'MSc Climate Change, Management and Finance',
  'MSc', 'economics_finance', 'en',
  12, 45500.00, 'GBP', date '2026-06-18', 'September',
  'A 12-month interdisciplinary master''s delivered jointly by Imperial Business School and the Grantham Institute, equipping graduates with the climate-science literacy plus finance and management skills needed to drive the low-carbon transition. Curriculum blends climate science, sustainable finance, business economics, and electives specialising in either management or finance.',
  jsonb_build_object(
    'gpa_min', '2:1 (UK Upper Second) or international equivalent',
    'language_tests', jsonb_build_array('IELTS 7.0 (6.5 per component)', 'TOEFL iBT 100 (22 per component)'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two references', 'Interview')
  ),
  null, 'Business & Management Studies'
from public.universities u where u.slug = 'imperial-college-london'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Imperial · MSc Management
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-management',
  'MSc Management',
  'MSc', 'business_management', 'en',
  12, 47000.00, 'GBP', date '2026-06-18', 'September',
  'A 12-month pre-experience management master''s at Imperial Business School designed for high-achieving graduates from any discipline. Combines a rigorous business core (accounting, finance, microeconomics, strategy, marketing, operations, organisational behaviour) with five elective specialisations — finance, strategy, innovation, management & operations, or marketing — plus a consulting project.',
  jsonb_build_object(
    'gpa_min', '2:1 (UK Upper Second) or international equivalent',
    'language_tests', jsonb_build_array('IELTS 7.0 (6.5 per component)', 'TOEFL iBT 100 (22 per component)'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two references', 'GMAT/GRE optional', 'Interview')
  ),
  6, 'Business & Management Studies'
from public.universities u where u.slug = 'imperial-college-london'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Imperial · MSc Computing
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-computing',
  'MSc Computing',
  'MSc', 'computer_science_ai', 'en',
  12, 46000.00, 'GBP', null, 'October',
  'A 12-month conversion master''s at Imperial''s Department of Computing for mathematically strong graduates from non-computing disciplines. Builds practical expertise across declarative, imperative, and object-oriented paradigms; substantial software projects; and elective options spanning machine learning, cryptography, and computer graphics, culminating in an individual research project.',
  jsonb_build_object(
    'gpa_min', 'First-class honours (UK 1st) in a quantitative discipline',
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

-- Oxford · MSc Financial Economics
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-financial-economics',
  'MSc Financial Economics',
  'MSc', 'economics_finance', 'en',
  9, 62920.00, 'GBP', date '2026-03-04', 'September',
  'A nine-month master''s jointly delivered by Oxford''s Saïd Business School and the Department of Economics, combining rigorous economics foundations (micro, macro, econometrics) with finance core (asset pricing, corporate finance, financial economics) and electives. Designed for high-calibre graduates targeting investment banking, asset management, central banks, or PhD study.',
  jsonb_build_object(
    'gpa_min', 'First-class honours (UK 1st) in a strongly quantitative discipline',
    'language_tests', jsonb_build_array('IELTS 7.5 (7.0 per component)', 'TOEFL iBT 110 (22 per component)'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Three references', 'GMAT or GRE')
  ),
  null, 'Economics & Econometrics'
from public.universities u where u.slug = 'university-of-oxford'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Cambridge · MPhil Machine Learning and Machine Intelligence
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'mphil-machine-learning-and-machine-intelligence',
  'MPhil in Machine Learning and Machine Intelligence',
  'MPhil', 'computer_science_ai', 'en',
  11, 43260.00, 'GBP', date '2025-12-03', 'October',
  'An intensive 11-month research-oriented master''s in the Department of Engineering, delivered jointly by Cambridge''s Machine Learning Group, Speech Group, and Computer Vision and Robotics Group. Combines advanced coursework on probabilistic ML, deep learning, reinforcement learning, and computer vision with a substantial individual research project. Highly selective; designed as a launchpad to PhD study or top industry research labs.',
  jsonb_build_object(
    'gpa_min', 'First-class honours (UK 1st) or equivalent in a strongly quantitative discipline',
    'language_tests', jsonb_build_array('IELTS 7.5 (7.0 per component)', 'TOEFL iBT 110 (25 per component)'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Statement of interest', 'Two academic references', 'Research proposal')
  ),
  null, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'university-of-cambridge'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- UCL · MSc Computer Science
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-computer-science',
  'MSc Computer Science',
  'MSc', 'computer_science_ai', 'en',
  12, 42700.00, 'GBP', date '2026-03-27', 'September',
  'A 12-month conversion master''s designed for graduates without a computer-science background. Compulsory modules in programming, algorithms, databases, and operating systems are paired with electives spanning machine learning, interaction design, and software engineering. Final projects are frequently delivered in partnership with industry through the IXN Industry Exchange Network.',
  jsonb_build_object(
    'gpa_min', '2:1 (UK Upper Second) or international equivalent',
    'language_tests', jsonb_build_array('IELTS 6.5 (6.0 per component)', 'TOEFL iBT 92 (24 per component)'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two references')
  ),
  9, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'university-college-london'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- UCL · MSc Economics
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-economics',
  'MSc Economics',
  'MSc', 'economics_finance', 'en',
  12, 39200.00, 'GBP', date '2026-05-22', 'September',
  'A highly quantitative one-year economics master''s at UCL''s Department of Economics, training students for careers in central banks, government, consultancy, think tanks, and PhD pathways at leading universities. Combines intensive micro, macro, and econometrics coursework with practical and problem classes and a research dissertation.',
  jsonb_build_object(
    'gpa_min', 'First-class or strong 2:1 in a quantitative discipline (economics, mathematics, statistics, or related)',
    'language_tests', jsonb_build_array('IELTS 7.0 (6.5 per component)', 'TOEFL iBT 100 (24 per component)'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two academic references', 'GRE recommended')
  ),
  null, 'Economics & Econometrics'
from public.universities u where u.slug = 'university-college-london'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- ETH Zurich · MSc Mechanical Engineering
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-mechanical-engineering',
  'MSc Mechanical Engineering',
  'MSc', 'engineering', 'en',
  18, 1460.00, 'CHF', date '2025-12-15', 'September',
  'A research-oriented master''s at ETH''s Department of Mechanical and Process Engineering. Students choose a specialisation across energy, flow, and process engineering; mechatronics and robotics; biomedical engineering; or design and production. Combines advanced coursework with semester projects and a master''s thesis. ETH charges only a nominal CHF 730 per semester to all students regardless of nationality.',
  jsonb_build_object(
    'gpa_min', 'Equivalent to a strong Swiss BSc in mechanical engineering or related',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Statement of purpose', 'Two academic references')
  ),
  11, 'Engineering — Mechanical, Aeronautical & Manufacturing'
from public.universities u where u.slug = 'eth-zurich'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- EPFL · MSc Architecture
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-architecture',
  'MSc Architecture',
  'MSc', 'architecture_built_environment', 'en',
  24, 1460.00, 'CHF', date '2025-12-15', 'September',
  'A two-year master''s combining design studios with theoretical foundations and engagement with contemporary issues including sustainable development, energy, and the built environment. Curriculum integrates humanistic, structural, and technical elements via collaboration with civil engineering and environmental sciences. Taught in French and English. EPFL charges only a nominal CHF 730 per semester to all students regardless of nationality.',
  jsonb_build_object(
    'gpa_min', 'Strong bachelor''s in architecture or equivalent with a portfolio',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Portfolio', 'Letters of recommendation')
  ),
  null, 'Architecture / Built Environment'
from public.universities u where u.slug = 'epfl-lausanne'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Bocconi · MSc Marketing Management
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-marketing-management',
  'MSc in Marketing Management',
  'MSc', 'business_management', 'en',
  24, 18550.00, 'EUR', date '2026-02-13', 'September',
  'A two-year fully English-taught marketing master''s combining quantitative methods (analytics, consumer behaviour modelling, marketing research) with strategic thinking on brand management, digital marketing, retailing, and luxury. Strong placement into European and global FMCG, tech, and consulting firms.',
  jsonb_build_object(
    'gpa_min', 'B+',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'GMAT or GRE', 'Reference letters')
  ),
  null, 'Business & Management Studies'
from public.universities u where u.slug = 'bocconi-university'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- TU Delft · MSc Industrial Design Engineering
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-industrial-design-engineering',
  'MSc Industrial Design Engineering',
  'MSc', 'design', 'en',
  24, 22290.00, 'EUR', date '2025-12-01', 'September',
  'A two-year master''s at the Faculty of Industrial Design Engineering offering three specialisations: Design for Interaction (human–product interaction and digital experiences), Integrated Product Design (engineering-led product development for complex contexts), and Strategic Product Design (innovation strategy and design management). Coursework combines design studios, engineering, user research, and prototyping.',
  jsonb_build_object(
    'gpa_min', 'Top quartile of class (≈ GPA 3.0 / 75%) in industrial design, mechanical engineering, or related',
    'language_tests', jsonb_build_array('IELTS 6.5 (min 6.0 per section)', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Portfolio', 'Letters of recommendation')
  ),
  null, 'Art & Design'
from public.universities u where u.slug = 'tu-delft'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- ═════════════════════════════════════════════════════════════════════════
-- B. Programs at the new universities in existing countries
-- ═════════════════════════════════════════════════════════════════════════

-- Sapienza · MSc in Data Science
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-data-science',
  'MSc in Data Science',
  'MSc', 'data_science', 'en',
  24, 2924.00, 'EUR', null, 'September',
  'A two-year English-taught master''s jointly run by Sapienza''s Faculty of Information Engineering, Informatics and Statistics, training students in machine learning, statistical inference, big-data engineering, and data-driven decision making. Tuition shown is the maximum standard non-EU contribution; the actual fee for most students is income-based and lower.',
  jsonb_build_object(
    'gpa_min', 'Strong record in computer science, mathematics, statistics, or engineering',
    'language_tests', jsonb_build_array('IELTS 6.0', 'TOEFL iBT 78', 'Cambridge B2 First'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter')
  ),
  null, 'Data Science & Artificial Intelligence'
from public.universities u where u.slug = 'sapienza-universita-di-roma'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Sapienza · MSc in Architecture
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-architecture',
  'MSc in Architecture',
  'MSc', 'architecture_built_environment', 'en',
  24, 2924.00, 'EUR', null, 'September',
  'A two-year English-taught architecture master''s at one of Italy''s largest schools of architecture, blending design studios with theory, history, and technology of architecture, urban design, and the built environment. Students engage with Rome''s exceptional architectural heritage as a living case study.',
  jsonb_build_object(
    'gpa_min', 'B with strong portfolio',
    'language_tests', jsonb_build_array('IELTS 6.0', 'TOEFL iBT 78'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Portfolio')
  ),
  null, 'Architecture / Built Environment'
from public.universities u where u.slug = 'sapienza-universita-di-roma'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Bologna · MSc in Artificial Intelligence
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-artificial-intelligence',
  'MSc in Artificial Intelligence',
  'MSc', 'computer_science_ai', 'en',
  24, 3000.00, 'EUR', null, 'September',
  'A two-year English-taught second-cycle programme covering machine learning, knowledge representation, natural language processing, computer vision, and the cognitive foundations of AI. Strong methodological core with applied modules and a thesis often executed with industrial or research partners.',
  jsonb_build_object(
    'gpa_min', 'B+ with computer science, engineering, mathematics, or physics background',
    'language_tests', jsonb_build_array('IELTS 6.0', 'TOEFL iBT 78'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter')
  ),
  null, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'university-of-bologna'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Bologna · MSc in International Relations
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-international-relations',
  'MSc in International Relations',
  'MSc', 'social_sciences', 'en',
  24, 3000.00, 'EUR', null, 'September',
  'A two-year English-taught master''s offered by the Department of Political and Social Sciences with three specialisation tracks — European Affairs, International Affairs, and Crime, Justice and Security. Combines international relations theory, area studies, international law, and qualitative and quantitative methods.',
  jsonb_build_object(
    'gpa_min', 'Strong record in political science, international relations, economics, law, or a related social science',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 87'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Reference letters')
  ),
  null, 'Politics & International Studies'
from public.universities u where u.slug = 'university-of-bologna'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Warwick · MSc Business Analytics & Artificial Intelligence
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-business-analytics-and-artificial-intelligence',
  'MSc Business Analytics & Artificial Intelligence',
  'MSc', 'data_science', 'en',
  12, 38150.00, 'GBP', date '2026-08-02', 'September',
  'A 12-month full-time master''s at Warwick Business School training students to extract insights from large data sets using AI, statistical methods, optimisation, and machine learning. Curriculum covers data visualisation in Tableau, programming in SQL, R, and Python, and offers project options including external consultancy, academic research, or an applied business practice module.',
  jsonb_build_object(
    'gpa_min', '2:1 (UK Upper Second) or international equivalent',
    'language_tests', jsonb_build_array('IELTS 7.0 (6.5 per component)', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two references')
  ),
  17, 'Business Analytics'
from public.universities u where u.slug = 'university-of-warwick'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Warwick · MSc Economics
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-economics',
  'MSc Economics',
  'MSc', 'economics_finance', 'en',
  12, 33950.00, 'GBP', null, 'September',
  'A 12-month taught master''s at Warwick''s Department of Economics combining rigorous core training in microeconomics, macroeconomics, and econometrics with specialist options across labour, development, behavioural, and applied fields, capped by a dissertation.',
  jsonb_build_object(
    'gpa_min', 'First-class honours in economics or a closely related quantitative discipline',
    'language_tests', jsonb_build_array('IELTS 7.0 (6.5 per component)', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two academic references', 'GRE recommended')
  ),
  29, 'Economics & Econometrics'
from public.universities u where u.slug = 'university-of-warwick'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Manchester · MSc Management
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-management',
  'MSc Management',
  'MSc', 'business_management', 'en',
  12, 32000.00, 'GBP', null, 'September',
  'A 12-month full-time master''s at Alliance Manchester Business School designed for recent graduates from any discipline. Covers the foundations of business — accounting, finance, marketing, strategy, organisational behaviour, operations — with electives, group consulting projects, and access to Manchester''s extensive corporate network.',
  jsonb_build_object(
    'gpa_min', '2:1 (UK Upper Second) or international equivalent',
    'language_tests', jsonb_build_array('IELTS 7.0 (6.5 per component)', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two references')
  ),
  31, 'Business & Management Studies'
from public.universities u where u.slug = 'university-of-manchester'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Manchester · MSc Data Science
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-data-science',
  'MSc Data Science',
  'MSc', 'data_science', 'en',
  12, 33500.00, 'GBP', null, 'September',
  'A 12-month full-time master''s offered by Manchester''s Department of Computer Science, with optional pathways including Computer Science, Statistics, and Social Analytics. Covers machine learning, data engineering, statistical foundations, and applied data analysis, with a substantial individual research project as the dissertation.',
  jsonb_build_object(
    'gpa_min', '2:1 (UK Upper Second) in computer science, mathematics, statistics, or a related quantitative subject',
    'language_tests', jsonb_build_array('IELTS 7.0 (6.5 per component)', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two references')
  ),
  null, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'university-of-manchester'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- LMU Munich · MSc Economics
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-economics',
  'MSc Economics',
  'MSc', 'economics_finance', 'en',
  24, 12000.00, 'EUR', date '2026-05-31', 'October',
  'A two-year fully English-taught research-oriented economics master''s with rigorous coursework in micro, macro, and econometrics, and electives across applied tracks (industrial organisation, public, international, behavioural). Bavaria charges non-EU students EUR 6,000 per semester (EUR 12,000/year); EU students pay only the per-semester contribution.',
  jsonb_build_object(
    'gpa_min', 'B+ with strong quantitative coursework',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 88'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'GRE recommended')
  ),
  null, 'Economics & Econometrics'
from public.universities u where u.slug = 'ludwig-maximilian-university-of-munich'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- RWTH Aachen · MSc Mechanical Engineering
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-mechanical-engineering',
  'MSc Mechanical Engineering',
  'MSc', 'engineering', 'en',
  24, 600.00, 'EUR', date '2026-03-01', 'October',
  'A two-year master''s at RWTH''s Faculty of Mechanical Engineering — Germany''s largest — with specialisation tracks across automotive engineering, energy technology, production engineering, plastics technology, and computational engineering science. Strong industrial collaboration with the German automotive and high-tech sectors. North Rhine-Westphalia does not charge tuition fees; students pay only a per-semester contribution (~EUR 300/semester).',
  jsonb_build_object(
    'gpa_min', 'Bachelor in mechanical engineering or a closely related discipline with B+ average',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Proof of English proficiency')
  ),
  31, 'Engineering — Mechanical, Aeronautical & Manufacturing'
from public.universities u where u.slug = 'rwth-aachen-university'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- University of Amsterdam · MSc Business Administration
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-business-administration',
  'MSc Business Administration',
  'MSc', 'business_management', 'en',
  12, 17500.00, 'EUR', date '2026-04-01', 'September',
  'A one-year English-taught master''s at the Amsterdam Business School with multiple tracks (International Management, Strategy, Digital Business, Entrepreneurship & Innovation, Leadership & Management). Combines core management training with case-based learning, electives, and a thesis often grounded in a real organisational setting. Tuition shown is the non-EU/EEA rate; EU/EEA students pay the statutory Dutch rate (~EUR 2,500/year).',
  jsonb_build_object(
    'gpa_min', 'Above-average bachelor''s in business, economics, or a related field',
    'language_tests', jsonb_build_array('IELTS 6.5 (min 6.0 per section)', 'TOEFL iBT 92'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'GMAT/GRE for selected tracks')
  ),
  null, 'Business & Management Studies'
from public.universities u where u.slug = 'university-of-amsterdam'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Universitat Pompeu Fabra · MSc in Finance
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-in-finance',
  'MSc in Finance',
  'MSc', 'economics_finance', 'en',
  12, 18900.00, 'EUR', date '2026-07-02', 'September',
  'A one-year intensive English-taught finance master''s offered by UPF jointly with the Barcelona School of Economics (BSE). Quantitatively rigorous coverage of asset pricing, corporate finance, financial econometrics, and derivatives, with strong placement into investment banking, asset management, and finance-oriented PhD programmes.',
  jsonb_build_object(
    'gpa_min', 'Strong undergraduate record in economics, finance, mathematics, statistics, engineering, or business',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 90', 'Duolingo English Test 120'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Two reference letters', 'GRE recommended')
  ),
  null, 'Finance'
from public.universities u where u.slug = 'universitat-pompeu-fabra'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- ═════════════════════════════════════════════════════════════════════════
-- C. Programs in new countries (Norway, Czech Republic, Poland, Estonia)
-- ═════════════════════════════════════════════════════════════════════════

-- NTNU · MSc Industrial Ecology
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-industrial-ecology',
  'MSc in Industrial Ecology',
  'MSc', 'engineering', 'en',
  24, null, 'NOK', date '2026-03-01', 'August',
  'A two-year English-taught master''s combining sustainability science, life-cycle assessment, and systems thinking to analyse climate mitigation, energy and resource use, the circular economy, and biodiversity. Tuition is NOK 0 for EU/EEA/Swiss citizens at this Norwegian public university; non-EEA students pay tuition set by NTNU per year.',
  jsonb_build_object(
    'gpa_min', 'BSc/BEng in Mathematics, Natural Sciences, Engineering or Social Sciences with at least 12 ECTS in mathematics or statistics',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'English proficiency proof')
  ),
  null, 'Engineering & Technology'
from public.universities u where u.slug = 'ntnu'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- NTNU · MSc Sustainable Energy
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-sustainable-energy',
  'MSc in Sustainable Energy',
  'MSc', 'engineering', 'en',
  24, null, 'NOK', date '2026-03-01', 'August',
  'A two-year English-taught master''s programme covering renewable energy technologies, energy systems, smart grids, and the technical and economic transition to a low-carbon energy mix. Tuition is NOK 0 for EU/EEA/Swiss citizens; non-EEA students pay tuition set by NTNU per year.',
  jsonb_build_object(
    'gpa_min', 'BSc/BEng in a relevant engineering or natural-science discipline',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'English proficiency proof')
  ),
  null, 'Engineering & Technology'
from public.universities u where u.slug = 'ntnu'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- University of Oslo · MSc Data Science
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-data-science',
  'Master of Science in Data Science',
  'MSc', 'data_science', 'en',
  24, 286000.00, 'NOK', date '2026-04-15', 'August',
  'A two-year English-taught research-led master''s combining mathematics, statistics, and informatics. Students choose specialisations in statistics and machine learning, data science and informatics, or biostatistics. Tuition shown is the non-EEA rate (NOK 286,000/year); EU/EEA/Swiss citizens pay only a small semester registration fee.',
  jsonb_build_object(
    'gpa_min', 'Bachelor''s degree in mathematics, statistics, computer science, or a related quantitative discipline with C/2.7 GPA average or better',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'English proficiency proof')
  ),
  null, 'Mathematics'
from public.universities u where u.slug = 'university-of-oslo'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- BI Norwegian Business School · MSc Business Analytics
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-business-analytics',
  'Master of Science in Business Analytics',
  'MSc', 'business_management', 'en',
  24, 140000.00, 'NOK', date '2026-03-01', 'August',
  'A two-year English-taught master''s preparing students for analytics roles at the intersection of data science and business strategy. Coursework covers statistical learning, predictive modelling, optimisation, business intelligence tools, and decision-making with data. Unlike Norwegian public universities, BI charges tuition to all students regardless of nationality.',
  jsonb_build_object(
    'gpa_min', 'Bachelor''s degree with a quantitative core (mathematics, statistics, economics, or business analytics)',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'GMAT or GRE recommended')
  ),
  null, 'Business & Management Studies'
from public.universities u where u.slug = 'bi-norwegian-business-school'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Charles University · MA Economics and Finance
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'ma-economics-and-finance',
  'MA in Economics and Finance',
  'MA', 'economics_finance', 'en',
  24, 7000.00, 'EUR', date '2026-08-31', 'October',
  'A two-year English-taught master''s at the Faculty of Social Sciences offering rigorous quantitative training in economics and finance, with electives in macroeconomics, microeconomics, econometrics, financial markets, and risk management. Designed for graduates aiming at PhD studies, central banks, investment banking, or quantitative research roles.',
  jsonb_build_object(
    'gpa_min', 'Bachelor''s degree with at least two terms of bachelor-level mathematics and a strong quantitative background',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 83', 'PTE Academic 56'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Reference letters', 'English proficiency proof')
  ),
  null, 'Economics & Econometrics'
from public.universities u where u.slug = 'charles-university'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Charles University · MA International Economic and Political Studies
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'ma-international-economic-and-political-studies',
  'MA in International Economic and Political Studies',
  'MA', 'social_sciences', 'en',
  24, 6000.00, 'EUR', date '2026-04-30', 'October',
  'A two-year English-taught interdisciplinary master''s at the Faculty of Social Sciences combining economics, political science, history, and sociology. Students specialise in International Economics or International Politics, with a double-degree option in cooperation with the University of Konstanz (Germany).',
  jsonb_build_object(
    'gpa_min', 'Bachelor''s degree in social sciences, economics, political science, history, or a related discipline',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 83', 'PTE Academic 56'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Motivation letter', 'Reference letters', 'English proficiency proof')
  ),
  null, 'Politics'
from public.universities u where u.slug = 'charles-university'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- CTU · MSc Open Informatics — Data Science
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-open-informatics-data-science',
  'MSc in Open Informatics — Data Science',
  'MSc', 'computer_science_ai', 'en',
  24, 128000.00, 'CZK', date '2026-04-19', 'September',
  'A two-year English-taught master''s at the Faculty of Electrical Engineering offering a Data Science specialisation within the Open Informatics programme. Coursework covers machine learning, statistical learning, data mining, large-scale data processing, and applied AI. Tuition is approximately CZK 64,000 per semester.',
  jsonb_build_object(
    'gpa_min', 'Bachelor''s degree in computer science, informatics, electrical engineering, mathematics, or a related quantitative discipline',
    'language_tests', jsonb_build_array('IELTS 6.0', 'TOEFL iBT 78', 'Cambridge B2 First'),
    'documents', jsonb_build_array('Bachelor''s transcript and notarised diploma', 'CV', 'Motivation letter', 'English proficiency proof')
  ),
  null, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'czech-technical-university'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- University of Warsaw · MA Data Science and Business Analytics
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'ma-data-science-and-business-analytics',
  'MA in Data Science and Business Analytics',
  'MA', 'data_science', 'en',
  24, 3500.00, 'EUR', date '2026-07-15', 'October',
  'A two-year English-taught master''s at the Faculty of Economic Sciences combining statistical learning, machine learning, econometrics, and applied data analysis with business and economics coursework. Designed for graduates aiming at analytics roles in industry, consulting, or financial services.',
  jsonb_build_object(
    'gpa_min', 'Bachelor''s degree with quantitative coursework (mathematics, statistics, economics, or computer science)',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 87'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'English proficiency proof')
  ),
  null, 'Economics & Econometrics'
from public.universities u where u.slug = 'university-of-warsaw'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- University of Warsaw · MA Quantitative Finance
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'ma-quantitative-finance',
  'MA in Quantitative Finance',
  'MA', 'economics_finance', 'en',
  24, 3900.00, 'EUR', date '2026-07-15', 'October',
  'A two-year English-taught master''s at the Faculty of Economic Sciences combining advanced econometrics, financial mathematics, derivatives pricing, risk management, and quantitative methods. Designed for graduates aiming at quantitative analyst, risk, or trading roles in banks, asset managers, and fintech.',
  jsonb_build_object(
    'gpa_min', 'Bachelor''s degree with strong mathematics, statistics, or quantitative economics background',
    'language_tests', jsonb_build_array('IELTS 6.5', 'TOEFL iBT 87'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'English proficiency proof')
  ),
  null, 'Economics & Econometrics'
from public.universities u where u.slug = 'university-of-warsaw'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- University of Tartu · MSc Computer Science
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-computer-science',
  'Master of Science in Computer Science',
  'MSc', 'computer_science_ai', 'en',
  24, 6000.00, 'EUR', date '2026-03-15', 'September',
  'A two-year English-taught master''s with specialisations in theoretical computer science, distributed systems, and artificial intelligence, taught at one of Northern Europe''s leading research universities. Tuition fee reductions of 25%, 50%, or 100% are available on a competitive basis for one semester at a time.',
  jsonb_build_object(
    'gpa_min', 'Bachelor''s degree in computer science, informatics, mathematics, or a related discipline with strong programming and mathematics background',
    'language_tests', jsonb_build_array('IELTS 6.0', 'TOEFL iBT 75', 'C1 Advanced (CAE)'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'English proficiency proof')
  ),
  null, 'Computer Science & Information Systems'
from public.universities u where u.slug = 'university-of-tartu'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- ═════════════════════════════════════════════════════════════════════════
-- D. Design / architecture / social-sciences fillers
-- ═════════════════════════════════════════════════════════════════════════

-- Royal College of Art · MA Design Products
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'ma-design-products',
  'MA Design Products',
  'MA', 'design', 'en',
  12, 38650.00, 'GBP', date '2026-06-03', 'September',
  'A 45-week studio-based master''s training designers to tackle complex contemporary challenges through research-led, cross-disciplinary product design. Students develop skills in identifying design opportunities, prototyping, and measuring outcomes against the UN Sustainable Development Goals, working from RCA''s Battersea campus.',
  jsonb_build_object(
    'gpa_min', 'UK 2:1 (Upper Second) honours degree or international equivalent',
    'language_tests', jsonb_build_array('IELTS Academic 6.5 (min 5.5 per component)', 'TOEFL iBT 92'),
    'documents', jsonb_build_array('Portfolio of design work', 'Research/project agenda (600-800 words)', 'Personal statement (300 words)', 'Video submission (max 2 minutes)', 'Bachelor''s transcript', 'Two references')
  ),
  1, 'Art & Design'
from public.universities u where u.slug = 'royal-college-of-art'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Goldsmiths · MA Design: Expanded Practice
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'ma-design-expanded-practice',
  'MA Design: Expanded Practice',
  'MA', 'design', 'en',
  15, 29500.00, 'GBP', date '2026-05-18', 'September',
  'A 15-month postdisciplinary master''s for designers wanting to push beyond traditional boundaries. Students join one of six studios — Communication & Experience, Fashions & Embodiment, Speculation & Techniques, Interactions & Experiments, Spaces & Participation, or Culture & Ecologies — and develop a critical, socially conscious design practice through project-based learning.',
  jsonb_build_object(
    'gpa_min', 'UK 2:1 (Upper Second) or international equivalent in a relevant subject; non-design backgrounds also considered',
    'language_tests', jsonb_build_array('IELTS 6.5 (6.5 in writing, no element below 6.0)', 'TOEFL iBT 92'),
    'documents', jsonb_build_array('Portfolio (five projects for design backgrounds; creative document otherwise)', 'Personal statement', 'Application brief', 'Bachelor''s transcript', 'Academic reference')
  ),
  26, 'Art & Design'
from public.universities u where u.slug = 'goldsmiths-university-of-london'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Polimi · MSc Integrated Product Design
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-integrated-product-design',
  'MSc in Integrated Product Design',
  'MSc', 'design', 'en',
  24, 3898.20, 'EUR', date '2026-01-29', 'September',
  'A two-year English-taught design master''s focused on the integrated design of products and the systems around them. Combines studio-based design projects with engineering, materials, manufacturing, and user-research training, taught at Polimi''s School of Design.',
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

-- UCL · MArch Architecture Design (Bartlett)
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'march-architecture-design',
  'MArch Architecture Design',
  'MArch', 'architecture_built_environment', 'en',
  12, 35400.00, 'GBP', date '2026-06-26', 'September',
  'A one-year design-led master''s at The Bartlett School of Architecture — ranked the world''s number one school of architecture in QS Architecture & Built Environment for multiple consecutive years. Students join one of fifteen research-led design studios exploring contemporary architectural agendas through speculative, technical, and theoretical projects.',
  jsonb_build_object(
    'gpa_min', 'UK upper second-class (2:1) or international equivalent in architecture or a closely related discipline',
    'language_tests', jsonb_build_array('IELTS 6.5 (min 6.0 per component)', 'TOEFL iBT 92'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Portfolio', 'Two references')
  ),
  1, 'Architecture / Built Environment'
from public.universities u where u.slug = 'university-college-london'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- TU Delft · MSc Architecture, Urbanism and Building Sciences
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'msc-architecture-urbanism-and-building-sciences',
  'MSc Architecture, Urbanism and Building Sciences',
  'MSc', 'architecture_built_environment', 'en',
  24, 22290.00, 'EUR', date '2026-04-01', 'September',
  'A 120 ECTS, two-year English-taught master''s at the Faculty of Architecture and the Built Environment, with five tracks: Architecture, Urbanism, Landscape Architecture, Management in the Built Environment, and Building Technology. Combines design studios, technology and theory courses, and a graduation project.',
  jsonb_build_object(
    'gpa_min', 'Top quartile of class in a relevant Bachelor''s (≈ GPA 3.0 / 75%)',
    'language_tests', jsonb_build_array('IELTS 6.5 (min 6.0 per section)', 'TOEFL iBT 90'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Motivation letter', 'Portfolio', 'Two letters of recommendation')
  ),
  3, 'Architecture / Built Environment'
from public.universities u where u.slug = 'tu-delft'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- King's College London · MA International Relations
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'ma-international-relations',
  'MA International Relations',
  'MA', 'social_sciences', 'en',
  12, 38300.00, 'GBP', date '2026-08-25', 'September',
  'A one-year taught master''s at the Department of War Studies, one of the largest international relations and security studies departments in Europe. Students take core IR theory and methods modules alongside optional units spanning conflict, foreign policy, regional studies, and global political economy, culminating in a 15,000-word dissertation.',
  jsonb_build_object(
    'gpa_min', 'High UK 2:1 (final mark of 67% or above) or international equivalent',
    'language_tests', jsonb_build_array('IELTS 7.0 (min 6.5 per component)', 'TOEFL iBT 100 (min 25 per component)'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Personal statement', 'Two academic references')
  ),
  null, 'Politics & International Studies'
from public.universities u where u.slug = 'kings-college-london'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Hertie School · Master of Public Policy
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-of-public-policy',
  'Master of Public Policy (MPP)',
  'MPP', 'social_sciences', 'en',
  24, 19250.00, 'EUR', date '2026-05-31', 'September',
  'A two-year, 120 ECTS interdisciplinary master''s for future policymakers, drawing on economics, political science, law, public management, statistics, and data science. Students choose between policy analysis and governance & leadership specialisations and complete an integrated internship or professional year.',
  jsonb_build_object(
    'gpa_min', 'Strong undergraduate degree (typically B+/2:1 or equivalent) in a relevant social science, humanities, or quantitative discipline',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Statement of motivation', 'Two letters of recommendation', 'GRE recommended')
  ),
  101, 'Politics & International Studies'
from public.universities u where u.slug = 'hertie-school'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Geneva Graduate Institute · Master in International Affairs
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-international-affairs-mia',
  'Master in International Affairs (MIA)',
  'MA', 'social_sciences', 'en',
  24, 8000.00, 'CHF', date '2026-01-15', 'September',
  'A two-year multidisciplinary master''s for students aiming at careers in international organisations, NGOs, think tanks, diplomacy, or the private sector. Students combine core training in international relations, economics, history, law, and political science with a specialisation, electives, and a capstone, leveraging the Institute''s position in the heart of international Geneva.',
  jsonb_build_object(
    'gpa_min', 'Bachelor''s degree with a strong academic record in a relevant discipline (social sciences, humanities, law, economics)',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript and diploma', 'CV', 'Statement of motivation', 'Two academic references', 'GRE strongly recommended')
  ),
  null, 'Politics & International Studies'
from public.universities u where u.slug = 'geneva-graduate-institute'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;

-- Sciences Po · Master in Public Policy
insert into public.programs (
  university_id, slug, name, degree, field_of_study, language,
  duration_months, tuition_per_year, currency, application_deadline, start_month,
  description, requirements, qs_subject_rank, qs_subject_area
)
select u.id,
  'master-in-public-policy',
  'Master in Public Policy',
  'MA', 'social_sciences', 'en',
  24, 20640.00, 'EUR', date '2026-01-04', 'September',
  'A two-year multidisciplinary policy master''s at the Sciences Po School of Public Affairs, training future leaders in government, international organisations, and the private sector. Combines core courses in policy analysis, economics, law, and management with seven specialisation streams (e.g. Economics & Public Policy, Energy & Environment, Global Health, Digital, Social Policy & Innovation).',
  jsonb_build_object(
    'gpa_min', 'Strong undergraduate degree in a relevant social science, humanities, or quantitative discipline',
    'language_tests', jsonb_build_array('IELTS 7.0', 'TOEFL iBT 100', 'Cambridge C1 Advanced'),
    'documents', jsonb_build_array('Bachelor''s transcript', 'CV', 'Statement of motivation', 'Two letters of recommendation', 'Video interview')
  ),
  2, 'Politics & International Studies'
from public.universities u where u.slug = 'sciences-po'
on conflict (university_id, slug) do update set
  name = excluded.name, degree = excluded.degree, field_of_study = excluded.field_of_study,
  language = excluded.language, duration_months = excluded.duration_months,
  tuition_per_year = excluded.tuition_per_year, currency = excluded.currency,
  application_deadline = excluded.application_deadline, start_month = excluded.start_month,
  description = excluded.description, requirements = excluded.requirements,
  qs_subject_rank = excluded.qs_subject_rank, qs_subject_area = excluded.qs_subject_area;
