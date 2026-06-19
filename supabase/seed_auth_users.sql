-- Purpose: Seed Supabase Auth users for the demo accounts used by the V-TEKI application.
-- Used by: Supabase SQL Editor or migration runner before testing Supabase-first login flows.
-- Main dependencies: auth.users and auth.identities in Supabase Auth, plus pgcrypto for password hashing.
-- Public/main functions: None; run once to create confirmed demo auth users.
-- Important side effects: Inserts confirmed Auth users with known demo passwords and identity rows.

-- Demo auth users for direct Supabase login.
-- Passwords:
--   admin@vteki.local       -> admin123
--   trainer@vteki.local     -> trainer123
--   trainer2@vteki.local    -> trainer123
--   corporate@vteki.local   -> corporate123
--   participant@vteki.local -> participant123

DO $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_super_admin,
    phone,
    phone_confirmed_at,
    banned_until,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  ) VALUES
    (
      gen_random_uuid(),
      NULL,
      'authenticated',
      'authenticated',
      'admin@vteki.local',
      crypt('admin123', gen_salt('bf')),
      v_now,
      v_now,
      NULL,
      NULL,
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Demo Admin","role":"academy_admin"}'::jsonb,
      v_now,
      v_now,
      FALSE,
      NULL,
      NULL,
      NULL,
      NULL,
      FALSE,
      NULL
    ),
    (
      gen_random_uuid(),
      NULL,
      'authenticated',
      'authenticated',
      'trainer@vteki.local',
      crypt('trainer123', gen_salt('bf')),
      v_now,
      v_now,
      NULL,
      NULL,
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE","role":"trainer"}'::jsonb,
      v_now,
      v_now,
      FALSE,
      NULL,
      NULL,
      NULL,
      NULL,
      FALSE,
      NULL
    ),
    (
      gen_random_uuid(),
      NULL,
      'authenticated',
      'authenticated',
      'trainer2@vteki.local',
      crypt('trainer123', gen_salt('bf')),
      v_now,
      v_now,
      NULL,
      NULL,
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Nadia Pratama","role":"trainer"}'::jsonb,
      v_now,
      v_now,
      FALSE,
      NULL,
      NULL,
      NULL,
      NULL,
      FALSE,
      NULL
    ),
    (
      gen_random_uuid(),
      NULL,
      'authenticated',
      'authenticated',
      'corporate@vteki.local',
      crypt('corporate123', gen_salt('bf')),
      v_now,
      v_now,
      NULL,
      NULL,
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Rizky Ananta","role":"corporate_pic"}'::jsonb,
      v_now,
      v_now,
      FALSE,
      NULL,
      NULL,
      NULL,
      NULL,
      FALSE,
      NULL
    ),
    (
      gen_random_uuid(),
      NULL,
      'authenticated',
      'authenticated',
      'participant@vteki.local',
      crypt('participant123', gen_salt('bf')),
      v_now,
      v_now,
      NULL,
      NULL,
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Demo Participant","role":"participant"}'::jsonb,
      v_now,
      v_now,
      FALSE,
      NULL,
      NULL,
      NULL,
      NULL,
      FALSE,
      NULL
    )
  ON CONFLICT (email) DO UPDATE
    SET encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = EXCLUDED.email_confirmed_at,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        updated_at = EXCLUDED.updated_at;

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    u.id,
    jsonb_build_object(
      'sub', u.id::text,
      'email', u.email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    u.email,
    v_now,
    v_now,
    v_now
  FROM auth.users u
  WHERE u.email IN (
    'admin@vteki.local',
    'trainer@vteki.local',
    'trainer2@vteki.local',
    'corporate@vteki.local',
    'participant@vteki.local'
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;
END $$;
