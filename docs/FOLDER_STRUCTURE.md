<!--
Purpose: Describe the current and recommended folder structure for the V-TEKI platform.
Who uses it: Engineers and maintainers organizing MVP and future backend work.
Main dependencies: Current frontend layout, Supabase migration files, and the future Express.js migration path.
Public/main sections: Current structure, recommended frontend structure, and future backend structure.
Important side effects: None.
-->

# Folder Structure

_Last updated: 2026-06-19_

> **Catatan**: Repo ini berjalan sebagai React + Vite MVP dengan dukungan runtime Supabase-first dan data fallback lokal.

---

## Struktur Saat Ini

```text
/
├── docs/                          # Dokumentasi proyek
│   ├── API_DESIGN_SUMMARY.md
│   ├── APPLICATION_ARCHITECTURE.md
│   ├── DEVELOPMENT_PLAN.md
│   ├── FOLDER_STRUCTURE.md
│   ├── GOOGLE_OAUTH_SETUP.md      # Panduan setup Google Sign-In
│   ├── IMPLEMENTATION_BLUEPRINT.md
│   ├── IMPLEMENTATION_COMPLETE.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── SUPABASE_KEYS.md
│   └── SUPABASE_MIGRATION.md      # Panduan ganti project Supabase
│
├── supabase/                      # File SQL untuk setup database
│   ├── schema_fixed.sql           # Skema tabel
│   ├── seed_complete.sql          # Data demo
│   └── policies_mvp_read_access.sql # RLS policies
│
├── src/
│   ├── api/
│   │   └── appClient.js           # Adapter utama (Supabase + local fallback)
│   ├── components/
│   │   ├── layout/                # Layout wrapper, sidebar, navbar
│   │   ├── public/                # Komponen halaman publik
│   │   ├── shared/                # Komponen reusable
│   │   └── ui/                    # Shadcn UI components
│   ├── domain/
│   │   ├── auth/                  # Role mapping, roleConfig, home path
│   │   ├── certificates/          # Logika kelayakan sertifikat
│   │   ├── corporate/             # Helper data korporat
│   │   └── trainers/              # Helper data trainer
│   ├── lib/
│   │   └── supabase.js            # Inisialisasi Supabase client
│   ├── pages/
│   │   ├── admin/                 # Halaman admin
│   │   ├── corporate/             # Halaman corporate PIC
│   │   ├── participant/           # Halaman peserta
│   │   ├── public/                # Halaman publik (landing, programs, trainers)
│   │   └── trainer/               # Halaman trainer
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── NotFound.jsx
│   ├── utils/                     # Utilitas umum
│   ├── validators/                # Validasi form dan data
│   └── App.jsx                    # Routing utama
│
├── .env.local                     # Konfigurasi environment (tidak di-commit)
├── .env.local.example             # Contoh konfigurasi
├── package.json
├── vite.config.js
└── README.md
```

---

## Recommended Frontend Structure (Target)

```text
src/
  api/
    client/          # Supabase client setup
    services/        # Service per domain (programs, batches, dll.)
  components/
    layout/
    shared/
    ui/
  domain/
    auth/
    roles/
    enrollments/
    payments/
    assessments/
    attendance/
    feedback/
    certificates/
  hooks/             # Custom React hooks
  lib/
  pages/
    public/
    admin/
    participant/
    trainer/
    corporate/
  utils/
```

---

## Future Backend Structure (Optional)

Hanya jika project membutuhkan dedicated backend API layer:

```text
server/
  src/
    app/
    config/
    middleware/
    modules/
      auth/
      users/
      organizations/
      trainers/
      programs/
      batches/
      enrollments/
      invoices/
      payments/
      assessments/
      attendance/
      feedback/
      certificates/
    db/
    services/
    validators/
```

---

## Panduan Struktur

- `pages/` hanya boleh berisi render UI dan orkestrasi
- `domain/` berisi logika bisnis terpusat
- `api/` mengabstraksi akses penyimpanan/backend
- `components/shared/` tidak boleh berisi aturan bisnis spesifik
- `supabase/` menyimpan setup database, seed data, dan perencanaan RLS
- modul backend masa depan harus dipetakan ke domain bisnis inti
