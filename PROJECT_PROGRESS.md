# Project Progress

Last updated: 2026-06-11

## Current Direction

The project stays on the existing frontend stack, while Supabase is now the primary backend target:

- React + Vite
- local seeded demo data as fallback preview
- Supabase enabled through env flags
- Supabase schema and seed data aligned to the current frontend data shape

The current priority is to finish the Supabase migration without breaking the role UX.

## What Is Already Working

- Public pages: home, programs, trainers, certificate verification
- Role-based login for:
  - admin
  - trainer
  - participant
  - corporate PIC
- Supabase OTP auth flow
- Role-based routing and protected pages
- Local seeded database in `src/api/appClient.js`
- Participant dashboards and program progress
- Admin program, batch, attendance, assessment, feedback, and certificate pages
- Trainer dashboard, batches, attendance, feedback, reports, and assessments pages
- Corporate dashboard, participants, and invoices pages
- Admin invoice creation in the Payments page
- Certificate PDF generation
- Certificate eligibility logic
- Mobile public navbar menu
- Stable local dev server on `127.0.0.1:4173`

## Recent Fixes

- Added Supabase OTP login flow
- Kept local fallback preview for `@vteki.local` accounts
- Fixed public navbar visibility on mobile
- Fixed corporate pages so they resolve organization scope from demo data
- Fixed participant attendance visibility
- Fixed certificate generation filters so eligible demo users can generate certificates
- Fixed trainer identity resolution so trainer dashboards and related views use the correct trainer record
- Fixed trainer attendance blank-page crash and made the page more defensive
- Added admin invoice creation flow in the Payments page
- Aligned Supabase schema to the current frontend field names and IDs
- Generated a Supabase seed file from the current demo dataset
- Updated README and Vite dev config

## Features Still In Progress

- Some generated bundles are still large and can be split later
- RLS still needs to be enabled table by table after role verification

## Known Notes

- Supabase exists in the codebase and is the primary auth/data path when enabled.
- Local demo data is retained only as fallback preview.
- The dev server is pinned to `127.0.0.1:4173`.
- Build works, but Vite warns that the main bundle is large.

## Recommended Next Steps

1. Import the new schema and seed into Supabase.
2. Verify trainer dashboard, attendance, and invoice flows against Supabase.
3. Enable RLS table by table after role verification.
4. Keep bundle splitting as a later optimization.
