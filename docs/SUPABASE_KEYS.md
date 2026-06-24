<!--
Purpose: Explain which Supabase keys are required for setup versus runtime.
Who uses it: Developers, reviewers, and anyone setting up the V-TEKI demo locally.
Main dependencies: Supabase Auth, frontend env vars, one-time setup scripts, and RLS policies.
Public/main sections: Key matrix, recommended setup sequence, and anon-only runtime mode.
Important side effects: None.
-->

# Supabase Keys

_Last updated: 2026-06-19_

> **Catatan**: Target runtime adalah frontend-only dengan akses anon/publishable key. Service-role dan secret key hanya untuk setup awal, tidak boleh ada di kode frontend.

---

## Key Matrix

| Key | Digunakan Untuk | Lokasi |
|---|---|---|
| `VITE_SUPABASE_URL` | Runtime frontend dan pembuatan Supabase client | `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | Baca/tulis frontend yang diizinkan RLS | `.env.local` |
| `VITE_ENABLE_SUPABASE` | Flag untuk mengaktifkan Supabase (set `true`) | `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Seeding satu kali, admin scripts, dan setup tasks | shell env lokal atau script runner aman |
| `SUPABASE_SECRET_KEY` | Rahasia setup-only atau automasi administratif | setup lokal aman saja, **jangan ke frontend** |

---

## Cara Mendapatkan Keys

1. Buka **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Pilih project Anda.
3. Buka **Project Settings** > **API**.
4. Salin:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (hanya untuk setup)

---

## Recommended Setup Flow

1. Buat project baru di Supabase.
2. Jalankan script SQL di folder `supabase/migrations/` secara berurutan (`01_schema.sql` -> `02_policies.sql` -> `03_seed_auth.sql` -> `04_seed_data.sql` -> `05_fix_rls_update.sql`) di SQL Editor.
3. Konfirmasi frontend dapat membaca data dengan anon/publishable key.
4. Hapus ketergantungan frontend pada service-role atau secret key.

> Panduan lengkap ganti project Supabase: [`docs/SUPABASE_MIGRATION.md`](SUPABASE_MIGRATION.md)

---

## Anon-Only Runtime

Setelah database di-seed dan policies terpasang, aplikasi harus berjalan hanya dengan nilai frontend ini:

```env
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Pada titik ini:
- browser tidak pernah membutuhkan service-role key
- browser tidak pernah membutuhkan secret key
- akses data dikontrol sepenuhnya oleh RLS
- setup scripts tetap menjadi satu-satunya tempat yang boleh menggunakan akses service-role

---

## File `.env.local` Contoh Lengkap

```env
# Supabase client (wajib untuk Supabase mode)
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=https://<PROJECT-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>

# Hanya untuk setup/seeding — JANGAN masukkan ke kode frontend
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

> ⚠️ File `.env.local` sudah ada di `.gitignore`. Jangan hapus atau ubah aturan ini.
