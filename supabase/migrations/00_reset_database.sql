-- V-TEKI Database Reset Script
-- Jalankan script ini untuk MENGHAPUS SEMUA TABEL aplikasi agar kembali bersih.
-- JANGAN KHAWATIR, tabel bawaan Supabase (seperti auth.users) tetap aman.

DROP TABLE IF EXISTS vi_feedback CASCADE;
DROP TABLE IF EXISTS vi_assessment_submissions CASCADE;
DROP TABLE IF EXISTS vi_assessments CASCADE;
DROP TABLE IF EXISTS vi_attendance_records CASCADE;
DROP TABLE IF EXISTS vi_attendance_sessions CASCADE;
DROP TABLE IF EXISTS vi_certificates CASCADE;
DROP TABLE IF EXISTS vi_payments CASCADE;
DROP TABLE IF EXISTS vi_enrollments CASCADE;
DROP TABLE IF EXISTS vi_invoices CASCADE;
DROP TABLE IF EXISTS vi_batches CASCADE;
DROP TABLE IF EXISTS vi_programs CASCADE;
DROP TABLE IF EXISTS vi_trainers CASCADE;
DROP TABLE IF EXISTS vi_users_profile CASCADE;
DROP TABLE IF EXISTS vi_organizations CASCADE;
