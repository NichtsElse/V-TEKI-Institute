-- V-TEKI Complete Seed Data (Extended)
-- Berisi data lengkap: Organizations, Users (semua role), Programs, Batches (termasuk yang closed), 
-- Invoices, Enrollments, Payments, Attendance, Assessments, Feedback, dan Certificates.

-- Kosongkan data lama agar tidak ada error duplikat (UNIQUE constraint)
-- Purpose: Seed complete demo data for V-TEKI Supabase migrations and local verification.
-- Who uses it: Supabase SQL Editor operators, migration runners, and scripts/seed-supabase-from-sql.mjs.
-- Main dependencies: Tables from schema_fixed.sql and confirmed demo users from seed_auth_users.sql.
-- Public/main functions: Idempotent INSERT/UPSERT blocks for demo organizations, users, catalog, learning activity, and outcomes.
-- Important side effects: Truncates demo data tables with CASCADE, then upserts deterministic demo rows.

TRUNCATE TABLE
  feedback,
  assessment_submissions,
  assessment_questions,
  assessments,
  attendance_records,
  attendance_sessions,
  certificates,
  payments,
  enrollments,
  invoices,
  batches,
  programs,
  trainers,
  users_profile,
  organizations
CASCADE;

-- 1. Organizations
INSERT INTO organizations (id, name, industry, contact_email) VALUES
  ('org_stn', 'PT Solusi Transformasi Nusantara', 'Technology', 'contact@stn.co.id'),
  ('org_bni', 'Bank Negara Indonesia', 'Finance', 'training@bni.co.id'),
  ('org_tlk', 'Telkom Indonesia', 'Telecommunications', 'learning@telkom.co.id')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, industry = EXCLUDED.industry;

