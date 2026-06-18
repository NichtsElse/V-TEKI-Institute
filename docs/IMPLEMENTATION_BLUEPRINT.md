<!--
Purpose: Capture the practical implementation direction for the current MVP and future backend options.
Who uses it: Developers, reviewers, and planning sessions.
Main dependencies: React/Vite frontend, Supabase schema/seed files, local fallback adapter, and optional Express.js backend.
Public/main sections: Current build direction, future build direction, and practical rule.
Important side effects: None.
-->

# Implementation Blueprint

_Current note: this blueprint documents the Supabase-first MVP direction and the optional future API migration path._

## Current Build Direction

- React + Vite frontend
- Supabase auth and data when configured
- local seeded demo data as fallback preview
- local auth/session handling only for fallback preview
- role-based pages for public, admin, trainer, participant, and corporate users
- shared domain helpers for eligibility and role mapping

## Future Build Direction

- Express.js API if the project later needs a dedicated backend layer
- RLS policies after Supabase role flow verification
- storage and file handling if migration resumes

## Practical Rule

Do not block the current MVP on the future API plan. Keep Supabase and fallback preview stable first, then add backend layers only when needed.
