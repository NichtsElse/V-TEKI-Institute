/**
 * Purpose: Present a corporate PIC dashboard for managed participants, invoices, and completion readiness.
 * Used by: Corporate route `/corporate/dashboard`.
 * Main dependencies: Local app client, auth context, React Query, corporate scope helper, shared page header, and stats cards.
 * Public/main functions: Default `CorporateDashboard` page export.
 * Important side effects: Reads local registration and payment records scoped to the signed-in organization.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, CreditCard, Award, BriefcaseBusiness } from 'lucide-react';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/shared/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveCorporateOrganizationName } from '@/domain/corporate/scope';

export default function CorporateDashboard() {
  const { user } = useAuth();
  const { data: registrations = [] } = useQuery({ queryKey: ['corporate-registrations'], queryFn: () => appClient.entities.Registration.list() });
  const { data: payments = [] } = useQuery({ queryKey: ['corporate-payments'], queryFn: () => appClient.entities.Payment.list() });
  const organizationName = resolveCorporateOrganizationName(user, registrations, payments);

  const corporateRegistrations = registrations.filter((registration) => 
    registration.organization_name === organizationName || 
    (user?.id && registration.user_id === user.id)
  );
  const corporatePayments = payments.filter((payment) => payment.organization_name === organizationName);
  const readyCertificates = corporateRegistrations.filter((registration) => appClient.isCertificateEligible(registration));
  const totalPaid = corporatePayments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const hasOrganizationData = Boolean(organizationName && (corporateRegistrations.length > 0 || corporatePayments.length > 0));

  return (
    <div>
      <PageHeader
        title="Corporate Dashboard"
        subtitle={`Managed participant overview for ${organizationName || 'your organization'}`}
      />

      {!hasOrganizationData && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          No corporate records were found for this account yet. The seeded demo data is tied to a matching organization profile.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Participants" value={corporateRegistrations.length} icon={Users} iconClassName="bg-secondary/10 text-secondary" />
        <StatsCard title="Paid Invoices" value={corporatePayments.filter((payment) => payment.status === 'paid').length} icon={CreditCard} iconClassName="bg-success/10 text-success" />
        <StatsCard title="Certificate Ready" value={readyCertificates.length} icon={Award} iconClassName="bg-warning/10 text-warning" />
        <StatsCard title="Total Paid" value={`IDR ${(totalPaid / 1000000).toFixed(1)}M`} icon={BriefcaseBusiness} iconClassName="bg-accent/10 text-accent" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Corporate Participants</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {corporateRegistrations.map((registration) => (
              <div key={registration.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{registration.full_name}</p>
                  <p className="text-xs text-muted-foreground">{registration.program_name}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{registration.status}</p>
                  <p>{registration.attendance_percentage || 0}% attendance</p>
                </div>
              </div>
            ))}
            {corporateRegistrations.length === 0 && <p className="text-sm text-muted-foreground">No corporate participants yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Open Invoice Attention</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {corporatePayments.filter((payment) => payment.status !== 'paid').map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{payment.invoice_number || payment.id}</p>
                  <p className="text-xs text-muted-foreground">{payment.participant_name}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>IDR {(payment.amount || 0).toLocaleString()}</p>
                  <p>{payment.status}</p>
                </div>
              </div>
            ))}
            {corporatePayments.filter((payment) => payment.status !== 'paid').length === 0 && (
              <p className="text-sm text-muted-foreground">All current corporate invoices are settled.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
