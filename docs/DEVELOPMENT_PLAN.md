<!--
Purpose: Describe the current development plan for the V-TEKI MVP and the later migration path.
Who uses it: Engineers, reviewers, and planning sessions.
Main dependencies: Current React/Vite MVP, local demo data, and future Express.js/Supabase migration ideas.
Public/main sections: Phase breakdown and current next steps.
Important side effects: None.
-->

# Development Plan

_Current note: the live app is a local-first MVP with Supabase disabled by default._

## Phase 1: Stabilize Shared Business Rules

- completed certificate eligibility logic
- completed role mapping helpers
- completed local auth/session flow

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

- define Express.js API routes if the project moves back to a backend
- move auth to Supabase Auth only if migration resumes
- move persistence to Supabase PostgreSQL only if migration resumes
- add RLS only if migration resumes
- add storage only if migration resumes

## Immediate Next Steps

1. Verify trainer dashboard and attendance flows across all seeded trainers.
2. Verify admin attendance participant selection end-to-end.
3. Improve demo data coverage for edge cases and empty states.
4. Defer bundle splitting until the MVP flow is stable.
