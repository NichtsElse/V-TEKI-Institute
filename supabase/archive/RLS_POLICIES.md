<!--
Purpose: Define the intended Supabase Row Level Security strategy for V-TEKI data.
Who uses it: Database implementers, backend engineers, and security reviewers.
Main dependencies: Supabase Auth, users_profile, role fields, organization scope, and future SQL policies.
Public/main sections: Apply order, role-flow matrix, global policies, operational policies, and helper function notes.
Important side effects: None; this document is policy guidance and does not apply SQL.
-->

# Supabase Row Level Security (RLS) Policies

_Current note: `policies_flow_aligned_rls.sql` is the latest role-flow refresh. Apply it after `schema_fixed.sql`, seed files, and the older MVP policy files when refreshing an existing Supabase project._

This document defines the intended Row Level Security (RLS) strategy for the V-TEKI Institute platform when transitioning to Supabase PostgreSQL.

## Apply Order
1. Run `schema_fixed.sql`.
2. Run `seed_auth_users.sql` in the Supabase SQL Editor if demo auth users are needed.
3. Run `seed_complete.sql` in the SQL Editor, or run `scripts/seed-supabase-from-sql.mjs` with `SUPABASE_SERVICE_ROLE_KEY`.
4. Run older compatibility policy files only when needed for existing environments.
5. Run `policies_flow_aligned_rls.sql` last so it drops stale `mvp_%`/`flow_%` policies and recreates the current role-aware policies.

Run seed before RLS when using the SQL Editor. If seeding after RLS is already active, use the service-role script so data migration bypasses RLS intentionally instead of failing through anon/authenticated client policies. The refresh file also creates indexes used by RLS predicates to avoid repeated full-table scans as data grows.

## Identity & Authentication
We assume all users are authenticated via Supabase Auth (`auth.users`).
The custom `users_profile` table is matched by `auth.users.id` and, for seeded/demo accounts, by email.
The `role` and `organization_id` of a user determine their access level.

Role enum: `super_admin`, `academy_admin`, `admin`, `trainer`, `participant`, `corporate_pic`, `user`

## Role Flow Matrix
- Public/auth users can browse published programs, open/closed public batches, active trainers, create registrations/payments from program registration, and verify valid certificates.
- Admin and super admin roles can manage users, trainers, programs, batches, registrations, payments, assessments, questions, attendance, feedback, certificates, and reports.
- Participants can read and update their own profile, enrollments, assessment submissions, feedback, certificates, and attendance visibility.
- Trainers can read their trainer profile and manage only batches, assessments, questions, submissions, attendance, feedback, and reports for batches assigned to their resolved trainer record.
- Corporate PIC users can read enrollments, payments, invoices, and organization-scoped reporting for their own `organization_id`.

---

## Global Policies

### 1. `users_profile`
- **SELECT**: 
  - Admin: ALL
  - User: Own profile by `auth.uid()` or JWT email
- **INSERT/UPDATE/DELETE**: 
  - Admin: ALL
  - User: Can insert/update own profile

### 2. `organizations`
- **SELECT**: Admin ALL; Corporate PIC only own organization
- **INSERT/UPDATE/DELETE**: Admin only

### 3. `programs`
- **SELECT**: Published programs for anonymous/authenticated public catalog; Admin can see all
- **INSERT/UPDATE/DELETE**: Admin only

### 4. `batches`
- **SELECT**: 
  - Admin: ALL
  - Trainer: Batches where the current user is the assigned trainer
  - Public/Participant/Corporate PIC: Only batches where `status IN ('open', 'closed', 'published')`
- **INSERT/UPDATE/DELETE**: Admin only

---

## Operational Policies

### 5. `enrollments` (Registrations)
- **SELECT**:
  - Admin: ALL
  - Corporate PIC: Where `organization_id = current user's organization`
  - Participant: Where `participant_id = auth.uid()` or enrollment email equals JWT email
  - Trainer: Where `batch_id` belongs to batches assigned to them
- **INSERT**: Anonymous/authenticated public registration flow
- **UPDATE**: 
  - Admin: ALL
  - Participant: Own enrollment updates used by profile, assessment, and feedback flows
  - Trainer: Assigned-batch attendance/completion updates
- **DELETE**: Admin only

### 6. `invoices` & `payments`
- **SELECT**:
  - Admin: ALL
  - Corporate PIC: Where `organization_id = current user's organization`
  - Participant: Where `registration_id` belongs to them
- **INSERT**: Public registration payment creation
- **UPDATE/DELETE**: Admin only

### 7. `assessments`
- **SELECT**:
  - Admin: ALL
  - Trainer: Assigned batches only
  - Participant: Only assessments tied to batches they are enrolled in
- **INSERT/UPDATE/DELETE**: Admin; Trainer only for assigned batches

### 8. `assessment_questions`
- **SELECT**:
  - Admin: ALL
  - Trainer: Questions for assessments in assigned batches
  - Participant: Questions for assessments in batches they are enrolled in
- **INSERT/UPDATE/DELETE**: Admin; Trainer only for assigned assessments

### 9. `assessment_submissions`
- **SELECT**:
  - Admin: ALL
  - Trainer: Submissions for assessments in assigned batches
  - Participant: Own submissions by registration/email
- **INSERT/UPDATE**: Participant for own submissions; Trainer can update assigned submissions for review
- **DELETE**: Admin only

### 10. `attendance_sessions` & `attendance_records`
- **SELECT**:
  - Admin: ALL
  - Trainer: Assigned batches only
  - Participant: Records belonging to them
- **INSERT/UPDATE**: Admin / Trainer
- **DELETE**: Admin only

### 11. `feedback`
- **SELECT**:
  - Admin: ALL
  - Trainer: Assigned batches only
  - Participant: Only their own feedback
- **INSERT/UPDATE**: Participant for own feedback
- **DELETE**: Admin only

### 12. `certificates`
- **SELECT**: Public verification for valid certificates; Admin ALL; Participant own certificates
- **INSERT/DELETE**: Admin only
- **UPDATE**: Admin, plus participant self-profile flow can update their own displayed certificate name

### 13. `trainers`
- **SELECT**: Active trainers for public directory and trainer identity resolution
- **INSERT/UPDATE/DELETE**: Admin only

### 14. `notifications`
- **SELECT/INSERT/UPDATE/DELETE**: Admin ALL; authenticated users only their own notifications

---

## Implementation Notes
To implement this in Supabase later, create helper functions that read the current user's profile from `users_profile` during policy execution. Avoid trying to read `organization_id` directly from `auth.uid()` because `auth.uid()` only returns the authenticated user ID.

```sql
-- Example helper functions
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM users_profile
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id
  FROM users_profile
  WHERE id = auth.uid()
  LIMIT 1;
$$;
```
