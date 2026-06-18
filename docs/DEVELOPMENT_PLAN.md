<!--
Purpose: Describe the current development plan for the V-TEKI MVP and the later migration path.
Who uses it: Engineers, reviewers, and planning sessions.
Main dependencies: Current React/Vite MVP, Supabase schema/seed files, local fallback data, and future Express.js migration ideas.
Public/main sections: Phase breakdown and current next steps.
Important side effects: None.
-->

# Development Plan

_Current note: the live app is Supabase-first when configured, with local demo data retained as fallback preview._

## Phase 1: Stabilize Shared Business Rules

- completed certificate eligibility logic
- completed role mapping helpers
- completed Supabase OTP auth flow
- completed local auth/session fallback preview

## Phase 2: Complete Operational MVP Modules

- completed feedback flow
- completed attendance flow
- completed assessment flow
- completed payment and invoice flow

## Phase 3: Complete Role Flows

- completed participant flow
- completed trainer flow
- completed corporate PIC flow
- completed admin flow

## Phase 4: Demo Stability and Polish

- keep demo auth stable
- keep seeded data aligned with role pages
- keep empty states readable
- keep invoices, certificates, and attendance usable in demo mode

## Phase 5: Future Migration Path

- import Supabase schema and seed into the target project
- verify role pages against Supabase-backed data
- enable RLS after role verification, table by table
- define Express.js API routes only if the project later needs a dedicated backend
- add storage only when file upload requirements become active

## Immediate Next Steps

1. Import `supabase/schema_fixed.sql` and `supabase/seed_fixed.sql`.
2. Verify trainer dashboard, attendance, invoice, and certificate flows against Supabase.
3. Enable RLS policies table by table after role verification.
4. Improve demo data coverage for edge cases and empty states.
5. Defer bundle splitting until the MVP flow is stable.
