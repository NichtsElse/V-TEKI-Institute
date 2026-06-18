<!--
Purpose: Summarize the target REST API design for the V-TEKI platform.
Who uses it: Frontend engineers, backend engineers, and reviewers.
Main dependencies: Planned Express.js backend and Supabase-backed persistence.
Public/main sections: Domain endpoints, API conventions, auth, and certificate constraints.
Important side effects: None.
-->

# API Design Summary

_Current note: this is a future backend contract. The live MVP still runs on local demo data and local auth._

## API Style

Recommended API style for the future backend:

- REST-oriented
- grouped by business domain
- role-protected
- validated on every write path

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Responsibilities:

- session creation
- session destroy
- current user lookup
- role-aware auth state

## Programs

- `GET /api/programs`
- `GET /api/programs/:id`
- `POST /api/programs`
- `PUT /api/programs/:id`
- `DELETE /api/programs/:id`

## Batches

- `GET /api/batches`
- `GET /api/batches/:id`
- `POST /api/batches`
- `PUT /api/batches/:id`

## Enrollment

- `POST /api/register/individual`
- `POST /api/register/corporate`
- `GET /api/enrollments`
- `GET /api/enrollments/:id`
- `PUT /api/enrollments/:id`

## Payments and Invoices

- `GET /api/invoices`
- `GET /api/payments`
- `POST /api/payments/upload-proof`
- `POST /api/payments/verify`

## Assessments

- `GET /api/assessments/:programId`
- `POST /api/assessments`
- `POST /api/assessments/:id/submit`
- `GET /api/assessments/result/:enrollmentId`

## Attendance

- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`
- `POST /api/attendance/manual`
- `GET /api/attendance/:batchId`

## Feedback

- `POST /api/feedback`
- `GET /api/feedback/:enrollmentId`
- `GET /api/feedback`

## Completion and Certificates

- `POST /api/completion/validate/:enrollmentId`
- `POST /api/certificates/generate/:enrollmentId`
- `GET /api/certificates/:certificateNumber`
- `GET /api/certificates/verify/:verificationCode`
- `GET /api/certificates/download/:certificateNumber`

## API Rules

- all write endpoints must use schema validation
- all sensitive endpoints must require authentication
- role-based authorization must be enforced in middleware
- certificate generation must use shared eligibility logic
- Supabase service-role access must remain backend-only

## RLS Alignment

The API should align with future Supabase RLS expectations:

- participant -> own records only
- trainer -> assigned records only
- corporate PIC -> organization records only
- admin roles -> operational scope

## Current Runtime

- Frontend runs against the local app client, not this API yet.
- Supabase and Express are still future migration targets.
- Certificate eligibility stays shared in the frontend domain layer until backend migration starts.