-- 2. Users Profile (Admin, Trainers, Corporate PIC, Participants)
INSERT INTO users_profile (id, email, full_name, role, phone, status, password, created_date, organization_id, organization_name) VALUES
  ('user_admin_demo', 'admin@vteki.local', 'Demo Admin', 'academy_admin', '021-555-0001', 'active', 'admin123', '2026-01-01T08:00:00Z', NULL, NULL),
  ('user_superadmin_demo', 'superadmin@vteki.local', 'Super Admin', 'super_admin', '021-555-0002', 'active', 'superadmin123', '2026-01-01T07:00:00Z', NULL, NULL),
  ('user_trainer_demo', 'trainer@vteki.local', 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE', 'trainer', '081300000001', 'active', 'trainer123', '2026-01-03T08:00:00Z', NULL, NULL),
  ('user_trainer_2_demo', 'trainer2@vteki.local', 'Nadia Pratama', 'trainer', '081300000005', 'active', 'trainer123', '2026-04-01T08:00:00Z', NULL, NULL),
  ('user_trainer_rafael', 'rafael.mahendra@vteki.local', 'Rafael Mahendra', 'trainer', '081300000002', 'active', 'welcome123', '2026-01-20T08:00:00Z', NULL, NULL),
  ('user_trainer_salma', 'salma.wijaya@vteki.local', 'Salma Wijaya', 'trainer', '081300000003', 'active', 'welcome123', '2026-02-08T08:00:00Z', NULL, NULL),
  ('user_trainer_budi', 'budi.santoso@vteki.local', 'Budi Santoso', 'trainer', '081300000004', 'active', 'welcome123', '2026-03-01T08:00:00Z', NULL, NULL),
  ('user_corporate_demo', 'corporate@vteki.local', 'Rizky Ananta', 'corporate_pic', '021-555-0100', 'active', 'corporate123', '2026-01-04T08:00:00Z', 'org_stn', 'PT Solusi Transformasi Nusantara'),
  ('user_corporate_bni', 'pic.bni@vteki.local', 'Andi Susanto', 'corporate_pic', '021-555-0101', 'active', 'welcome123', '2026-02-01T08:00:00Z', 'org_bni', 'Bank Negara Indonesia'),
  ('user_participant_demo', 'participant@vteki.local', 'Demo Participant', 'participant', '081234567890', 'active', 'participant123', '2026-01-02T08:00:00Z', NULL, NULL),
  ('user_participant_aulia', 'aulia.ramadhan@example.com', 'Aulia Ramadhan', 'participant', '081234567891', 'active', 'welcome123', '2026-06-01T08:00:00Z', NULL, NULL),
  ('user_part_02', 'dina.kusuma@example.com', 'Dina Kusuma', 'participant', '081298765432', 'active', 'welcome123', '2026-06-02T08:00:00Z', 'org_stn', 'PT Solusi Transformasi Nusantara'),
  ('user_part_03', 'bima.satria@example.com', 'Bima Satria', 'participant', '081311223344', 'active', 'welcome123', '2026-06-03T08:00:00Z', 'org_stn', 'PT Solusi Transformasi Nusantara'),
  ('user_part_04', 'meylani.putri@example.com', 'Meylani Putri', 'participant', '081355667788', 'active', 'welcome123', '2026-06-04T08:00:00Z', 'org_stn', 'PT Solusi Transformasi Nusantara'),
  ('user_part_05', 'farhan.maulana@example.com', 'Farhan Maulana', 'participant', '081344556677', 'active', 'welcome123', '2026-06-05T08:00:00Z', NULL, NULL),
  ('user_part_06', 'cindy.wijaya@example.com', 'Cindy Wijaya', 'participant', '081122334455', 'active', 'welcome123', '2026-06-06T08:00:00Z', 'org_bni', 'Bank Negara Indonesia'),
  ('user_part_07', 'dimas.pratama@example.com', 'Dimas Pratama', 'participant', '081133445566', 'active', 'welcome123', '2026-06-07T08:00:00Z', 'org_bni', 'Bank Negara Indonesia')
ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, role=EXCLUDED.role, organization_id=EXCLUDED.organization_id;

-- 3. Trainers
INSERT INTO trainers (id, full_name, email, title, expertise, experience_years, status) VALUES
  ('trainer_nadia', 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE', 'trainer@vteki.local', 'Trainer & Program Lead', 'Enterprise AI Advisory, Strategy & Transformation', 16, 'active'),
  ('trainer_nadia_2', 'Nadia Pratama', 'trainer2@vteki.local', 'Trainer & Program Lead', 'Enterprise AI Advisory, Strategy & Transformation', 16, 'active'),
  ('trainer_rafael', 'Rafael Mahendra', 'rafael.mahendra@vteki.local', 'Data Analytics Lead', 'SQL Analytics, BI Dashboards', 11, 'inactive'),
  ('trainer_salma', 'Salma Wijaya', 'salma.wijaya@vteki.local', 'Digital Transformation Advisor', 'Transformation Roadmaps', 12, 'inactive'),
  ('trainer_budi', 'Budi Santoso', 'budi.santoso@vteki.local', 'Cloud Architect', 'AWS, Azure, DevOps', 10, 'inactive')
ON CONFLICT (id) DO UPDATE SET full_name=EXCLUDED.full_name;

-- 4. Programs
INSERT INTO programs (id, name, code, description, program_type, delivery_mode, duration_hours, price, capacity, status, category, level, passing_score, min_attendance_pct) VALUES
  ('prog_ai_foundation', 'Applied AI for Business Teams', 'AIBT-101', 'Practical AI for daily business operations.', 'workshop', 'hybrid', 24, 3500000, 40, 'published', 'Artificial Intelligence', 'beginner', 70, 80),
  ('prog_data_bootcamp', 'Data Analytics Bootcamp', 'DAB-201', 'Immersive data bootcamp covering SQL and Dashboards.', 'bootcamp', 'hybrid', 40, 5200000, 35, 'published', 'Data Analytics', 'intermediate', 70, 80),
  ('prog_exec_transform', 'Executive Digital Transformation', 'EDTS-301', 'Leadership program on digital models.', 'executive_program', 'offline', 18, 9800000, 25, 'published', 'Leadership', 'executive', 70, 80),
  ('prog_cyber_awareness', 'Cybersecurity Awareness', 'CSAP-110', 'Safe digital practices for professionals.', 'webinar', 'online', 8, 950000, 100, 'published', 'Cybersecurity', 'beginner', 70, 80),
  ('prog_cloud_arch', 'Cloud Architecture Fundamentals', 'CAF-201', 'Introduction to scalable cloud architecture.', 'workshop', 'online', 32, 4500000, 50, 'published', 'Cloud Computing', 'intermediate', 75, 80)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;

-- 5. Batches
INSERT INTO batches (id, name, program_id, trainer_id, trainer_name, program_name, start_date, end_date, status, capacity, enrolled_count) VALUES
  ('batch_ai_foundation_july', 'Applied AI - July 2026', 'prog_ai_foundation', 'trainer_nadia', 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE', 'Applied AI for Business Teams', '2026-07-08', '2026-07-24', 'open', 40, 18),
  ('batch_data_bootcamp_aug', 'Data Bootcamp - August 2026', 'prog_data_bootcamp', 'trainer_nadia', 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE', 'Data Analytics Bootcamp', '2026-08-03', '2026-08-28', 'open', 35, 14),
  ('batch_exec_sep', 'Exec Transformation - Sept 2026', 'prog_exec_transform', 'trainer_nadia', 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE', 'Executive Digital Transformation', '2026-09-10', '2026-09-12', 'open', 25, 9),
  ('batch_cloud_may', 'Cloud Architecture - May 2026', 'prog_cloud_arch', 'trainer_nadia', 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE', 'Cloud Architecture Fundamentals', '2026-05-01', '2026-05-20', 'closed', 50, 48)
ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status;

-- 6. Invoices
INSERT INTO invoices (id, invoice_number, organization_id, organization_name, total_amount, status, due_date) VALUES
  ('inv_001', 'INV-2026-0001', NULL, NULL, 3500000, 'paid', '2026-07-05'),
  ('inv_002', 'INV-2026-0002', 'org_stn', 'PT Solusi Transformasi Nusantara', 10400000, 'paid', '2026-08-05'),
  ('inv_003', 'INV-2026-0003', 'org_bni', 'Bank Negara Indonesia', 9000000, 'paid', '2026-05-05')
ON CONFLICT (id) DO UPDATE SET total_amount=EXCLUDED.total_amount;

-- 7. Enrollments
INSERT INTO enrollments (id, batch_id, participant_id, full_name, email, organization_id, organization_name, program_id, program_name, batch_name, status, enrollment_status, completion_status, invoice_id, payment_status, attendance_percentage, pre_assessment_status, post_assessment_status, certificate_id) VALUES
  ('reg_001', 'batch_ai_foundation_july', 'user_participant_aulia', 'Aulia Ramadhan', 'aulia.ramadhan@example.com', NULL, NULL, 'prog_ai_foundation', 'Applied AI for Business Teams', 'Applied AI - July 2026', 'confirmed', 'confirmed', 'in_progress', 'inv_001', 'paid', 50, 'completed', 'pending', NULL),
  ('reg_002', 'batch_data_bootcamp_aug', 'user_part_02', 'Dina Kusuma', 'dina.kusuma@example.com', 'org_stn', 'PT Solusi Transformasi Nusantara', 'prog_data_bootcamp', 'Data Analytics Bootcamp', 'Data Bootcamp - August 2026', 'confirmed', 'confirmed', 'not_started', 'inv_002', 'paid', 0, 'pending', 'pending', NULL),
  ('reg_003', 'batch_data_bootcamp_aug', 'user_part_03', 'Bima Satria', 'bima.satria@example.com', 'org_stn', 'PT Solusi Transformasi Nusantara', 'prog_data_bootcamp', 'Data Analytics Bootcamp', 'Data Bootcamp - August 2026', 'confirmed', 'confirmed', 'not_started', 'inv_002', 'paid', 0, 'pending', 'pending', NULL),
  ('reg_004', 'batch_cloud_may', 'user_part_06', 'Cindy Wijaya', 'cindy.wijaya@example.com', 'org_bni', 'Bank Negara Indonesia', 'prog_cloud_arch', 'Cloud Architecture Fundamentals', 'Cloud Architecture - May 2026', 'confirmed', 'confirmed', 'completed', 'inv_003', 'paid', 100, 'completed', 'completed', 'cert_001'),
  ('reg_005', 'batch_cloud_may', 'user_part_07', 'Dimas Pratama', 'dimas.pratama@example.com', 'org_bni', 'Bank Negara Indonesia', 'prog_cloud_arch', 'Cloud Architecture Fundamentals', 'Cloud Architecture - May 2026', 'confirmed', 'confirmed', 'completed', 'inv_003', 'paid', 90, 'completed', 'completed', 'cert_002')
ON CONFLICT (id) DO UPDATE SET batch_id=EXCLUDED.batch_id;

-- 8. Payments
INSERT INTO payments (id, invoice_id, invoice_number, registration_id, participant_name, program_name, organization_name, amount, status, invoice_status, payment_method, payment_date) VALUES
  ('pay_001', 'inv_001', 'INV-2026-0001', 'reg_001', 'Aulia Ramadhan', 'Applied AI for Business Teams', NULL, 3500000, 'paid', 'paid', 'bank_transfer', '2026-07-02'),
  ('pay_002', 'inv_002', 'INV-2026-0002', 'reg_002', 'Dina Kusuma', 'Data Analytics Bootcamp', 'PT Solusi Transformasi Nusantara', 10400000, 'paid', 'paid', 'bank_transfer', '2026-08-01'),
  ('pay_003', 'inv_003', 'INV-2026-0003', 'reg_004', 'Cindy Wijaya', 'Cloud Architecture Fundamentals', 'Bank Negara Indonesia', 9000000, 'paid', 'paid', 'bank_transfer', '2026-05-02')
ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status;

-- 9. Certificates
INSERT INTO certificates (id, registration_id, certificate_number, participant_email, participant_name, program_name, program_code, batch_name, trainer_name, completion_date, verification_status, score) VALUES
  ('cert_001', 'reg_004', 'VTK-2026-CAF-000001', 'cindy.wijaya@example.com', 'Cindy Wijaya', 'Cloud Architecture Fundamentals', 'CAF-201', 'Cloud Architecture - May 2026', 'Budi Santoso', '2026-05-20', 'valid', 92),
  ('cert_002', 'reg_005', 'VTK-2026-CAF-000002', 'dimas.pratama@example.com', 'Dimas Pratama', 'Cloud Architecture Fundamentals', 'CAF-201', 'Cloud Architecture - May 2026', 'Budi Santoso', '2026-05-20', 'valid', 85)
ON CONFLICT (id) DO UPDATE SET certificate_number=EXCLUDED.certificate_number;

-- 10. Attendance Sessions
INSERT INTO attendance_sessions (id, batch_id, session_title, session_date, start_time, end_time) VALUES
  ('att_session_ai_1', 'batch_ai_foundation_july', 'AI Use Cases for Business', '2026-07-08', '09:00', '12:00'),
  ('att_session_cloud_1', 'batch_cloud_may', 'Cloud Foundations', '2026-05-01', '09:00', '12:00'),
  ('att_session_cloud_2', 'batch_cloud_may', 'Architecture Patterns', '2026-05-10', '09:00', '12:00')
ON CONFLICT (id) DO UPDATE SET session_title=EXCLUDED.session_title;

-- 11. Attendance Records
INSERT INTO attendance_records (id, attendance_session_id, registration_id, batch_id, participant_name, participant_email, session_title, session_date, status, join_time, leave_time) VALUES
  ('att_record_001', 'att_session_ai_1', 'reg_001', 'batch_ai_foundation_july', 'Aulia Ramadhan', 'aulia.ramadhan@example.com', 'AI Use Cases for Business', '2026-07-08', 'present', '09:01', '11:58'),
  ('att_record_002', 'att_session_cloud_1', 'reg_004', 'batch_cloud_may', 'Cindy Wijaya', 'cindy.wijaya@example.com', 'Cloud Foundations', '2026-05-01', 'present', '09:00', '12:00'),
  ('att_record_003', 'att_session_cloud_1', 'reg_005', 'batch_cloud_may', 'Dimas Pratama', 'dimas.pratama@example.com', 'Cloud Foundations', '2026-05-01', 'present', '09:05', '12:00')
ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status;

-- 12. Assessments
INSERT INTO assessments (id, batch_id, program_id, assessment_type, title, description, passing_score, status) VALUES
  ('assess_pre_ai', 'batch_ai_foundation_july', 'prog_ai_foundation', 'pre_assessment', 'AI Readiness Baseline', 'Initial check', 70, 'published'),
  ('assess_post_cloud', 'batch_cloud_may', 'prog_cloud_arch', 'post_assessment', 'Cloud Arch Review', 'Final cloud check', 75, 'published')
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title;

-- 13. Assessment Questions
INSERT INTO assessment_questions (id, assessment_id, question_text, question_type, options, correct_answer, points) VALUES
  (
    'q1_pre_ai',
    'assess_pre_ai',
    'What is the primary benefit of the topics covered in this program?',
    'multiple_choice',
    '[{"id":"opt1","text":"Theoretical knowledge only"},{"id":"opt2","text":"Practical application and real-world workflow improvement"},{"id":"opt3","text":"Certification without learning"},{"id":"opt4","text":"Social networking only"}]'::jsonb,
    'opt2',
    20
  ),
  (
    'q2_pre_ai',
    'assess_pre_ai',
    'Which of the following best describes the core learning objective?',
    'multiple_choice',
    '[{"id":"opt1","text":"Random fact memorization"},{"id":"opt2","text":"Structured skill development and mastery"},{"id":"opt3","text":"Entertainment value only"},{"id":"opt4","text":"Corporate espionage techniques"}]'::jsonb,
    'opt2',
    20
  ),
  (
    'q3_pre_ai',
    'assess_pre_ai',
    'How would you apply what you learned to your role?',
    'multiple_choice',
    '[{"id":"opt1","text":"Ignore it completely"},{"id":"opt2","text":"Integrate into workflows and share with team"},{"id":"opt3","text":"Keep it secret"},{"id":"opt4","text":"Use only on Mondays"}]'::jsonb,
    'opt2',
    20
  ),
  (
    'q4_pre_ai',
    'assess_pre_ai',
    'What is the expected outcome of successful completion?',
    'multiple_choice',
    '[{"id":"opt1","text":"Nothing - just attendance"},{"id":"opt2","text":"Competency development and readiness to execute"},{"id":"opt3","text":"Certificate printing only"},{"id":"opt4","text":"Free refreshments only"}]'::jsonb,
    'opt2',
    20
  ),
  (
    'q5_pre_ai',
    'assess_pre_ai',
    'How would you measure success after this program?',
    'multiple_choice',
    '[{"id":"opt1","text":"By the certificate on the wall"},{"id":"opt2","text":"By tangible improvements in work processes"},{"id":"opt3","text":"By attendance only"},{"id":"opt4","text":"Success is not measurable"}]'::jsonb,
    'opt2',
    20
  ),
  (
    'q1_post_cloud',
    'assess_post_cloud',
    'What is the main benefit of a well-designed cloud architecture?',
    'multiple_choice',
    '[{"id":"opt1","text":"Higher manual workload"},{"id":"opt2","text":"Better scalability, reliability, and cost control"},{"id":"opt3","text":"No need for security controls"},{"id":"opt4","text":"Only prettier diagrams"}]'::jsonb,
    'opt2',
    100
  )
ON CONFLICT (id) DO UPDATE
  SET question_text=EXCLUDED.question_text,
      options=EXCLUDED.options,
      correct_answer=EXCLUDED.correct_answer,
      points=EXCLUDED.points;

-- 14. Assessment Submissions
INSERT INTO assessment_submissions (id, assessment_id, registration_id, participant_email, title, score, total_points, percentage, passed, status, answers) VALUES
  ('ares_001', 'assess_pre_ai', 'reg_001', 'aulia.ramadhan@example.com', 'AI Readiness Baseline', 32, 50, 64, FALSE, 'reviewed', '[]'::jsonb),
  ('ares_002', 'assess_post_cloud', 'reg_004', 'cindy.wijaya@example.com', 'Cloud Arch Review', 46, 50, 92, TRUE, 'reviewed', '[]'::jsonb),
  ('ares_003', 'assess_post_cloud', 'reg_005', 'dimas.pratama@example.com', 'Cloud Arch Review', 42, 50, 84, TRUE, 'reviewed', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET score=EXCLUDED.score;

-- 15. Feedback
INSERT INTO feedback (id, registration_id, batch_id, batch_name, participant_name, participant_email, program_name, trainer_name, trainer_rating, material_rating, program_rating, satisfaction_score, comments) VALUES
    ('fb_001', 'reg_001', 'batch_ai_foundation_july', 'Applied AI for Business Teams - July 2026', 'Aulia Ramadhan', 'aulia.ramadhan@example.com', 'Applied AI for Business Teams', 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE', 5, 4, 5, 5, 'Very practical program. The automation workshop and governance session were especially useful.'),
    ('fb_002', 'reg_005', 'batch_ai_foundation_july', 'Applied AI for Business Teams - July 2026', 'Eka Putri', 'eka.putri@example.com', 'Applied AI for Business Teams', 'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE', 4, 5, 4, 4, 'Good balance between business examples and practical exercises for team adoption.')
ON CONFLICT (id) DO UPDATE SET comments=EXCLUDED.comments;
