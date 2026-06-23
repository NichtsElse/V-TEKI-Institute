-- Purpose: Seed Supabase Auth users for the demo accounts used by the V-TEKI application.
-- Used by: Supabase SQL Editor or migration runner before testing Supabase-first login flows.
-- Main dependencies: auth.users and auth.identities in Supabase Auth, plus pgcrypto for password hashing.

-- 1. Hapus data dummy lama (jika ada) agar tidak bentrok
DELETE FROM auth.users WHERE email IN (
  'admin@vteki.local', 
  'trainer@vteki.local', 
  'trainer2@vteki.local', 
  'corporate@vteki.local', 
  'participant@vteki.local'
);

-- 2. Insert ulang dengan UUID statis dan schema extensions eksplisit
-- Admin
INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@vteki.local', extensions.crypt('admin123', extensions.gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Admin","role":"academy_admin"}'::jsonb, NOW(), NOW());

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', jsonb_build_object('sub', '00000000-0000-0000-0000-000000000001', 'email', 'admin@vteki.local', 'email_verified', true, 'phone_verified', false), 'email', '00000000-0000-0000-0000-000000000001', NOW(), NOW(), NOW());

-- Trainer
INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'trainer@vteki.local', extensions.crypt('trainer123', extensions.gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Dr. Idha Kristiana, S.Kom., MMSI., SMIEEE","role":"trainer"}'::jsonb, NOW(), NOW());

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', jsonb_build_object('sub', '00000000-0000-0000-0000-000000000002', 'email', 'trainer@vteki.local', 'email_verified', true, 'phone_verified', false), 'email', '00000000-0000-0000-0000-000000000002', NOW(), NOW(), NOW());

-- Trainer 2
INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'trainer2@vteki.local', extensions.crypt('trainer123', extensions.gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Nadia Pratama","role":"trainer"}'::jsonb, NOW(), NOW());

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', jsonb_build_object('sub', '00000000-0000-0000-0000-000000000003', 'email', 'trainer2@vteki.local', 'email_verified', true, 'phone_verified', false), 'email', '00000000-0000-0000-0000-000000000003', NOW(), NOW(), NOW());

-- Corporate
INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'corporate@vteki.local', extensions.crypt('corporate123', extensions.gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Rizky Ananta","role":"corporate_pic"}'::jsonb, NOW(), NOW());

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000004', jsonb_build_object('sub', '00000000-0000-0000-0000-000000000004', 'email', 'corporate@vteki.local', 'email_verified', true, 'phone_verified', false), 'email', '00000000-0000-0000-0000-000000000004', NOW(), NOW(), NOW());

-- Participant
INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'participant@vteki.local', extensions.crypt('participant123', extensions.gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Participant","role":"participant"}'::jsonb, NOW(), NOW());

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', jsonb_build_object('sub', '00000000-0000-0000-0000-000000000005', 'email', 'participant@vteki.local', 'email_verified', true, 'phone_verified', false), 'email', '00000000-0000-0000-0000-000000000005', NOW(), NOW(), NOW());
