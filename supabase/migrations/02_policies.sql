-- Purpose: Refresh Supabase RLS policies so each app role can only access rows required by its UI flow.
-- Who uses it: Supabase SQL Editor operators after schema_fixed.sql and the older MVP policy files are applied.
-- Main dependencies: public tables from schema_fixed.sql, Supabase Auth JWT email/id, and app roles in vi_users_profile.
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
    FROM vi_users_profile up
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
  FROM vi_users_profile up
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
  FROM vi_trainers tr
  JOIN vi_users_profile up
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
    FROM vi_batches b
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
    FROM vi_enrollments e
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
    FROM vi_assessments a
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
    FROM vi_enrollments e
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
    FROM vi_enrollments e
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
      FROM vi_enrollments e
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
      FROM vi_invoices i
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
      FROM vi_enrollments e
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

CREATE INDEX IF NOT EXISTS idx_users_profile_role ON vi_users_profile (role);
CREATE INDEX IF NOT EXISTS idx_users_profile_email_lower ON vi_users_profile (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_profile_organization_id ON vi_users_profile (organization_id);
CREATE INDEX IF NOT EXISTS idx_trainers_email_lower ON vi_trainers (lower(email));
CREATE INDEX IF NOT EXISTS idx_trainers_full_name ON vi_trainers (full_name);
CREATE INDEX IF NOT EXISTS idx_batches_trainer_id ON vi_batches (trainer_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON vi_enrollments (participant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_email_lower ON vi_enrollments (lower(email));
CREATE INDEX IF NOT EXISTS idx_enrollments_organization_id ON vi_enrollments (organization_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_batch_id ON vi_enrollments (batch_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_invoice_id ON vi_enrollments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_registration_id ON vi_payments (registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON vi_payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_batch_id ON vi_attendance_sessions (batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_registration_id ON vi_attendance_records (registration_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_batch_id ON vi_attendance_records (batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON vi_attendance_records (attendance_session_id);
CREATE INDEX IF NOT EXISTS idx_assessments_batch_id ON vi_assessments (batch_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON vi_assessment_questions (assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_assessment_id ON vi_assessment_submissions (assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_registration_id ON vi_assessment_submissions (registration_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_email_lower ON vi_assessment_submissions (lower(participant_email));
CREATE INDEX IF NOT EXISTS idx_feedback_registration_id ON vi_feedback (registration_id);
CREATE INDEX IF NOT EXISTS idx_feedback_batch_id ON vi_feedback (batch_id);
CREATE INDEX IF NOT EXISTS idx_feedback_email_lower ON vi_feedback (lower(participant_email));
CREATE INDEX IF NOT EXISTS idx_certificates_registration_id ON vi_certificates (registration_id);
CREATE INDEX IF NOT EXISTS idx_certificates_email_lower ON vi_certificates (lower(participant_email));
CREATE INDEX IF NOT EXISTS idx_certificates_number ON vi_certificates (certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON vi_certificates (verification_status);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON vi_invoices (organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON vi_notifications (user_id);

ALTER TABLE vi_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vi_notifications ENABLE ROW LEVEL SECURITY;

DO $cleanup$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'vi_organizations',
        'vi_users_profile',
        'vi_trainers',
        'vi_programs',
        'vi_batches',
        'vi_invoices',
        'vi_enrollments',
        'vi_payments',
        'vi_attendance_sessions',
        'vi_attendance_records',
        'vi_assessments',
        'vi_assessment_questions',
        'vi_assessment_submissions',
        'vi_feedback',
        'vi_certificates',
        'vi_notifications'
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

CREATE POLICY "flow_admin_all_organizations" ON vi_organizations
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_corporate_select_own_organization" ON vi_organizations
  FOR SELECT TO authenticated
  USING (
    id = (SELECT public.current_app_user_organization_id())
    OR (SELECT public.is_admin_role())
  );

CREATE POLICY "flow_admin_select_all_users_profile" ON vi_users_profile
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin_role()));

CREATE POLICY "flow_auth_select_own_users_profile" ON vi_users_profile
  FOR SELECT TO authenticated
  USING (public.is_own_user_profile(id, email));

CREATE POLICY "flow_auth_insert_own_users_profile" ON vi_users_profile
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_admin_role())
    OR public.is_own_user_profile(id, email)
  );

CREATE POLICY "flow_auth_update_users_profile" ON vi_users_profile
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_admin_role())
    OR public.is_own_user_profile(id, email)
  )
  WITH CHECK (
    (SELECT public.is_admin_role())
    OR public.is_own_user_profile(id, email)
  );

CREATE POLICY "flow_admin_delete_users_profile" ON vi_users_profile
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin_role()));

CREATE POLICY "flow_public_select_trainers" ON vi_trainers
  FOR SELECT TO anon, authenticated
  USING (status = 'active' OR (SELECT public.is_admin_role()));

CREATE POLICY "flow_admin_all_trainers" ON vi_trainers
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_public_select_programs" ON vi_programs
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR (SELECT public.is_admin_role()));

CREATE POLICY "flow_scoped_select_programs" ON vi_programs
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_admin_role())
    OR EXISTS (
      SELECT 1
      FROM vi_batches b
      WHERE b.program_id = vi_programs.id
        AND (
          public.is_assigned_trainer_for_batch(b.id)
          OR EXISTS (
            SELECT 1
            FROM vi_enrollments e
            WHERE e.batch_id = b.id
              AND public.can_access_enrollment(e.id, e.participant_id, e.email, e.organization_id, e.batch_id)
          )
        )
    )
  );

CREATE POLICY "flow_admin_all_programs" ON vi_programs
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_public_select_batches" ON vi_batches
  FOR SELECT TO anon, authenticated
  USING (
    status IN ('open', 'closed', 'published')
    OR (SELECT public.is_admin_role())
    OR (
      (SELECT public.is_trainer_role())
      AND public.is_assigned_trainer_for_batch(id)
    )
  );

CREATE POLICY "flow_scoped_select_batches" ON vi_batches
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_admin_role())
    OR public.is_assigned_trainer_for_batch(id)
    OR EXISTS (
      SELECT 1
      FROM vi_enrollments e
      WHERE e.batch_id = vi_batches.id
        AND public.can_access_enrollment(e.id, e.participant_id, e.email, e.organization_id, e.batch_id)
    )
  );

CREATE POLICY "flow_admin_all_batches" ON vi_batches
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_admin_all_invoices" ON vi_invoices
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_scoped_select_invoices" ON vi_invoices
  FOR SELECT TO authenticated
  USING (public.can_access_invoice(id, organization_id));

CREATE POLICY "flow_public_insert_enrollments" ON vi_enrollments
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "flow_admin_delete_enrollments" ON vi_enrollments
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin_role()));

