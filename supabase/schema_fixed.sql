-- V-TEKI MVP Supabase schema (FIXED)
-- Changes from original:
--   [FIX Bug 1] assessment_submissions: tambah kolom `answers JSONB`
--   [FIX Bug 5] assessment_submissions: tambah kolom `feedback TEXT` untuk review trainer
--   [FIX Bug 4] enrollments: tambah kolom `program_id TEXT FK -> programs`

-- Core identity & organization entities

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  contact_email TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users_profile (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'academy_admin', 'trainer', 'participant', 'corporate_pic', 'user')),
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  organization_name TEXT,
  status TEXT DEFAULT 'active',
  password TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS trainers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  title TEXT,
  expertise TEXT,
  experience_years INTEGER,
  bio TEXT,
  profile_picture_url TEXT,
  linkedin_url TEXT,
  status TEXT DEFAULT 'active',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ
);

-- Learning catalog & delivery entities

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  learning_objectives TEXT,
  program_type TEXT,
  delivery_mode TEXT,
  duration_hours INTEGER,
  price NUMERIC(15,2),
  capacity INTEGER,
  status TEXT DEFAULT 'draft',
  thumbnail_url TEXT,
  category TEXT,
  level TEXT,
  passing_score INTEGER DEFAULT 70,
  min_attendance_pct INTEGER DEFAULT 80,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  program_name TEXT,
  name TEXT NOT NULL,
  trainer_id TEXT REFERENCES trainers(id) ON DELETE SET NULL,
  trainer_name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft',
  capacity INTEGER,
  enrolled_count INTEGER DEFAULT 0,
  venue TEXT,
  meeting_link TEXT,
  sessions JSONB DEFAULT '[]'::jsonb,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ
);

-- Enrollment & payment entities

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  organization_name TEXT,
  total_amount NUMERIC(15,2) NOT NULL,
  status TEXT DEFAULT 'issued',
  due_date DATE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  batch_name TEXT,
  program_name TEXT,
  -- [FIX Bug 4] kolom program_id ditambahkan; seed insert kolom ini tapi schema lama tidak punya
  program_id TEXT REFERENCES programs(id) ON DELETE SET NULL,
  participant_id TEXT REFERENCES users_profile(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  organization_name TEXT,
  registration_type TEXT DEFAULT 'individual',
  invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  enrollment_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'unpaid',
  completion_status TEXT DEFAULT 'not_started',
  attendance_percentage NUMERIC(5,2) DEFAULT 0,
  pre_assessment_status TEXT DEFAULT 'pending',
  pre_assessment_score INTEGER,
  post_assessment_status TEXT DEFAULT 'pending',
  post_assessment_score INTEGER,
  feedback_status TEXT DEFAULT 'pending',
  feedback_submitted BOOLEAN DEFAULT FALSE,
  certificate_id TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  invoice_number TEXT,
  registration_id TEXT REFERENCES enrollments(id) ON DELETE SET NULL,
  organization_name TEXT,
  participant_name TEXT,
  program_name TEXT,
  amount NUMERIC(15,2) NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  payment_proof_url TEXT,
  payment_date TIMESTAMPTZ,
  verified_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  invoice_status TEXT DEFAULT 'issued',
  notes TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ
);

-- Learning activity entities

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  session_title TEXT NOT NULL,
  session_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ,
  UNIQUE(batch_id, session_date, session_title)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  attendance_session_id TEXT NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  registration_id TEXT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  participant_name TEXT,
  participant_email TEXT,
  session_title TEXT,
  session_date DATE,
  status TEXT DEFAULT 'absent',
  join_time TEXT,
  leave_time TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ,
  UNIQUE(attendance_session_id, registration_id)
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  batch_id TEXT REFERENCES batches(id) ON DELETE CASCADE,
  program_id TEXT REFERENCES programs(id) ON DELETE SET NULL,
  assessment_type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  question_type TEXT,
  total_points INTEGER DEFAULT 100,
  passing_score INTEGER DEFAULT 70,
  duration_minutes INTEGER,
  status TEXT DEFAULT 'draft',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS assessment_submissions (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  registration_id TEXT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  participant_email TEXT,
  participant_name TEXT,
  title TEXT,
  score INTEGER NOT NULL,
  total_points INTEGER,
  percentage NUMERIC(5,2),
  passed BOOLEAN,
  status TEXT DEFAULT 'submitted',
  -- [FIX Bug 1] kolom answers ditambahkan; seed insert kolom ini tapi schema lama tidak punya
  answers JSONB DEFAULT '[]'::jsonb,
  -- [FIX Bug 5] feedback review trainer yang disimpan dari halaman Trainer Assessments
  feedback TEXT,
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ,
  UNIQUE(assessment_id, registration_id)
);

-- Feedback & certificates

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  batch_id TEXT REFERENCES batches(id) ON DELETE SET NULL,
  batch_name TEXT,
  participant_name TEXT,
  participant_email TEXT,
  program_name TEXT,
  trainer_name TEXT,
  trainer_rating INTEGER CHECK (trainer_rating >= 1 AND trainer_rating <= 5),
  material_rating INTEGER CHECK (material_rating >= 1 AND material_rating <= 5),
  program_rating INTEGER CHECK (program_rating >= 1 AND program_rating <= 5),
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  comments TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ,
  UNIQUE(registration_id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  participant_email TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  program_code TEXT,
  batch_name TEXT,
  trainer_name TEXT,
  completion_date DATE NOT NULL,
  score INTEGER,
  verification_status TEXT DEFAULT 'valid',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ,
  UNIQUE(registration_id)
);

CREATE TABLE IF NOT EXISTS assessment_questions (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  points INTEGER DEFAULT 10,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT DEFAULT 'in-app',
  status TEXT DEFAULT 'unread',
  created_date TIMESTAMPTZ DEFAULT NOW()
);
