-- ============================================================
-- 05_fix_rls_update.sql
-- Purpose: Fix role update issues, add auth trigger for new users,
--          fix role constraint, and refresh all RLS policies.
-- Run this AFTER 01_schema.sql, 02_policies.sql, 03_seed_auth.sql, 04_seed_data.sql
-- ============================================================

-- ============================================================
-- STEP 1: Fix users_profile role constraint (tambahkan 'admin')
-- ============================================================
ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS users_profile_role_check;

ALTER TABLE users_profile
  ADD CONSTRAINT users_profile_role_check
  CHECK (role IN ('super_admin', 'academy_admin', 'admin', 'trainer', 'participant', 'corporate_pic', 'user'))
  NOT VALID;

ALTER TABLE users_profile VALIDATE CONSTRAINT users_profile_role_check;


-- ============================================================
-- STEP 2: Trigger otomatis buat users_profile saat user baru daftar
--         via Supabase Auth (Register page)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, full_name, role, status, created_date)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user'),
    'active',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email    = EXCLUDED.email,
    updated_date = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- ============================================================
-- STEP 3: Fix current_trainer_id() — bug JOIN yang menyebabkan
--         trainer tidak bisa lihat data batch/attendance mereka
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_trainer_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tr.id
  FROM trainers tr
  WHERE
    lower(coalesce(tr.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR tr.id = auth.uid()::text
  LIMIT 1;
$$;


-- ============================================================
-- STEP 4: Fungsi admin_update_user_role (SECURITY DEFINER)
--         Digunakan oleh halaman /admin/users agar bypass RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_email text,
  new_role     text,
  new_status   text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role  text;
  target_user  users_profile%ROWTYPE;
  updated_user json;
BEGIN
  -- Validasi caller adalah admin
  SELECT up.role INTO caller_role
  FROM users_profile up
  WHERE lower(up.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  LIMIT 1;

  IF caller_role NOT IN ('admin', 'academy_admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: only admins can update user roles';
  END IF;

  -- Ambil data user target
  SELECT * INTO target_user
  FROM users_profile
  WHERE lower(email) = lower(target_email)
  LIMIT 1;

  IF target_user.id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in users_profile', target_email;
  END IF;

  -- Update users_profile
  UPDATE users_profile
  SET
    role         = new_role,
    status       = COALESCE(new_status, status),
    updated_date = NOW()
  WHERE lower(email) = lower(target_email)
  RETURNING to_json(users_profile.*) INTO updated_user;

  -- Sync tabel trainers
  IF new_role = 'trainer' THEN
    -- Upsert ke tabel trainers agar bisa dipilih di batch
    INSERT INTO trainers (id, full_name, email, status, created_date)
    VALUES (
      target_user.id,
      target_user.full_name,
      target_user.email,
      'active',
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name    = EXCLUDED.full_name,
      email        = EXCLUDED.email,
      status       = 'active',
      updated_date = NOW();

    -- Juga coba match by email jika id berbeda
    INSERT INTO trainers (id, full_name, email, status, created_date)
    SELECT
      target_user.id,
      target_user.full_name,
      target_user.email,
      'active',
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM trainers WHERE id = target_user.id
    )
    ON CONFLICT (email) DO UPDATE SET
      full_name    = EXCLUDED.full_name,
      status       = 'active',
      updated_date = NOW();

  ELSE
    -- Jika role bukan trainer lagi, nonaktifkan trainer record
    UPDATE trainers
    SET status = 'inactive', updated_date = NOW()
    WHERE lower(email) = lower(target_email)
       OR id = target_user.id;
  END IF;

  RETURN updated_user;
END;
$$;


-- ============================================================
-- STEP 4: Refresh semua RLS policies (idempotent)
-- ============================================================

-- Enable RLS on all tables (safe jika sudah aktif)
ALTER TABLE organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile          ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches                ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices               ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback               ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;

-- Drop & recreate semua flow_ policies
DO $cleanup$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'organizations','users_profile','trainers','programs','batches',
        'invoices','enrollments','payments','attendance_sessions',
        'attendance_records','assessments','assessment_questions',
        'assessment_submissions','feedback','certificates','notifications'
      )
      AND (policyname LIKE 'mvp_%' OR policyname LIKE 'flow_%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END
$cleanup$;

-- organizations
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

-- users_profile
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

-- trainers
CREATE POLICY "flow_public_select_trainers" ON trainers
  FOR SELECT TO anon, authenticated
  USING (status = 'active' OR (SELECT public.is_admin_role()));

CREATE POLICY "flow_admin_all_trainers" ON trainers
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

-- programs
CREATE POLICY "flow_public_select_programs" ON programs
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR (SELECT public.is_admin_role()));

CREATE POLICY "flow_scoped_select_programs" ON programs
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_admin_role())
    OR EXISTS (
      SELECT 1 FROM batches b
      WHERE b.program_id = programs.id
        AND (
          public.is_assigned_trainer_for_batch(b.id)
          OR EXISTS (
            SELECT 1 FROM enrollments e
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

-- batches
CREATE POLICY "flow_public_select_batches" ON batches
  FOR SELECT TO anon, authenticated
  USING (
    status IN ('open','closed','published')
    OR (SELECT public.is_admin_role())
    OR ((SELECT public.is_trainer_role()) AND public.is_assigned_trainer_for_batch(id))
  );

CREATE POLICY "flow_scoped_select_batches" ON batches
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_admin_role())
    OR public.is_assigned_trainer_for_batch(id)
    OR EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.batch_id = batches.id
        AND public.can_access_enrollment(e.id, e.participant_id, e.email, e.organization_id, e.batch_id)
    )
  );

CREATE POLICY "flow_admin_all_batches" ON batches
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

-- invoices
CREATE POLICY "flow_admin_all_invoices" ON invoices
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_scoped_select_invoices" ON invoices
  FOR SELECT TO authenticated
  USING (public.can_access_invoice(id, organization_id));

-- enrollments
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

-- payments
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

-- attendance_sessions
CREATE POLICY "flow_admin_all_attendance_sessions" ON attendance_sessions
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_manage_attendance_sessions" ON attendance_sessions
  FOR ALL TO authenticated
  USING ((SELECT public.is_trainer_role()) AND public.is_assigned_trainer_for_batch(batch_id))
  WITH CHECK ((SELECT public.is_trainer_role()) AND public.is_assigned_trainer_for_batch(batch_id));

CREATE POLICY "flow_participant_select_attendance_sessions" ON attendance_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.batch_id = attendance_sessions.batch_id
        AND public.is_own_enrollment(e.id)
    )
  );

