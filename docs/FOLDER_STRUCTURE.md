<!--
Purpose: Describe the current and recommended folder structure for the V-TEKI platform.
Who uses it: Engineers and maintainers organizing MVP and future backend work.
Main dependencies: Current frontend layout, Supabase migration files, and the future Express.js migration path.
Public/main sections: Current structure, recommended frontend structure, and future backend structure.
Important side effects: None.
-->

# Folder Structure

_Current note: this repo is running as a React + Vite MVP with Supabase-first runtime support and seeded local fallback data._

## Current Frontend Structure

```text
src/
  api/
  components/
    layout/
    shared/
    ui/
  domain/
    auth/
    certificates/
    trainers/
    corporate/
  lib/
  pages/
    admin/
    corporate/
    participant/
    public/
    trainer/
  utils/
```

```text
supabase/
  schema_fixed.sql
  seed_fixed.sql
  RLS_POLICIES.md
```

## Recommended Frontend Structure

```text
src/
  api/
    client/
    services/
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
  hooks/
  lib/
  pages/
    public/
    admin/
    participant/
    trainer/
    corporate/
  utils/
```

## Future Backend Structure

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

## Structure Guidelines

- pages render UI and orchestration only
- domain folders hold business logic
- api folders abstract storage/backend access
- shared components should avoid business-specific rules
- supabase files hold database setup, seed data, and RLS planning
- future backend modules should map to core business domains
