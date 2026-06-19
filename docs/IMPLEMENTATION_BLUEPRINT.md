<!--
Purpose: Capture the practical implementation direction for the current MVP and future backend options.
Who uses it: Developers, reviewers, and planning sessions.
Main dependencies: React/Vite frontend, Supabase schema/seed files, local fallback adapter, and optional Express.js backend.
Public/main sections: Current build direction, future build direction, and practical rule.
Important side effects: None.
-->

# Implementation Blueprint

_Last updated: 2026-06-19_

> **Catatan**: Blueprint ini mendokumentasikan arah MVP Supabase-first dan jalur migrasi API opsional di masa depan.

---

## Current Build Direction

- React + Vite frontend
- Supabase Auth dan data saat dikonfigurasi
- Google Sign-In via Supabase OAuth
- Data demo lokal sebagai fallback preview
- Penanganan auth/sesi lokal hanya untuk fallback preview
- Halaman berbasis role: public, admin, trainer, participant, dan corporate
- Helper domain bersama untuk kelayakan sertifikat dan mapping role

---

## What Is Stable

- ✅ Login dengan email/password (Supabase OTP)
- ✅ Login dengan Google (Supabase OAuth)
- ✅ Register akun baru
- ✅ Dashboard semua role berfungsi
- ✅ Trainer aktif: Dr. Idha Kristiana
- ✅ Attendance, assessment, feedback, invoice, sertifikat semua berfungsi
- ✅ Certificate PDF generation dan download
- ✅ Admin invoice creation
- ✅ My Profile dapat diakses dari semua role

---

## Future Build Direction

- Express.js API jika project nantinya membutuhkan dedicated backend layer
- RLS policies setelah verifikasi Supabase role flow
- Storage dan file handling jika resume kebutuhan upload

---

## Practical Rule

Jangan blokir MVP saat ini untuk rencana API masa depan. **Jaga Supabase dan fallback preview tetap stabil terlebih dahulu**, lalu tambahkan backend layer hanya jika benar-benar dibutuhkan.
