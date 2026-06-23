-- Purpose: Repair trainer auth/profile linkage and assessment review RLS access.
-- Used by: Supabase SQL Editor when trainer login works but assessment review save is blocked.
-- Main dependencies: auth.users, users_profile, enrollments, assessment_submissions, and role helper functions.
-- Public/main functions: None; applies profile sync and RLS policies for trainer review flows.
-- Important side effects: Adds review feedback storage, updates/creates the trainer users_profile row, and replaces trainer review policies.

ALTER TABLE assessment_submissions
  ADD COLUMN IF NOT EXISTS feedback TEXT;

INSERT INTO users_profile (
  id,
  email,
  full_name,
  role,
  phone,
  status,
  password,
  created_date,
  updated_date
)
SELECT
  au.id::text,
  au.email,
  'Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE',
  'trainer',
  '081300000001',
  'active',
  'trainer123',
  NOW(),
  NOW()
FROM auth.users au
WHERE lower(au.email) = 'trainer@vteki.local'
ON CONFLICT (email) DO UPDATE
SET
  id = EXCLUDED.id,
  full_name = EXCLUDED.full_name,
  role = 'trainer',
  phone = COALESCE(users_profile.phone, EXCLUDED.phone),
  status = 'active',
  password = EXCLUDED.password,
  updated_date = NOW();

DROP POLICY IF EXISTS "mvp_trainer_select_assessment_submissions" ON assessment_submissions;
CREATE POLICY "mvp_trainer_select_assessment_submissions" ON assessment_submissions
  FOR SELECT
  TO authenticated
  USING (public.is_trainer_role() OR public.is_admin_role());

DROP POLICY IF EXISTS "mvp_trainer_update_assessment_submissions" ON assessment_submissions;
CREATE POLICY "mvp_trainer_update_assessment_submissions" ON assessment_submissions
  FOR UPDATE
  TO authenticated
  USING (public.is_trainer_role() OR public.is_admin_role())
  WITH CHECK (public.is_trainer_role() OR public.is_admin_role());

DROP POLICY IF EXISTS "mvp_trainer_select_enrollments" ON enrollments;
CREATE POLICY "mvp_trainer_select_enrollments" ON enrollments
  FOR SELECT
  TO authenticated
  USING (public.is_trainer_role() OR public.is_admin_role());

DROP POLICY IF EXISTS "mvp_trainer_update_enrollments" ON enrollments;
CREATE POLICY "mvp_trainer_update_enrollments" ON enrollments
  FOR UPDATE
  TO authenticated
  USING (public.is_trainer_role() OR public.is_admin_role())
  WITH CHECK (public.is_trainer_role() OR public.is_admin_role());
