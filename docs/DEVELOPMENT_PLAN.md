<!--
Purpose: Describe the current development plan for the V-TEKI MVP and the later migration path.
Who uses it: Engineers, reviewers, and planning sessions.
Main dependencies: Current React/Vite MVP, Supabase schema/seed files, local fallback data, and future Express.js migration ideas.
Public/main sections: Phase breakdown and current next steps.
Important side effects: None.
-->

# Development Plan

_Last updated: 2026-06-19_

> **Catatan**: Aplikasi yang berjalan saat ini adalah Supabase-first ketika dikonfigurasi, dengan data demo lokal sebagai fallback preview.

---

## Phase 1: Stabilize Shared Business Rules ✅

- [x] Logika kelayakan sertifikat selesai
- [x] Helper mapping role selesai
- [x] Supabase OTP auth flow selesai
- [x] Fallback auth/sesi lokal sebagai preview selesai

---

## Phase 2: Complete Operational MVP Modules ✅

- [x] Feedback flow selesai
- [x] Attendance flow selesai
- [x] Assessment flow selesai
- [x] Payment dan invoice flow selesai

---

## Phase 3: Complete Role Flows ✅

- [x] Participant flow selesai
- [x] Trainer flow selesai
- [x] Corporate PIC flow selesai
- [x] Admin flow selesai

---

## Phase 4: Auth & Integration ✅

- [x] Google Sign-In via Supabase OAuth diaktifkan
- [x] Halaman Register dengan tombol "Create account"
- [x] Halaman Login bersih (tanpa quick access/login flow info box)
- [x] Profile user terupdate otomatis saat login Google
- [x] My Profile bisa diakses dari semua role

---

## Phase 5: Demo Stability & Polish ✅

- [x] Demo auth tetap stabil
- [x] Seeded data selaras dengan halaman role
- [x] Empty states dapat dibaca dengan jelas
- [x] Invoice, sertifikat, dan absensi dapat digunakan di demo mode
- [x] Trainer aktif: hanya Dr. Idha Kristiana

---

## Phase 6: Documentation ✅

- [x] `docs/GOOGLE_OAUTH_SETUP.md` — panduan setup Google Sign-In
- [x] `docs/SUPABASE_MIGRATION.md` — panduan ganti project Supabase
- [x] `README.md` diperbarui dengan info terkini
- [x] Semua file docs diperbarui

---

## Next Steps (Future)

1. Import `supabase/schema_fixed.sql` ke project Supabase baru jika ingin ganti project.
2. Import `supabase/seed_complete.sql` untuk data demo.
3. Verifikasi semua role flow terhadap data Supabase.
4. Aktifkan RLS policies tabel per tabel setelah verifikasi role.
5. Pertimbangkan Express.js API layer hanya jika project membutuhkan backend dedicated.
6. Tambahkan file upload storage jika kebutuhan upload aktif.
