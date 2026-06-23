-- Purpose: Patch remaining Supabase CRUD policies for admin and trainer flows.
-- Who uses it: Supabase SQL Editor operators after the base RLS file is applied.
-- Main dependencies: Existing public tables and the public.is_admin_role/public.is_trainer_role helpers.
-- Public/main functions: Explicit INSERT/UPDATE/DELETE policies for enrollments, payments, assessments, and attendance tables.
-- Important side effects: Replaces role policies for the listed tables so live CRUD matches the admin UI.

DROP POLICY IF EXISTS "mvp_admin_select_enrollments" ON enrollments;
DROP POLICY IF EXISTS "mvp_admin_insert_enrollments" ON enrollments;
DROP POLICY IF EXISTS "mvp_admin_update_enrollments" ON enrollments;
DROP POLICY IF EXISTS "mvp_admin_delete_enrollments" ON enrollments;
CREATE POLICY "mvp_admin_select_enrollments" ON enrollments FOR SELECT TO authenticated USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_enrollments" ON enrollments FOR INSERT TO authenticated WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_enrollments" ON enrollments FOR UPDATE TO authenticated USING (public.is_admin_role()) WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_enrollments" ON enrollments FOR DELETE TO authenticated USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_select_payments" ON payments;
DROP POLICY IF EXISTS "mvp_admin_insert_payments" ON payments;
DROP POLICY IF EXISTS "mvp_admin_update_payments" ON payments;
DROP POLICY IF EXISTS "mvp_admin_delete_payments" ON payments;
CREATE POLICY "mvp_admin_select_payments" ON payments FOR SELECT TO authenticated USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_payments" ON payments FOR INSERT TO authenticated WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_payments" ON payments FOR UPDATE TO authenticated USING (public.is_admin_role()) WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_payments" ON payments FOR DELETE TO authenticated USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_select_assessments" ON assessments;
DROP POLICY IF EXISTS "mvp_admin_insert_assessments" ON assessments;
DROP POLICY IF EXISTS "mvp_admin_update_assessments" ON assessments;
DROP POLICY IF EXISTS "mvp_admin_delete_assessments" ON assessments;
CREATE POLICY "mvp_admin_select_assessments" ON assessments FOR SELECT TO authenticated USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_assessments" ON assessments FOR INSERT TO authenticated WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_assessments" ON assessments FOR UPDATE TO authenticated USING (public.is_admin_role()) WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_assessments" ON assessments FOR DELETE TO authenticated USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_select_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_admin_insert_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_admin_update_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_admin_delete_assessment_questions" ON assessment_questions;
CREATE POLICY "mvp_admin_select_assessment_questions" ON assessment_questions FOR SELECT TO authenticated USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_assessment_questions" ON assessment_questions FOR INSERT TO authenticated WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_assessment_questions" ON assessment_questions FOR UPDATE TO authenticated USING (public.is_admin_role()) WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_assessment_questions" ON assessment_questions FOR DELETE TO authenticated USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_select_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_admin_insert_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_admin_update_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_admin_delete_attendance_sessions" ON attendance_sessions;
CREATE POLICY "mvp_admin_select_attendance_sessions" ON attendance_sessions FOR SELECT TO authenticated USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_attendance_sessions" ON attendance_sessions FOR INSERT TO authenticated WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_attendance_sessions" ON attendance_sessions FOR UPDATE TO authenticated USING (public.is_admin_role()) WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_attendance_sessions" ON attendance_sessions FOR DELETE TO authenticated USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_admin_select_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_admin_insert_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_admin_update_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_admin_delete_attendance_records" ON attendance_records;
CREATE POLICY "mvp_admin_select_attendance_records" ON attendance_records FOR SELECT TO authenticated USING (public.is_admin_role());
CREATE POLICY "mvp_admin_insert_attendance_records" ON attendance_records FOR INSERT TO authenticated WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_update_attendance_records" ON attendance_records FOR UPDATE TO authenticated USING (public.is_admin_role()) WITH CHECK (public.is_admin_role());
CREATE POLICY "mvp_admin_delete_attendance_records" ON attendance_records FOR DELETE TO authenticated USING (public.is_admin_role());

DROP POLICY IF EXISTS "mvp_trainer_select_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_trainer_insert_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_trainer_update_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "mvp_trainer_delete_attendance_sessions" ON attendance_sessions;
CREATE POLICY "mvp_trainer_select_attendance_sessions" ON attendance_sessions FOR SELECT TO authenticated USING (public.is_trainer_role());
CREATE POLICY "mvp_trainer_insert_attendance_sessions" ON attendance_sessions FOR INSERT TO authenticated WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_update_attendance_sessions" ON attendance_sessions FOR UPDATE TO authenticated USING (public.is_trainer_role()) WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_delete_attendance_sessions" ON attendance_sessions FOR DELETE TO authenticated USING (public.is_trainer_role());

DROP POLICY IF EXISTS "mvp_trainer_select_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_trainer_insert_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_trainer_update_assessment_questions" ON assessment_questions;
DROP POLICY IF EXISTS "mvp_trainer_delete_assessment_questions" ON assessment_questions;
CREATE POLICY "mvp_trainer_select_assessment_questions" ON assessment_questions FOR SELECT TO authenticated USING (public.is_trainer_role());
CREATE POLICY "mvp_trainer_insert_assessment_questions" ON assessment_questions FOR INSERT TO authenticated WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_update_assessment_questions" ON assessment_questions FOR UPDATE TO authenticated USING (public.is_trainer_role()) WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_delete_assessment_questions" ON assessment_questions FOR DELETE TO authenticated USING (public.is_trainer_role());

DROP POLICY IF EXISTS "mvp_trainer_select_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_trainer_insert_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_trainer_update_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "mvp_trainer_delete_attendance_records" ON attendance_records;
CREATE POLICY "mvp_trainer_select_attendance_records" ON attendance_records FOR SELECT TO authenticated USING (public.is_trainer_role());
CREATE POLICY "mvp_trainer_insert_attendance_records" ON attendance_records FOR INSERT TO authenticated WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_update_attendance_records" ON attendance_records FOR UPDATE TO authenticated USING (public.is_trainer_role()) WITH CHECK (public.is_trainer_role());
CREATE POLICY "mvp_trainer_delete_attendance_records" ON attendance_records FOR DELETE TO authenticated USING (public.is_trainer_role());
