<!--
Purpose: Summarize implemented MVP capabilities and the current runtime contract.
Who uses it: Developers, reviewers, and project handoff sessions.
Main dependencies: React/Vite frontend, Supabase auth/data path, local fallback adapter, and role modules.
Public/main sections: Working features, runtime contract, recent stability work, and notes.
Important side effects: None.
-->

# Implementation Summary

_Last updated: 2026-06-19_

> **Catatan**: Ringkasan ini mencerminkan MVP Supabase-first dengan fallback preview lokal, bukan deployment yang diperkuat untuk produksi.

---

## What Is Working

### Auth & Akses
- ✅ Supabase OTP auth (email + password)
- ✅ Google Sign-In via Supabase OAuth
- ✅ Register akun baru ("Create account")
- ✅ Local demo auth fallback
- ✅ Role-based routing dan redirect
- ✅ My Profile dapat diakses dari semua role

### Halaman Publik
- ✅ Landing page
- ✅ Daftar program
- ✅ Profil trainer (hanya Dr. Idha Kristiana yang aktif)
- ✅ Verifikasi sertifikat publik

### Participant Dashboard
- ✅ Dashboard dan program flow peserta
- ✅ Riwayat enrollment dan pembayaran
- ✅ Pre/post assessment
- ✅ Attendance view
- ✅ Feedback submission
- ✅ Certificate download (PDF)

### Trainer Dashboard
- ✅ Dashboard trainer
- ✅ Manajemen batch yang ditugaskan
- ✅ Input attendance manual
- ✅ Assessment review
- ✅ Feedback view
- ✅ Laporan trainer

### Corporate Dashboard
- ✅ Dashboard corporate PIC
- ✅ Daftar peserta organisasi
- ✅ Invoice organisasi

### Admin Dashboard
- ✅ Manajemen program dan batch
- ✅ Manajemen registrasi
- ✅ Payment verification
- ✅ Attendance management
- ✅ Assessment management
- ✅ Feedback overview
- ✅ Certificate management
- ✅ Admin invoice creation

---

## Current Runtime Contract

| Komponen | Detail |
|---|---|
| Frontend | React + Vite |
| Backend | Supabase Auth + Postgres (saat dikonfigurasi) |
| Fallback | Data demo lokal di browser |
| Auth | Email OTP + Google OAuth via Supabase |
| Dev server | `127.0.0.1:4173` (strictPort) |

---

## Recent Stability Work

- Fixed trainer attendance blank-page crash
- Fixed participant attendance presentation
- Fixed certificate generation dan download flow
- Added admin invoice creation flow
- Aligned Supabase schema dan seed files ke shape data frontend
- Removed "Login flow" dan "Quick access accounts" info box dari halaman login
- Updated tombol "Send link" menjadi "Create account" di halaman register
- Fixed My Profile routing untuk semua role
- Google Sign-In diaktifkan via Supabase OAuth
- Semua dokumentasi `docs/` diperbarui

---

## Notes

- Dokumen ini adalah ringkasan proyek, bukan migration checklist.
- Aktivasi RLS tetap menjadi milestone keamanan database berikutnya setelah verifikasi role.
- Express.js tetap opsional kecuali project membutuhkan dedicated backend API.
- Untuk ganti project Supabase, lihat [`docs/SUPABASE_MIGRATION.md`](SUPABASE_MIGRATION.md).
- Untuk setup Google Sign-In, lihat [`docs/GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md).
