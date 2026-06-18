<!--
Purpose: Describe the target application architecture for the V-TEKI MVP and future backend migration.
Who uses it: Engineers, reviewers, and future implementation sessions.
Main dependencies: Current Vite/React frontend, Supabase services, local fallback adapter, and planned Express.js backend.
Public/main sections: Frontend layers, backend direction, auth model, authorization model, and business rules.
Important side effects: None.
-->

# Application Architecture

_Current note: the live app is a React + Vite MVP that is Supabase-first when configured, with seeded local demo data retained as fallback preview._

## Overview

The application should evolve in three clear layers:

1. Presentation layer
2. Domain layer
3. Data access layer

This keeps the current MVP usable while leaving room for `Express.js + Supabase` later.

## Presentation Layer

This layer contains:

- pages
- dashboards
- forms
- tables
- cards
- layout components
- role-based navigation

Current examples:

- `src/pages/*`
- `src/components/*`
- `src/api/appClient.js`

Responsibilities:

- render UI
- collect user input
- display state and summaries
- call domain/data helpers

Should not own:

- certificate rule logic
- role decision logic
- cross-module business rules

## Domain Layer

This layer contains shared business logic and reusable rules.

Current direction:

- `src/domain/auth`
- `src/domain/certificates`
- `src/domain/trainers`

Target modules:

- `auth`
- `roles`
- `enrollments`
- `payments`
- `assessments`
- `attendance`
- `feedback`
- `certificates`

Responsibilities:

- role mapping
- role home routes
- certificate eligibility
- enrollment lifecycle logic
- completion logic
- status derivation and readiness logic

## Data Access Layer

Current mode:

- `src/api/appClient.js`
- Supabase-backed reads/writes when configured
- local in-browser adapter as fallback preview

Future mode:

- optional frontend API service layer calling `Express.js`
- backend persistence through `Supabase`

Responsibilities:

- read/write data
- isolate storage/backend differences
- keep page components backend-agnostic

## Authentication

### Current MVP

- Supabase email OTP when configured
- local session handling only for fallback preview
- role-aware redirect and sidebar behavior

### Target backend model

- `Supabase Auth` for identity
- optional `Express.js` middleware for auth validation if a REST API is added
- optional current user endpoint through `/api/auth/me`

## Authorization

Target roles:

- `super_admin`
- `academy_admin`
- `trainer`
- `participant`
- `corporate_pic`

Expected access boundaries:

- `super_admin`
  - full system and operational access
- `academy_admin`
  - full operational access
- `trainer`
  - assigned classes, participants, attendance, assessments
- `participant`
  - own learning, payments, feedback, certificates
- `corporate_pic`
  - own organization participants, invoices, reports

## RLS Direction

Although RLS is not active yet, design should follow Supabase RLS boundaries:

- participant sees only own records
- trainer sees only assigned records
- corporate PIC sees only organization records
- admin roles manage operational records
- service role remains backend-only

## Certificate Eligibility

Certificate issuance must use one shared rule:

- `payment_status = paid`
- `attendance_percentage >= 80`
- `post_assessment_status = completed`
- `feedback_status = submitted`
- `completion_status = completed`

This logic must stay centralized in the domain layer.
