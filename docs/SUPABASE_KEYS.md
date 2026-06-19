<!--
Purpose: Explain which Supabase keys are required for setup versus runtime.
Who uses it: Developers, reviewers, and anyone setting up the V-TEKI demo locally.
Main dependencies: Supabase Auth, frontend env vars, one-time setup scripts, and RLS policies.
Public/main sections: Key matrix, recommended setup sequence, and anon-only runtime mode.
Important side effects: None.
-->

# Supabase Keys

_Current note: the target runtime is frontend-only with `anon` or publishable key access. Service-role and secret keys are setup-only._

## Key Matrix

| Key | Needed For | Where It Belongs |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend runtime and Supabase client creation | `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | Frontend runtime reads/writes allowed by RLS | `.env.local` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Alternative frontend runtime public key name | `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | One-time seeding, admin scripts, and setup tasks | local shell env or secure script runner |
| `SUPABASE_SECRET_KEY` | Setup-only secrets or administrative automation | secure local setup only, never frontend |

## Recommended Setup Flow

1. Create the schema in Supabase.
2. Seed the demo data with the setup script.
3. Apply the RLS policy file for demo/public reads.
4. Confirm the frontend can read data with the anon/publishable key.
5. Remove any frontend dependency on service-role or secret keys.

## Anon-Only Runtime

Once the database is seeded and policies are in place, the app should run with only these frontend values:

```env
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

At that point:

- the browser never needs a service-role key
- the browser never needs a secret key
- data access is controlled entirely by RLS
- setup scripts remain the only place that may use service-role access

