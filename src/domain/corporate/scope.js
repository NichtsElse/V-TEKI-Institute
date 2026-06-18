/**
 * Purpose: Resolve the effective corporate organization scope for corporate-facing pages.
 * Used by: Corporate dashboard, participants, and invoices pages.
 * Main dependencies: None.
 * Public/main functions: `resolveCorporateOrganizationName`.
 * Important side effects: None.
 */
export const resolveCorporateOrganizationName = (user, registrations = [], payments = []) => {
  if (user?.organization_name || user?.company) {
    return user.organization_name || user.company;
  }

  const normalizedUserEmail = user?.email?.toLowerCase();
  if (!normalizedUserEmail) {
    return '';
  }

  const corporateUserRegistration = registrations.find(
    (registration) =>
      registration.registration_type === 'corporate' &&
      registration.email?.toLowerCase() === normalizedUserEmail &&
      registration.organization_name,
  );

  if (corporateUserRegistration?.organization_name) {
    return corporateUserRegistration.organization_name;
  }

  const registrationMatch = registrations.find(
    (registration) =>
      registration.registration_type === 'corporate' &&
      registration.organization_name,
  );

  if (registrationMatch?.organization_name) {
    return registrationMatch.organization_name;
  }

  const paymentMatch = payments.find((payment) => payment.organization_name);
  return paymentMatch?.organization_name || '';
};
