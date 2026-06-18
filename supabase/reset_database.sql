-- V-TEKI Database Reset Script
-- Jalankan script ini untuk MENGHAPUS SEMUA TABEL aplikasi agar kembali bersih.
-- JANGAN KHAWATIR, tabel bawaan Supabase (seperti auth.users) tetap aman.

DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS assessment_submissions CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS trainers CASCADE;
DROP TABLE IF EXISTS users_profile CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
