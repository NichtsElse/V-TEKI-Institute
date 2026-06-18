# Supabase Integration Status

**Date**: June 11, 2026
**Current Mode**: Supabase-first MVP with local fallback preview
**Status**: Schema aligned, seed prepared, OTP auth implemented; RLS next

## Current Setup

- `src/lib/supabase.js` exists and can create a Supabase client.
- `isSupabaseConfigured()` guards Supabase access in the app client.
- Supabase is the primary backend path when enabled.
- Local fallback data still exists for offline preview.
- Supabase schema matches the frontend data shape and the seed file is aligned to the current demo dataset.

## What Is Active In The Demo

- Supabase email OTP authentication
- Supabase-backed seeded data when enabled
- Role-based UI and routing
- Certificate eligibility logic
- Certificate PDF generation
- Admin invoice creation and payment verification

## What Is Not Active In The Demo

- RLS policies
- Express.js backend routes
- Cloud persistence

## Future Migration Notes

Current migration order:

1. Import `supabase/schema_fixed.sql`.
2. Import `supabase/seed_fixed.sql`.
3. Verify all role pages against Supabase.
4. Add and enable RLS policies table by table.

## Summary

| Item | Status | Notes |
|------|--------|-------|
| Supabase Client Support | Ready | Optional future path |
| Current Demo Mode | Available | Local fallback only |
| Authentication | Supabase OTP | Primary path |
| Database Schema | Ready | Import `schema_fixed.sql` |
| RLS Policies | Not active | Enable after role verification |

**Current Status**: Supabase-first MVP  
**Supabase**: Enabled via env flag  
**Migration**: In progress
