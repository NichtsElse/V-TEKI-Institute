/**
 * Purpose: Create or update all local demo `@vteki.local` auth users in Supabase Auth.
 * Used by: Local setup sessions that want demo credentials available in Supabase Auth.
 * Main dependencies: dotenv, @supabase/supabase-js, and `.env.local` service-role credentials.
 * Public/main functions: Script entry point.
 * Important side effects: Creates or updates Supabase Auth users and syncs matching `users_profile` metadata by email.
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local', quiet: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const demoUsers = [
  {
    email: 'admin@vteki.local',
    password: 'admin123',
    full_name: 'Demo Admin',
    role: 'academy_admin',
    phone: '021-555-0001',
    status: 'active',
  },
  {
    email: 'superadmin@vteki.local',
    password: 'superadmin123',
    full_name: 'Super Admin',
    role: 'super_admin',
    phone: '021-555-0002',
    status: 'active',
  },
  {
    email: 'trainer@vteki.local',
    password: 'trainer123',
    full_name: 'Nadia Pratama',
    role: 'trainer',
    phone: '081300000001',
    status: 'active',
  },
  {
    email: 'rafael.mahendra@vteki.local',
    password: 'welcome123',
    full_name: 'Rafael Mahendra',
    role: 'trainer',
    phone: '081300000002',
    status: 'active',
  },
  {
    email: 'salma.wijaya@vteki.local',
    password: 'welcome123',
    full_name: 'Salma Wijaya',
    role: 'trainer',
    phone: '081300000003',
    status: 'active',
  },
  {
    email: 'budi.santoso@vteki.local',
    password: 'welcome123',
    full_name: 'Budi Santoso',
    role: 'trainer',
    phone: '081300000004',
    status: 'active',
  },
  {
    email: 'corporate@vteki.local',
    password: 'corporate123',
    full_name: 'Rizky Ananta',
    role: 'corporate_pic',
    phone: '021-555-0100',
    status: 'active',
    organization_id: 'org_stn',
    organization_name: 'PT Solusi Transformasi Nusantara',
  },
  {
    email: 'pic.bni@vteki.local',
    password: 'welcome123',
    full_name: 'Andi Susanto',
    role: 'corporate_pic',
    phone: '021-555-0101',
    status: 'active',
    organization_id: 'org_bni',
    organization_name: 'Bank Negara Indonesia',
  },
  {
    email: 'participant@vteki.local',
    password: 'participant123',
    full_name: 'Demo Participant',
    role: 'participant',
    phone: '081234567890',
    status: 'active',
  },
];

const findAuthUserByEmail = async (email) => {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users || [];
    const matchedUser = users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (matchedUser) return matchedUser;
    if (users.length < perPage) return null;
    page += 1;
  }
};

const syncUsersProfile = async (authUserId, demoUser) => {
  const { data: existingProfile, error: profileError } = await supabase
    .from('users_profile')
    .select('*')
    .eq('email', demoUser.email)
    .maybeSingle();

  if (profileError) throw profileError;

  const nextProfile = {
    id: existingProfile?.id || authUserId,
    email: demoUser.email,
    full_name: demoUser.full_name,
    phone: demoUser.phone,
    role: demoUser.role,
    organization_id: demoUser.organization_id || null,
    organization_name: demoUser.organization_name || null,
    status: demoUser.status,
    password: demoUser.password,
    created_date: existingProfile?.created_date || new Date().toISOString(),
    updated_date: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase.from('users_profile').upsert(nextProfile, { onConflict: 'id' });
  if (upsertError) throw upsertError;
};

for (const demoUser of demoUsers) {
  const existingAuthUser = await findAuthUserByEmail(demoUser.email);

  let authUserId = existingAuthUser?.id;
  if (existingAuthUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingAuthUser.id, {
      password: demoUser.password,
      email_confirm: true,
      user_metadata: {
        full_name: demoUser.full_name,
        role: demoUser.role,
        phone: demoUser.phone,
        organization_id: demoUser.organization_id || null,
        organization_name: demoUser.organization_name || null,
        status: demoUser.status,
      },
    });
    if (error) throw error;
    authUserId = data.user.id;
    console.log(`updated auth user ${demoUser.email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: demoUser.email,
      password: demoUser.password,
      email_confirm: true,
      user_metadata: {
        full_name: demoUser.full_name,
        role: demoUser.role,
        phone: demoUser.phone,
        organization_id: demoUser.organization_id || null,
        organization_name: demoUser.organization_name || null,
        status: demoUser.status,
      },
    });
    if (error) throw error;
    authUserId = data.user.id;
    console.log(`created auth user ${demoUser.email}`);
  }

  await syncUsersProfile(authUserId, demoUser);
}

console.log(`synced ${demoUsers.length} demo auth users`);
