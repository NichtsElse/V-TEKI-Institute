-- Purpose: Enable MVP demo reads plus explicit role-based CRUD policies for frontend Supabase clients.
-- Who uses it: Supabase SQL Editor operators during local/demo setup and RLS refreshes.
-- Main dependencies: Existing V-TEKI tables from schema_fixed.sql and Supabase RLS.
-- Public/main functions: Demo read policies, authenticated users_profile self-write policies, and explicit admin/trainer CRUD policies.
-- Important side effects: Enables RLS, recreates role policies, and allows authenticated users to insert/update only their own profile.

CREATE OR REPLACE FUNCTION public.has_app_role(target_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users_profile up
    WHERE (up.id = auth.uid()::text OR lower(up.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
      AND up.role = ANY(target_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_app_role(ARRAY['admin', 'academy_admin', 'super_admin']);
$$;

CREATE OR REPLACE FUNCTION public.is_trainer_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_app_role(ARRAY['trainer']);
$$;

CREATE OR REPLACE FUNCTION public.is_corporate_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_app_role(ARRAY['corporate_pic']);
$$;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mvp_demo_read_organizations" ON organizations;
CREATE POLICY "mvp_demo_read_organizations" ON organizations
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_users_profile" ON users_profile;
CREATE POLICY "mvp_demo_read_users_profile" ON users_profile
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_trainers" ON trainers;
CREATE POLICY "mvp_demo_read_trainers" ON trainers
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_programs" ON programs;
CREATE POLICY "mvp_demo_read_programs" ON programs
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_batches" ON batches;
CREATE POLICY "mvp_demo_read_batches" ON batches
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_invoices" ON invoices;
CREATE POLICY "mvp_demo_read_invoices" ON invoices
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_enrollments" ON enrollments;
CREATE POLICY "mvp_demo_read_enrollments" ON enrollments
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_payments" ON payments;
CREATE POLICY "mvp_demo_read_payments" ON payments
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_attendance_sessions" ON attendance_sessions;
CREATE POLICY "mvp_demo_read_attendance_sessions" ON attendance_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_attendance_records" ON attendance_records;
CREATE POLICY "mvp_demo_read_attendance_records" ON attendance_records
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_assessments" ON assessments;
CREATE POLICY "mvp_demo_read_assessments" ON assessments
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_assessment_questions" ON assessment_questions;
CREATE POLICY "mvp_demo_read_assessment_questions" ON assessment_questions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_assessment_submissions" ON assessment_submissions;
CREATE POLICY "mvp_demo_read_assessment_submissions" ON assessment_submissions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_feedback" ON feedback;
CREATE POLICY "mvp_demo_read_feedback" ON feedback
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_demo_read_certificates" ON certificates;
CREATE POLICY "mvp_demo_read_certificates" ON certificates
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_auth_insert_own_users_profile" ON users_profile;
CREATE POLICY "mvp_auth_insert_own_users_profile" ON users_profile
  FOR INSERT
  WITH CHECK (
    id = auth.uid()::text
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "mvp_auth_update_own_users_profile" ON users_profile;
CREATE POLICY "mvp_auth_update_own_users_profile" ON users_profile
  FOR UPDATE
  USING (
    id = auth.uid()::text
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    id = auth.uid()::text
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

DO $cleanup$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'organizations',
        'trainers',
        'programs',
        'batches',
        'invoices',
        'enrollments',
        'payments',
        'attendance_sessions',
        'attendance_records',
        'assessments',
        'assessment_questions',
        'assessment_submissions',
        'feedback',
        'certificates'
      )
      AND policyname NOT LIKE 'mvp_demo_read_%'
      AND policyname NOT LIKE 'mvp_auth_%'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  END LOOP;
END
$cleanup$;

DROP POLICY IF EXISTS "mvp_admin_all_organizations" ON organizations;
DROP POLICY IF EXISTS "mvp_admin_select_organizations" ON organizations;
DROP POLICY IF EXISTS "mvp_admin_insert_organizations" ON organizations;
DROP POLICY IF EXISTS "mvp_admin_update_organizations" ON organizations;
DROP POLICY IF EXISTS "mvp_admin_delete_organizations" ON organizations;
CREATE POLICY "mvp_admin_select_organizations" ON organizations
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_organizations" ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_organizations" ON organizations
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_organizations" ON organizations
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_all_trainers" ON trainers;
DROP POLICY IF EXISTS "mvp_admin_select_trainers" ON trainers;
DROP POLICY IF EXISTS "mvp_admin_insert_trainers" ON trainers;
DROP POLICY IF EXISTS "mvp_admin_update_trainers" ON trainers;
DROP POLICY IF EXISTS "mvp_admin_delete_trainers" ON trainers;
CREATE POLICY "mvp_admin_select_trainers" ON trainers
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_trainers" ON trainers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_trainers" ON trainers
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_trainers" ON trainers
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_all_programs" ON programs;
DROP POLICY IF EXISTS "mvp_admin_select_programs" ON programs;
DROP POLICY IF EXISTS "mvp_admin_insert_programs" ON programs;
DROP POLICY IF EXISTS "mvp_admin_update_programs" ON programs;
DROP POLICY IF EXISTS "mvp_admin_delete_programs" ON programs;
CREATE POLICY "mvp_admin_select_programs" ON programs
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_programs" ON programs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_programs" ON programs
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_programs" ON programs
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_all_batches" ON batches;
DROP POLICY IF EXISTS "mvp_admin_select_batches" ON batches;
DROP POLICY IF EXISTS "mvp_admin_insert_batches" ON batches;
DROP POLICY IF EXISTS "mvp_admin_update_batches" ON batches;
DROP POLICY IF EXISTS "mvp_admin_delete_batches" ON batches;
CREATE POLICY "mvp_admin_select_batches" ON batches
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_batches" ON batches
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_batches" ON batches
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_batches" ON batches
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_all_invoices" ON invoices;
DROP POLICY IF EXISTS "mvp_admin_select_invoices" ON invoices;
DROP POLICY IF EXISTS "mvp_admin_insert_invoices" ON invoices;
DROP POLICY IF EXISTS "mvp_admin_update_invoices" ON invoices;
DROP POLICY IF EXISTS "mvp_admin_delete_invoices" ON invoices;
CREATE POLICY "mvp_admin_select_invoices" ON invoices
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_invoices" ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_invoices" ON invoices
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_invoices" ON invoices
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_all_enrollments" ON enrollments;
DROP POLICY IF EXISTS "mvp_admin_select_enrollments" ON enrollments;
DROP POLICY IF EXISTS "mvp_admin_insert_enrollments" ON enrollments;
DROP POLICY IF EXISTS "mvp_admin_update_enrollments" ON enrollments;
DROP POLICY IF EXISTS "mvp_admin_delete_enrollments" ON enrollments;
CREATE POLICY "mvp_admin_select_enrollments" ON enrollments
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_enrollments" ON enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_enrollments" ON enrollments
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_enrollments" ON enrollments
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_public_insert_enrollments" ON enrollments;
CREATE POLICY "mvp_public_insert_enrollments" ON enrollments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "mvp_participant_update_enrollments" ON enrollments;
CREATE POLICY "mvp_participant_update_enrollments" ON enrollments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "mvp_admin_all_payments" ON payments;
DROP POLICY IF EXISTS "mvp_admin_select_payments" ON payments;
DROP POLICY IF EXISTS "mvp_admin_insert_payments" ON payments;
DROP POLICY IF EXISTS "mvp_admin_update_payments" ON payments;
DROP POLICY IF EXISTS "mvp_admin_delete_payments" ON payments;
CREATE POLICY "mvp_admin_select_payments" ON payments
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_payments" ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_payments" ON payments
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_payments" ON payments
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_public_insert_payments" ON payments;
CREATE POLICY "mvp_public_insert_payments" ON payments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "mvp_admin_all_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_admin_select_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_admin_insert_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_admin_update_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_admin_delete_attendance_sessions" ON attendance_sessions;
CREATE POLICY "mvp_admin_select_attendance_sessions" ON attendance_sessions
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_attendance_sessions" ON attendance_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_attendance_sessions" ON attendance_sessions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_attendance_sessions" ON attendance_sessions
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_all_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_admin_select_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_admin_insert_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_admin_update_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_admin_delete_attendance_records" ON attendance_records;
CREATE POLICY "mvp_admin_select_attendance_records" ON attendance_records
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_attendance_records" ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_attendance_records" ON attendance_records
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_attendance_records" ON attendance_records
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_all_assessments" ON assessments;
DROP POLICY IF EXISTS "mvp_admin_select_assessments" ON assessments;
DROP POLICY IF EXISTS "mvp_admin_insert_assessments" ON assessments;
DROP POLICY IF EXISTS "mvp_admin_update_assessments" ON assessments;
DROP POLICY IF EXISTS "mvp_admin_delete_assessments" ON assessments;
CREATE POLICY "mvp_admin_select_assessments" ON assessments
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_assessments" ON assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_assessments" ON assessments
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_assessments" ON assessments
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_all_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_admin_select_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_admin_insert_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_admin_update_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_admin_delete_assessment_questions" ON assessment_questions;
CREATE POLICY "mvp_admin_select_assessment_questions" ON assessment_questions
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_assessment_questions" ON assessment_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_assessment_questions" ON assessment_questions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_assessment_questions" ON assessment_questions
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_all_assessment_submissions" ON assessment_submissions;
DROP POLICY IF EXISTS "mvp_admin_select_assessment_submissions" ON assessment_submissions;
DROP POLICY IF EXISTS "mvp_admin_insert_assessment_submissions" ON assessment_submissions;
DROP POLICY IF EXISTS "mvp_admin_update_assessment_submissions" ON assessment_submissions;
DROP POLICY IF EXISTS "mvp_admin_delete_assessment_submissions" ON assessment_submissions;
CREATE POLICY "mvp_admin_select_assessment_submissions" ON assessment_submissions
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_assessment_submissions" ON assessment_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_assessment_submissions" ON assessment_submissions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_assessment_submissions" ON assessment_submissions
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_participant_insert_assessment_submissions" ON assessment_submissions;
CREATE POLICY "mvp_participant_insert_assessment_submissions" ON assessment_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "mvp_participant_select_assessment_submissions" ON assessment_submissions;
CREATE POLICY "mvp_participant_select_assessment_submissions" ON assessment_submissions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_participant_update_assessment_submissions" ON assessment_submissions;
CREATE POLICY "mvp_participant_update_assessment_submissions" ON assessment_submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "mvp_admin_all_feedback" ON feedback;
DROP POLICY IF EXISTS "mvp_admin_select_feedback" ON feedback;
DROP POLICY IF EXISTS "mvp_admin_insert_feedback" ON feedback;
DROP POLICY IF EXISTS "mvp_admin_update_feedback" ON feedback;
DROP POLICY IF EXISTS "mvp_admin_delete_feedback" ON feedback;
CREATE POLICY "mvp_admin_select_feedback" ON feedback
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_feedback" ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_feedback" ON feedback
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_feedback" ON feedback
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_participant_select_feedback" ON feedback;
CREATE POLICY "mvp_participant_select_feedback" ON feedback
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "mvp_participant_insert_feedback" ON feedback;
CREATE POLICY "mvp_participant_insert_feedback" ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "mvp_admin_all_certificates" ON certificates;
DROP POLICY IF EXISTS "mvp_admin_select_certificates" ON certificates;
DROP POLICY IF EXISTS "mvp_admin_insert_certificates" ON certificates;
DROP POLICY IF EXISTS "mvp_admin_update_certificates" ON certificates;
DROP POLICY IF EXISTS "mvp_admin_delete_certificates" ON certificates;
CREATE POLICY "mvp_admin_select_certificates" ON certificates
  FOR SELECT
  TO authenticated
  USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_certificates" ON certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_certificates" ON certificates
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_certificates" ON certificates
  FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_auth_manage_certificates" ON certificates;
CREATE POLICY "mvp_auth_manage_certificates" ON certificates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "mvp_trainer_all_batches" ON batches;
DROP POLICY IF EXISTS "mvp_trainer_select_batches" ON batches;
DROP POLICY IF EXISTS "mvp_trainer_insert_batches" ON batches;
DROP POLICY IF EXISTS "mvp_trainer_update_batches" ON batches;
DROP POLICY IF EXISTS "mvp_trainer_delete_batches" ON batches;
CREATE POLICY "mvp_trainer_select_batches" ON batches
  FOR SELECT
  TO authenticated
  USING (public.is_trainer_role());
CREATE POLICY "mvp_trainer_insert_batches" ON batches
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_update_batches" ON batches
  FOR UPDATE
  TO authenticated
  USING (public.is_trainer_role())
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_delete_batches" ON batches
  FOR DELETE
  TO authenticated
  USING (public.is_trainer_role());

DROP POLICY IF EXISTS "mvp_trainer_all_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_trainer_select_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_trainer_insert_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_trainer_update_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_trainer_delete_attendance_sessions" ON attendance_sessions;
CREATE POLICY "mvp_trainer_select_attendance_sessions" ON attendance_sessions
  FOR SELECT
  TO authenticated
  USING (public.is_trainer_role());
CREATE POLICY "mvp_trainer_insert_attendance_sessions" ON attendance_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_update_attendance_sessions" ON attendance_sessions
  FOR UPDATE
  TO authenticated
  USING (public.is_trainer_role())
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_delete_attendance_sessions" ON attendance_sessions
  FOR DELETE
  TO authenticated
  USING (public.is_trainer_role());

DROP POLICY IF EXISTS "mvp_trainer_all_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_trainer_select_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_trainer_insert_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_trainer_update_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_trainer_delete_attendance_records" ON attendance_records;
CREATE POLICY "mvp_trainer_select_attendance_records" ON attendance_records
  FOR SELECT
  TO authenticated
  USING (public.is_trainer_role());
CREATE POLICY "mvp_trainer_insert_attendance_records" ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_update_attendance_records" ON attendance_records
  FOR UPDATE
  TO authenticated
  USING (public.is_trainer_role())
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_delete_attendance_records" ON attendance_records
  FOR DELETE
  TO authenticated
  USING (public.is_trainer_role());

DROP POLICY IF EXISTS "mvp_trainer_all_assessments" ON assessments;
DROP POLICY IF EXISTS "mvp_trainer_select_assessments" ON assessments;
DROP POLICY IF EXISTS "mvp_trainer_insert_assessments" ON assessments;
DROP POLICY IF EXISTS "mvp_trainer_update_assessments" ON assessments;
DROP POLICY IF EXISTS "mvp_trainer_delete_assessments" ON assessments;
CREATE POLICY "mvp_trainer_select_assessments" ON assessments
  FOR SELECT
  TO authenticated
  USING (public.is_trainer_role());
CREATE POLICY "mvp_trainer_insert_assessments" ON assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_update_assessments" ON assessments
  FOR UPDATE
  TO authenticated
  USING (public.is_trainer_role())
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_delete_assessments" ON assessments
  FOR DELETE
  TO authenticated
  USING (public.is_trainer_role());

DROP POLICY IF EXISTS "mvp_trainer_all_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_trainer_select_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_trainer_insert_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_trainer_update_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_trainer_delete_assessment_questions" ON assessment_questions;
CREATE POLICY "mvp_trainer_select_assessment_questions" ON assessment_questions
  FOR SELECT
  TO authenticated
  USING (public.is_trainer_role());
CREATE POLICY "mvp_trainer_insert_assessment_questions" ON assessment_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_update_assessment_questions" ON assessment_questions
  FOR UPDATE
  TO authenticated
  USING (public.is_trainer_role())
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_delete_assessment_questions" ON assessment_questions
  FOR DELETE
  TO authenticated
  USING (public.is_trainer_role());

DROP POLICY IF EXISTS "mvp_trainer_all_assessment_submissions" ON assessment_submissions;
DROP POLICY IF EXISTS "mvp_trainer_select_assessment_submissions" ON assessment_submissions;
DROP POLICY IF EXISTS "mvp_trainer_insert_assessment_submissions" ON assessment_submissions;
DROP POLICY IF EXISTS "mvp_trainer_update_assessment_submissions" ON assessment_submissions;
DROP POLICY IF EXISTS "mvp_trainer_delete_assessment_submissions" ON assessment_submissions;
CREATE POLICY "mvp_trainer_select_assessment_submissions" ON assessment_submissions
  FOR SELECT
  TO authenticated
  USING (public.is_trainer_role());
CREATE POLICY "mvp_trainer_insert_assessment_submissions" ON assessment_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_update_assessment_submissions" ON assessment_submissions
  FOR UPDATE
  TO authenticated
  USING (public.is_trainer_role())
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_delete_assessment_submissions" ON assessment_submissions
  FOR DELETE
  TO authenticated
  USING (public.is_trainer_role());

DROP POLICY IF EXISTS "mvp_trainer_all_feedback" ON feedback;
DROP POLICY IF EXISTS "mvp_trainer_select_feedback" ON feedback;
DROP POLICY IF EXISTS "mvp_trainer_insert_feedback" ON feedback;
DROP POLICY IF EXISTS "mvp_trainer_update_feedback" ON feedback;
DROP POLICY IF EXISTS "mvp_trainer_delete_feedback" ON feedback;
CREATE POLICY "mvp_trainer_select_feedback" ON feedback
  FOR SELECT
  TO authenticated
  USING (public.is_trainer_role());
CREATE POLICY "mvp_trainer_insert_feedback" ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_update_feedback" ON feedback
  FOR UPDATE
  TO authenticated
  USING (public.is_trainer_role())
  WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_delete_feedback" ON feedback
  FOR DELETE
  TO authenticated
  USING (public.is_trainer_role());

DROP POLICY IF EXISTS "mvp_corporate_read_invoices" ON invoices;
CREATE POLICY "mvp_corporate_read_invoices" ON invoices
  FOR SELECT
  TO authenticated
  USING (public.is_corporate_role() OR public.is_admin_role());

DROP POLICY IF EXISTS "mvp_corporate_read_enrollments" ON enrollments;
CREATE POLICY "mvp_corporate_read_enrollments" ON enrollments
  FOR SELECT
  TO authenticated
  USING (public.is_corporate_role() OR public.is_admin_role());
