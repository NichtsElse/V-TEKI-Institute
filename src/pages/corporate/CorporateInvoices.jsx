/**
 * Purpose: List corporate invoice and payment records in a role-specific view.
 * Used by: Corporate route `/corporate/invoices`.
 * Main dependencies: Local app client, auth context, React Query, corporate scope helper, shared page header, and data table.
 * Public/main functions: Default `CorporateInvoices` page export.
 * Important side effects: Reads local payment records scoped to the signed-in organization.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { resolveCorporateOrganizationName } from '@/domain/corporate/scope';

export default function CorporateInvoices() {
  const { user } = useAuth();
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['corporate-invoices'],
    queryFn: () => appClient.entities.Payment.list('-created_date'),
  });
  const organizationName = resolveCorporateOrganizationName(user, [], payments);

  const filtered = payments.filter((payment) => payment.organization_name === organizationName);
  const openInvoices = filtered.filter((payment) => payment.invoice_status === 'issued').length;
  const paidInvoices = filtered.filter((payment) => payment.status === 'paid').length;
  const columns = [
    { header: 'Invoice', cell: (row) => <span className="font-mono text-xs font-medium">{row.invoice_number || '-'}</span> },
    { header: 'Participant', accessor: 'participant_name' },
    { header: 'Program', accessor: 'program_name' },
    { header: 'Amount', cell: (row) => `IDR ${(row.amount || 0).toLocaleString()}` },
    { header: 'Invoice', cell: (row) => <StatusBadge status={row.invoice_status || 'issued'} /> },
    { header: 'Payment', cell: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      cell: (row) => {
        if (row.status === 'pending_verification') {
          return <span className="text-xs text-muted-foreground italic">Verifying...</span>;
        }
        return null;
      }
    },
  ];

  return (
    <div>
      <PageHeader title="Corporate Invoices" subtitle={`${filtered.length} invoices`} />
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Open Invoices</p>
          <p className="mt-2 text-2xl font-bold font-heading">{openInvoices}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Paid Invoices</p>
          <p className="mt-2 text-2xl font-bold font-heading">{paidInvoices}</p>
        </div>
      </div>
      <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No corporate invoices found." />
    </div>
  );
}
