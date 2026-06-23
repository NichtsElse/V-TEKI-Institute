-- Purpose: Refresh Supabase RLS policies so each app role can only access rows required by its UI flow.
-- Who uses it: Supabase SQL Editor operators after schema_fixed.sql and the older MVP policy files are applied.
-- Main dependencies: public tables from schema_fixed.sql, Supabase Auth JWT email/id, and app roles in users_profile.
-- Public/main functions: Role helper functions, row-scope helper functions, policy recreation, and supporting indexes.
-- Important side effects: Enables RLS, drops previous mvp_/flow_ policies on app tables, and recreates role-scoped access.

CREATE OR REPLACE FUNCTION public.current_app_user_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

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
    WHERE (
        up.id = auth.uid()::text
        OR lower(up.email) = public.current_app_user_email()
      )
      AND up.status = 'active'
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

CREATE OR REPLACE FUNCTION public.is_participant_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_app_role(ARRAY['participant', 'user', 'corporate_pic']);
$$;

CREATE OR REPLACE FUNCTION public.is_own_user_profile(profile_id text, profile_email text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT profile_id = auth.uid()::text
    OR lower(coalesce(profile_email, '')) = public.current_app_user_email();
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_organization_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.organization_id
  FROM users_profile up
  WHERE up.id = auth.uid()::text
    OR lower(up.email) = public.current_app_user_email()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_trainer_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tr.id
  FROM trainers tr
  JOIN users_profile up
    ON up.id = auth.uid()::text
    OR lower(up.email) = public.current_app_user_email()
  WHERE tr.id = up.id
    OR lower(coalesce(tr.email, '')) = lower(up.email)
    OR tr.full_name = up.full_name
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_trainer_for_batch(target_batch_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM batches b
    WHERE b.id = target_batch_id
      AND b.trainer_id = public.current_trainer_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_trainer_for_registration(target_registration_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM enrollments e
    WHERE e.id = target_registration_id
      AND public.is_assigned_trainer_for_batch(e.batch_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_trainer_for_assessment(target_assessment_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM assessments a
    WHERE a.id = target_assessment_id
      AND public.is_assigned_trainer_for_batch(a.batch_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_own_enrollment(target_registration_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM enrollments e
    WHERE e.id = target_registration_id
      AND (
        e.participant_id = auth.uid()::text
        OR lower(e.email) = public.current_app_user_email()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_corporate_enrollment(target_registration_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM enrollments e
    WHERE e.id = target_registration_id
      AND e.organization_id = public.current_app_user_organization_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_enrollment(
  target_registration_id text,
  target_participant_id text,
  target_email text,
  target_organization_id text,
  target_batch_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_role()
    OR target_participant_id = auth.uid()::text
    OR lower(coalesce(target_email, '')) = public.current_app_user_email()
    OR (
      public.is_corporate_role()
      AND target_organization_id = public.current_app_user_organization_id()
    )
    OR (
      public.is_trainer_role()
      AND public.is_assigned_trainer_for_batch(target_batch_id)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_invoice(target_invoice_id text, target_organization_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_role()
    OR (
      public.is_corporate_role()
      AND target_organization_id = public.current_app_user_organization_id()
    )
    OR EXISTS (
      SELECT 1
      FROM enrollments e
      WHERE e.invoice_id = target_invoice_id
        AND public.is_own_enrollment(e.id)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_payment(
  target_registration_id text,
  target_invoice_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_role()
    OR (
      target_registration_id IS NOT NULL
      AND (
        public.is_own_enrollment(target_registration_id)
        OR public.is_corporate_enrollment(target_registration_id)
      )
    )
    OR EXISTS (
      SELECT 1
      FROM invoices i
      WHERE i.id = target_invoice_id
        AND public.can_access_invoice(i.id, i.organization_id)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_assessment(target_assessment_id text, target_batch_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_role()
    OR (
      public.is_trainer_role()
      AND public.is_assigned_trainer_for_batch(target_batch_id)
    )
    OR EXISTS (
      SELECT 1
      FROM enrollments e
      WHERE e.batch_id = target_batch_id
        AND public.is_own_enrollment(e.id)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_certificate(target_registration_id text, target_participant_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_role()
    OR lower(coalesce(target_participant_email, '')) = public.current_app_user_email()
    OR public.is_own_enrollment(target_registration_id);
$$;

CREATE INDEX IF NOT EXISTS idx_users_profile_role ON users_profile (role);
CREATE INDEX IF NOT EXISTS idx_users_profile_email_lower ON users_profile (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_profile_organization_id ON users_profile (organization_id);
CREATE INDEX IF NOT EXISTS idx_trainers_email_lower ON trainers (lower(email));
CREATE INDEX IF NOT EXISTS idx_trainers_full_name ON trainers (full_name);
CREATE INDEX IF NOT EXISTS idx_batches_trainer_id ON batches (trainer_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments (participant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_email_lower ON enrollments (lower(email));
CREATE INDEX IF NOT EXISTS idx_enrollments_organization_id ON enrollments (organization_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_batch_id ON enrollments (batch_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_invoice_id ON enrollments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_registration_id ON payments (registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_batch_id ON attendance_sessions (batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_registration_id ON attendance_records (registration_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_batch_id ON attendance_records (batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records (attendance_session_id);
CREATE INDEX IF NOT EXISTS idx_assessments_batch_id ON assessments (batch_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON assessment_questions (assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_assessment_id ON assessment_submissions (assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_registration_id ON assessment_submissions (registration_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_email_lower ON assessment_submissions (lower(participant_email));
CREATE INDEX IF NOT EXISTS idx_feedback_registration_id ON feedback (registration_id);
CREATE INDEX IF NOT EXISTS idx_feedback_batch_id ON feedback (batch_id);
CREATE INDEX IF NOT EXISTS idx_feedback_email_lower ON feedback (lower(participant_email));
CREATE INDEX IF NOT EXISTS idx_certificates_registration_id ON certificates (registration_id);
CREATE INDEX IF NOT EXISTS idx_certificates_email_lower ON certificates (lower(participant_email));
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates (certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates (verification_status);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices (organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);

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
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

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
        'users_profile',
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
        'certificates',
        'notifications'
      )
      AND (
        policyname LIKE 'mvp_%'
        OR policyname LIKE 'flow_%'
      )
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

CREATE POLICY "flow_admin_all_organizations" ON organizations
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_corporate_select_own_organization" ON organizations
  FOR SELECT TO authenticated
  USING (
    id = (SELECT public.current_app_user_organization_id())
    OR (SELECT public.is_admin_role())
  );

CREATE POLICY "flow_admin_select_all_users_profile" ON users_profile
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin_role()));

CREATE POLICY "flow_auth_select_own_users_profile" ON users_profile
  FOR SELECT TO authenticated
  USING (public.is_own_user_profile(id, email));

CREATE POLICY "flow_auth_insert_own_users_profile" ON users_profile
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_admin_role())
    OR public.is_own_user_profile(id, email)
  );

CREATE POLICY "flow_auth_update_users_profile" ON users_profile
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_admin_role())
    OR public.is_own_user_profile(id, email)
  )
  WITH CHECK (
    (SELECT public.is_admin_role())
    OR public.is_own_user_profile(id, email)
  );

CREATE POLICY "flow_admin_delete_users_profile" ON users_profile
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin_role()));

CREATE POLICY "flow_public_select_trainers" ON trainers
  FOR SELECT TO anon, authenticated
  USING (status = 'active' OR (SELECT public.is_admin_role()));

CREATE POLICY "flow_admin_all_trainers" ON trainers
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_public_select_programs" ON programs
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR (SELECT public.is_admin_role()));

CREATE POLICY "flow_scoped_select_programs" ON programs
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_admin_role())
    OR EXISTS (
      SELECT 1
      FROM batches b
      WHERE b.program_id = programs.id
        AND (
          public.is_assigned_trainer_for_batch(b.id)
          OR EXISTS (
            SELECT 1
            FROM enrollments e
            WHERE e.batch_id = b.id
              AND public.can_access_enrollment(e.id, e.participant_id, e.email, e.organization_id, e.batch_id)
          )
        )
    )
  );

CREATE POLICY "flow_admin_all_programs" ON programs
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_public_select_batches" ON batches
  FOR SELECT TO anon, authenticated
  USING (
    status IN ('open', 'closed', 'published')
    OR (SELECT public.is_admin_role())
    OR (
      (SELECT public.is_trainer_role())
      AND public.is_assigned_trainer_for_batch(id)
    )
  );

CREATE POLICY "flow_scoped_select_batches" ON batches
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_admin_role())
    OR public.is_assigned_trainer_for_batch(id)
    OR EXISTS (
      SELECT 1
      FROM enrollments e
      WHERE e.batch_id = batches.id
        AND public.can_access_enrollment(e.id, e.participant_id, e.email, e.organization_id, e.batch_id)
    )
  );

CREATE POLICY "flow_admin_all_batches" ON batches
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_admin_all_invoices" ON invoices
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_scoped_select_invoices" ON invoices
  FOR SELECT TO authenticated
  USING (public.can_access_invoice(id, organization_id));

CREATE POLICY "flow_public_insert_enrollments" ON enrollments
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "flow_admin_delete_enrollments" ON enrollments
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin_role()));

CREATE POLICY "flow_scoped_select_enrollments" ON enrollments
  FOR SELECT TO authenticated
  USING (public.can_access_enrollment(id, participant_id, email, organization_id, batch_id));

CREATE POLICY "flow_scoped_update_enrollments" ON enrollments
  FOR UPDATE TO authenticated
  USING (public.can_access_enrollment(id, participant_id, email, organization_id, batch_id))
  WITH CHECK (public.can_access_enrollment(id, participant_id, email, organization_id, batch_id));

CREATE POLICY "flow_public_insert_payments" ON payments
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "flow_admin_all_payments" ON payments
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_scoped_select_payments" ON payments
  FOR SELECT TO authenticated
  USING (public.can_access_payment(registration_id, invoice_id));

CREATE POLICY "flow_admin_all_attendance_sessions" ON attendance_sessions
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_manage_attendance_sessions" ON attendance_sessions
  FOR ALL TO authenticated
  USING (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  )
  WITH CHECK (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  );

CREATE POLICY "flow_participant_select_attendance_sessions" ON attendance_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM enrollments e
      WHERE e.batch_id = attendance_sessions.batch_id
        AND public.is_own_enrollment(e.id)
    )
  );

CREATE POLICY "flow_admin_all_attendance_records" ON attendance_records
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_manage_attendance_records" ON attendance_records
  FOR ALL TO authenticated
  USING (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  )
  WITH CHECK (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  );

CREATE POLICY "flow_participant_select_attendance_records" ON attendance_records
  FOR SELECT TO authenticated
  USING (public.is_own_enrollment(registration_id));

CREATE POLICY "flow_admin_all_assessments" ON assessments
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_manage_assessments" ON assessments
  FOR ALL TO authenticated
  USING (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  )
  WITH CHECK (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  );

CREATE POLICY "flow_participant_select_assessments" ON assessments
  FOR SELECT TO authenticated
  USING (public.can_access_assessment(id, batch_id));

CREATE POLICY "flow_admin_all_assessment_questions" ON assessment_questions
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_manage_assessment_questions" ON assessment_questions
  FOR ALL TO authenticated
  USING (public.is_assigned_trainer_for_assessment(assessment_id))
  WITH CHECK (public.is_assigned_trainer_for_assessment(assessment_id));

CREATE POLICY "flow_participant_select_assessment_questions" ON assessment_questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM assessments a
      WHERE a.id = assessment_questions.assessment_id
        AND public.can_access_assessment(a.id, a.batch_id)
    )
  );

CREATE POLICY "flow_admin_all_assessment_submissions" ON assessment_submissions
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_select_update_assessment_submissions" ON assessment_submissions
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_assessment(assessment_id)
  );

CREATE POLICY "flow_trainer_update_assessment_submissions" ON assessment_submissions
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_assessment(assessment_id)
  )
  WITH CHECK (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_assessment(assessment_id)
  );

CREATE POLICY "flow_participant_select_assessment_submissions" ON assessment_submissions
  FOR SELECT TO authenticated
  USING (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  );

CREATE POLICY "flow_participant_insert_assessment_submissions" ON assessment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  );

CREATE POLICY "flow_participant_update_assessment_submissions" ON assessment_submissions
  FOR UPDATE TO authenticated
  USING (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  )
  WITH CHECK (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  );

CREATE POLICY "flow_admin_all_feedback" ON feedback
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_select_feedback" ON feedback
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  );

CREATE POLICY "flow_participant_select_feedback" ON feedback
  FOR SELECT TO authenticated
  USING (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  );

CREATE POLICY "flow_participant_insert_feedback" ON feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  );

CREATE POLICY "flow_participant_update_feedback" ON feedback
  FOR UPDATE TO authenticated
  USING (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  )
  WITH CHECK (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  );

CREATE POLICY "flow_admin_all_certificates" ON certificates
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_public_verify_certificates" ON certificates
  FOR SELECT TO anon, authenticated
  USING (verification_status = 'valid');

CREATE POLICY "flow_participant_select_update_certificates" ON certificates
  FOR UPDATE TO authenticated
  USING (public.can_access_certificate(registration_id, participant_email))
  WITH CHECK (public.can_access_certificate(registration_id, participant_email));

CREATE POLICY "flow_participant_select_certificates" ON certificates
  FOR SELECT TO authenticated
  USING (public.can_access_certificate(registration_id, participant_email));

CREATE POLICY "flow_admin_all_notifications" ON notifications
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_auth_own_notifications" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
