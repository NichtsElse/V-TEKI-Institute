# V-TEKI Institute Platform

_Last updated: 2026-06-19_

V-TEKI Institute is a Supabase-first MVP for training, certification, attendance, assessment, and corporate reporting flows. The app now expects Supabase for auth and data when enabled, while still keeping a local fallback for offline preview.

## What You Can Do

- Browse public programs, trainers, and certificate verification pages.
- Sign in as admin, trainer, participant, or corporate PIC.
- Review batches, attendance, assessments, feedback, invoices, and certificates.
- Use the demo data immediately after running the app locally.

## Tech Stack

- React 18
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- Shadcn UI components
- Supabase Auth and Postgres adapter
- LocalStorage fallback adapter for offline preview

## Run Locally

1. Open a terminal in the project folder.
2. Install dependencies:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

4. Open the app:

```text
http://127.0.0.1:4173
```

If the port is busy, Vite will stop instead of switching ports because `strictPort` is enabled in `vite.config.js`.

## Build

```bash
npm run build
```

## Auth

Primary login uses Supabase email OTP when Supabase is configured. The local demo accounts remain available only as fallback preview data when Supabase is disabled or unavailable.

## Google Sign-In (OAuth)

The app supports **"Continue with Google"** via Supabase OAuth. This feature is free and works out of the box once configured.

For a full step-by-step setup guide, see:

- [`docs/GOOGLE_OAUTH_SETUP.md`](docs/GOOGLE_OAUTH_SETUP.md)

## Ganti Project Supabase

Untuk memindahkan aplikasi ke akun atau project Supabase yang berbeda, lihat panduan lengkap di:

- [`docs/SUPABASE_MIGRATION.md`](docs/SUPABASE_MIGRATION.md)

## Supabase Keys

Use these keys in two phases:

```env
# Runtime in the frontend
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Setup only, never in frontend code
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_SECRET_KEY=your_secret_key
```

The frontend should run with only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` available at runtime. The service role or secret key is only needed for bootstrap tasks such as seeding data or applying policies from scripts.

Recommended setup order (run in SQL Editor in this exact order):

1. Run **`supabase/migrations/01_schema.sql`** to create all tables.
2. Run **`supabase/migrations/02_policies.sql`** to set up Row Level Security and access policies.
3. Run **`supabase/migrations/03_seed_auth.sql`** to seed demo authentication accounts.
4. Run **`supabase/migrations/04_seed_data.sql`** to seed application dummy data.
5. Run **`supabase/migrations/05_fix_rls_update.sql`** to apply RLS policy updates/fixes.
6. Start the app with the `VITE_` keys only.
7. Verify role flows, then keep the app running on anon/public key only.

## Seeded User Profiles

These rows come from the current Supabase `users_profile` seed data. Passwords are included only because this is demo seed data; never reuse these values for production.

| ID | Name | Email | Demo Password | Role | Phone | Status | Organization |
|---|---|---|---|---|---|---|---|
| `user_admin_demo` | Demo Admin | `admin@vteki.local` | `admin123` | `academy_admin` | `021-555-0001` | `active` | - |
| `user_superadmin_demo` | Super Admin | `superadmin@vteki.local` | `superadmin123` | `super_admin` | `021-555-0002` | `active` | - |
| `user_trainer_demo` | Idha Kristiana | `trainer@vteki.local` | `trainer123` | `trainer` | `081300000001` | `active` | - |
| `user_corporate_demo` | Rizky Ananta | `corporate@vteki.local` | `corporate123` | `corporate_pic` | `021-555-0100` | `active` | PT Solusi Transformasi Nusantara |
| `user_participant_demo` | Demo Participant | `participant@vteki.local` | `participant123` | `participant` | `081234567890` | `active` | - |
| `user_corporate_bni` | Andi Susanto | `pic.bni@vteki.local` | `welcome123` | `corporate_pic` | `021-555-0101` | `active` | Bank Negara Indonesia |
| `user_participant_aulia` | Aulia Ramadhan | `aulia.ramadhan@example.com` | `welcome123` | `participant` | `081234567891` | `active` | - |
| `user_part_02` | Dina Kusuma | `dina.kusuma@example.com` | `welcome123` | `participant` | `081298765432` | `active` | PT Solusi Transformasi Nusantara |
| `user_part_03` | Bima Satria | `bima.satria@example.com` | `welcome123` | `participant` | `081311223344` | `active` | PT Solusi Transformasi Nusantara |
| `user_part_04` | Meylani Putri | `meylani.putri@example.com` | `welcome123` | `participant` | `081355667788` | `active` | PT Solusi Transformasi Nusantara |
| `user_part_05` | Farhan Maulana | `farhan.maulana@example.com` | `welcome123` | `participant` | `081344556677` | `active` | - |
| `user_part_06` | Cindy Wijaya | `cindy.wijaya@example.com` | `welcome123` | `participant` | `081122334455` | `active` | Bank Negara Indonesia |
| `user_part_07` | Dimas Pratama | `dimas.pratama@example.com` | `welcome123` | `participant` | `081133445566` | `active` | Bank Negara Indonesia |
| `user_trainer_rafael` | Rafael Mahendra | `rafael.mahendra@vteki.local` | `welcome123` | `trainer` | `081300000002` | `inactive` | - |
| `user_trainer_salma` | Salma Wijaya | `salma.wijaya@vteki.local` | `welcome123` | `trainer` | `081300000003` | `inactive` | - |

## Project Structure

- `src/pages` - role-based pages for public, admin, trainer, corporate, and participant flows.
- `src/components` - shared UI, layout, and reusable components.
- `src/api` - local app adapter and data access helpers.
- `src/domain` - business rules and role/eligibility helpers.
- `src/lib` - auth, routing, and runtime helpers.
- `src/validators` - validation utilities and tests.

- The app uses Supabase when `VITE_ENABLE_SUPABASE=true`.
- Demo data remains available as a fallback preview path.
- The dev server is configured to run on `127.0.0.1:4173`.
- Admin invoice creation is available from the Payments page.
- Trainer attendance, certificates, and role dashboards have been aligned with the demo data.
- RLS policies are documented as a future activation step after role verification.
