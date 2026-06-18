# Implementation Blueprint

_Current note: this blueprint documents the local-first MVP direction and the optional future migration path._

## Current Build Direction

- React + Vite frontend
- local seeded demo data
- local auth/session handling
- role-based pages for public, admin, trainer, participant, and corporate users
- shared domain helpers for eligibility and role mapping

## Future Build Direction

- Express.js API if the project later needs a backend
- Supabase Auth if migration resumes
- Supabase PostgreSQL if migration resumes
- RLS policies if migration resumes
- storage and file handling if migration resumes

## Practical Rule

Do not block the current MVP on the future backend plan. Keep the demo stable first, then migrate only when needed.
