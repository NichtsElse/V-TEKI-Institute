/**
 * Purpose: Define shared role routing and role helpers for the V-TEKI MVP frontend.
 * Used by: Auth-aware navigation, route redirects, and future authorization helpers.
 * Main dependencies: None.
 * Public/main functions: `ROLE_HOME_PATHS`, `getRoleHomePath`, and `isAdminRole`.
 * Important side effects: None.
 */
export const ROLE_HOME_PATHS = {
  super_admin: '/admin/dashboard',
  academy_admin: '/admin/dashboard',
  admin: '/admin/dashboard',
  trainer: '/trainer/dashboard',
  corporate_pic: '/corporate/dashboard',
  participant: '/participant/dashboard',
  user: '/participant/dashboard',
};

export const getRoleHomePath = (role = 'participant') => ROLE_HOME_PATHS[role] || ROLE_HOME_PATHS.participant;

export const isAdminRole = (role) => ['admin', 'academy_admin', 'super_admin'].includes(role);