-- attendance_records
CREATE POLICY "flow_admin_all_attendance_records" ON attendance_records
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_manage_attendance_records" ON attendance_records
  FOR ALL TO authenticated
  USING ((SELECT public.is_trainer_role()) AND public.is_assigned_trainer_for_batch(batch_id))
  WITH CHECK ((SELECT public.is_trainer_role()) AND public.is_assigned_trainer_for_batch(batch_id));

CREATE POLICY "flow_participant_select_attendance_records" ON attendance_records
  FOR SELECT TO authenticated
  USING (public.is_own_enrollment(registration_id));

-- assessments
CREATE POLICY "flow_admin_all_assessments" ON assessments
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_trainer_manage_assessments" ON assessments
  FOR ALL TO authenticated
  USING ((SELECT public.is_trainer_role()) AND public.is_assigned_trainer_for_batch(batch_id))
  WITH CHECK ((SELECT public.is_trainer_role()) AND public.is_assigned_trainer_for_batch(batch_id));

CREATE POLICY "flow_participant_select_assessments" ON assessments
  FOR SELECT TO authenticated
  USING (public.can_access_assessment(id, batch_id));

-- assessment_questions
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
      SELECT 1 FROM assessments a
      WHERE a.id = assessment_questions.assessment_id
        AND public.can_access_assessment(a.id, a.batch_id)
    )
  );

-- assessment_submissions
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
    OR lower(coalesce(participant_email,'')) = public.current_app_user_email()
  );

CREATE POLICY "flow_participant_insert_assessment_submissions" ON assessment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email,'')) = public.current_app_user_email()
  );

CREATE POLICY "flow_participant_update_assessment_submissions" ON assessment_submissions
  FOR UPDATE TO authenticated
  USING (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email,'')) = public.current_app_user_email()
  )
  WITH CHECK (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email,'')) = public.current_app_user_email()
  );

-- feedback
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
    OR lower(coalesce(participant_email,'')) = public.current_app_user_email()
  );

CREATE POLICY "flow_participant_insert_feedback" ON feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email,'')) = public.current_app_user_email()
  );

CREATE POLICY "flow_participant_update_feedback" ON feedback
  FOR UPDATE TO authenticated
  USING (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email,'')) = public.current_app_user_email()
  )
  WITH CHECK (
    public.is_own_enrollment(registration_id)
    OR lower(coalesce(participant_email,'')) = public.current_app_user_email()
  );

-- certificates
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

-- notifications
CREATE POLICY "flow_admin_all_notifications" ON notifications
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_role()))
  WITH CHECK ((SELECT public.is_admin_role()));

CREATE POLICY "flow_auth_own_notifications" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
