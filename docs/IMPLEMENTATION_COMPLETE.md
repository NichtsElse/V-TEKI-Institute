<!--
Purpose: Preserve the implementation completion snapshot while clarifying remaining verification work.
Who uses it: Developers, reviewers, and project handoff sessions.
Main dependencies: React/Vite MVP, Supabase auth/data path, local fallback adapter, and role dashboards.
Public/main sections: Current status, remaining work, and keep-in-mind notes.
Important side effects: None.
-->

# Implementation Complete

_Last updated: 2026-06-19_

> **Catatan**: File ini awalnya ditulis sebagai laporan penyelesaian. Status proyek saat ini adalah MVP Supabase-first dengan pekerjaan verifikasi, RLS, dan polish yang sedang berjalan.

---

## Current Status

| Fitur | Status |
|---|---|
| Demo flow utama | ✅ Selesai |
| Supabase OTP auth | ✅ Selesai |
| Google Sign-In (OAuth) | ✅ Selesai |
| Local demo auth fallback | ✅ Selesai |
| Supabase schema & seed files | ✅ Disiapkan |
| Trainer flow | ✅ Operasional |
| Participant flow | ✅ Operasional |
| Corporate invoice viewing | ✅ Operasional |
| Admin invoice creation | ✅ Selesai |
| My Profile semua role | ✅ Selesai |
| Certificate PDF | ✅ Selesai |
| Halaman Login bersih | ✅ Selesai |
| Dokumentasi `docs/` | ✅ Lengkap |

---

## Remaining Work

- [ ] Import schema dan seed ke Supabase baru jika ganti project (lihat [`SUPABASE_MIGRATION.md`](SUPABASE_MIGRATION.md))
- [ ] Verifikasi role flow di semua akun demo yang di-seed dan data Supabase
- [ ] Aktifkan RLS tabel per tabel setelah verifikasi
- [ ] Perbaiki edge case dan empty state data demo jika ditemukan
- [ ] Kurangi bundle Vite yang besar jika sudah nyaman

---

## Keep In Mind

- Ini bukan milestone production hardening.
- Express.js tetap opsional hingga MVP membutuhkan dedicated backend API.
- Google OAuth membutuhkan konfigurasi ulang URL callback jika project Supabase diganti (lihat [`GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md)).
