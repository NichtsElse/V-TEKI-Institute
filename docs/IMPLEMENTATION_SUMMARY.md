<!--
Purpose: Summarize implemented MVP capabilities and the current runtime contract.
Who uses it: Developers, reviewers, and project handoff sessions.
Main dependencies: React/Vite frontend, Supabase auth/data path, local fallback adapter, and role modules.
Public/main sections: Working features, runtime contract, recent stability work, and notes.
Important side effects: None.
-->

# Implementation Summary

_Current note: this summary reflects the Supabase-first MVP with local fallback preview, not a production-hardened deployment._

## What Is Working

- public pages
- Supabase OTP auth
- local demo auth fallback
- role-based routing
- participant dashboards and program flows
- trainer dashboards, batches, attendance, assessments, feedback, and reports
- corporate dashboard, participant list, and invoices
- admin program, batch, registration, payment, attendance, assessment, feedback, and certificate flows
- certificate PDF generation
- admin invoice creation

## Current Runtime Contract

- React + Vite frontend
- Supabase-backed data when configured
- local seeded data in the browser as fallback preview
- optional future Express.js API path still documented

## Recent Stability Work

- fixed trainer attendance blank-page crash
- fixed participant attendance presentation
- fixed certificate generation and download flows
- added admin invoice creation flow
- aligned Supabase schema and seed files to the frontend data shape
- kept the local dev server stable on `127.0.0.1:4173`

## Notes

- This document is a project summary, not a migration checklist.
- RLS activation remains the next database safety milestone after role verification.
- Express.js remains optional unless the project needs a dedicated backend API.
