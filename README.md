# V-TEKI Institute Platform

_Last updated: 2026-06-11_

V-TEKI CoE is a Supabase-first MVP frontend for training, certification, attendance, assessment, and corporate reporting flows. The app now expects Supabase for auth and data when enabled, while still keeping a local fallback for offline preview.

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

Primary login now uses Supabase email OTP. The local demo accounts remain only as fallback preview data when Supabase is disabled.

## Supabase Mode

Enable Supabase to use the real auth and database flow:

To enable Supabase explicitly:

```env
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

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
