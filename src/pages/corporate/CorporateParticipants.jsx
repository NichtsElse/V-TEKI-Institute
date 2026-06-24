/**
 * Purpose: List corporate-managed participant enrollments in a role-specific view.
 * Used by: Corporate route `/corporate/registrations`.
 * Main dependencies: Local app client, auth context, React Query, corporate scope helper, and shared page header.
 * Public/main functions: Default `CorporateParticipants` page export.
 * Important side effects: Reads local registration records scoped to the signed-in organization.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { resolveCorporateOrganizationName } from '@/domain/corporate/scope';

export default function CorporateParticipants() {
  const { user } = useAuth();
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['corporate-participant-list'],
    queryFn: () => appClient.entities.Registration.list('-created_date'),
  });
  const organizationName = resolveCorporateOrganizationName(user, registrations, []);

  const filtered = registrations.filter(
    (registration) =>
      registration.registration_type === 'corporate' &&
      registration.organization_name === organizationName,
  );
  const columns = [
    { header: 'Participant', cell: (row) => <span className="font-medium">{row.full_name}</span> },
    { header: 'Program', accessor: 'program_name' },
    { header: 'Type', cell: (row) => <span className="capitalize text-xs">{row.registration_type || 'individual'}</span> },
    { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { header: 'Completion', cell: (row) => <StatusBadge status={row.completion_status} /> },
    { header: 'Certificate', cell: (row) => <StatusBadge status={appClient.isCertificateEligible(row) ? 'eligible' : 'pending'} /> },
  ];

  return (
    <div>
      <PageHeader title="Corporate Participants" subtitle={`${filtered.length} managed enrollments`} />
      <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No corporate participant records found." />
    </div>
  );
}