CREATE POLICY "flow_scoped_select_enrollments" ON vi_enrollments
  FOR SELECT TO authenticated
  USING (public.can_access_enrollment(id, participant_id, email, organization_id, batch_id));

CREATE POLICY "flow_scoped_update_enrollments" ON vi_enrollments
  FOR UPDATE TO authenticated
  USING (public.can_access_enrollment(id, participant_id, email, organization_id, batch_id))
  WITH CHECK (public.can_access_enrollment(id, participant_id, email, organization_id, batch_id));

CREATE POLICY "flow_public_insert_payments" ON vi_payments
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "flow_admin_all_payments" ON vi_payments
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_scoped_select_payments" ON vi_payments
  FOR SELECT TO authenticated
  USING (public.can_access_payment(registration_id, invoice_id));

CREATE POLICY "flow_admin_all_attendance_sessions" ON vi_attendance_sessions
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_manage_attendance_sessions" ON vi_attendance_sessions
  FOR ALL TO authenticated
  USING (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  )
  WITH CHECK (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  );

CREATE POLICY "flow_participant_select_attendance_sessions" ON vi_attendance_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM vi_enrollments e
      WHERE e.batch_id = vi_attendance_sessions.batch_id
        AND public.is_own_enrollment(e.id)
    )
  );

CREATE POLICY "flow_admin_all_attendance_records" ON vi_attendance_records
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_manage_attendance_records" ON vi_attendance_records
  FOR ALL TO authenticated
  USING (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  )
  WITH CHECK (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  );

CREATE POLICY "flow_participant_select_attendance_records" ON vi_attendance_records
  FOR SELECT TO authenticated
  USING (public.is_own_enrollment(registration_id));

CREATE POLICY "flow_admin_all_assessments" ON vi_assessments
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_manage_assessments" ON vi_assessments
  FOR ALL TO authenticated
  USING (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  )
  WITH CHECK (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  );

CREATE POLICY "flow_participant_select_assessments" ON vi_assessments
  FOR SELECT TO authenticated
  USING (public.can_access_assessment(id, batch_id));

CREATE POLICY "flow_admin_all_assessment_questions" ON vi_assessment_questions
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_manage_assessment_questions" ON vi_assessment_questions
  FOR ALL TO authenticated
  USING (public.is_assigned_trainer_for_assessment(assessment_id))
  WITH CHECK (public.is_assigned_trainer_for_assessment(assessment_id));

CREATE POLICY "flow_participant_select_assessment_questions" ON vi_assessment_questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM vi_assessments a
      WHERE a.id = vi_assessment_questions.assessment_id
        AND public.can_access_assessment(a.id, a.batch_id)
    )
  );

CREATE POLICY "flow_admin_all_assessment_submissions" ON vi_assessment_submissions
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_select_update_assessment_submissions" ON vi_assessment_submissions
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_assessment(assessment_id)
  );

CREATE POLICY "flow_trainer_update_assessment_submissions" ON vi_assessment_submissions
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_assessment(assessment_id)
  )
  WITH CHECK (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_assessment(assessment_id)
  );

CREATE POLICY "flow_participant_select_assessment_submissions" ON vi_assessment_submissions
  FOR SELECT TO authenticated
  USING (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  );

CREATE POLICY "flow_participant_insert_assessment_submissions" ON vi_assessment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  );

CREATE POLICY "flow_participant_update_assessment_submissions" ON vi_assessment_submissions
  FOR UPDATE TO authenticated
  USING (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  )
  WITH CHECK (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  );

CREATE POLICY "flow_admin_all_feedback" ON vi_feedback
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_select_feedback" ON vi_feedback
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_trainer_role())
    AND public.is_assigned_trainer_for_batch(batch_id)
  );

CREATE POLICY "flow_participant_select_feedback" ON vi_feedback
  FOR SELECT TO authenticated
  USING (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  );

CREATE POLICY "flow_participant_insert_feedback" ON vi_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  );

CREATE POLICY "flow_participant_update_feedback" ON vi_feedback
  FOR UPDATE TO authenticated
  USING (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  )
  WITH CHECK (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email, '')) = public.current_app_user_email()
  );

CREATE POLICY "flow_admin_all_certificates" ON vi_certificates
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_public_verify_certificates" ON vi_certificates
  FOR SELECT TO anon, authenticated
  USING (verification_status = 'valid');

CREATE POLICY "flow_participant_select_update_certificates" ON vi_certificates
  FOR UPDATE TO authenticated
  USING (public.can_access_certificate(registration_id, participant_email))
  WITH CHECK (public.can_access_certificate(registration_id, participant_email));

CREATE POLICY "flow_participant_select_certificates" ON vi_certificates
  FOR SELECT TO authenticated
  USING (public.can_access_certificate(registration_id, participant_email));

CREATE POLICY "flow_admin_all_notifications" ON vi_notifications
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_auth_own_notifications" ON vi_notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
