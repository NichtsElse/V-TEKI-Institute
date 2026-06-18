/**
 * Purpose: Review, create, and verify invoice payments for the local MVP admin flow.
 * Used by: Admin route `/admin/payments`.
 * Main dependencies: Local app client, React Query mutations, shared table components, and shadcn dialog controls.
 * Public/main functions: Default `AdminPayments` page export.
 * Important side effects: Creates local invoice records, updates payment verification status, and writes admin notes.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Loader2, Plus } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function AdminPayments() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    registration_id: '',
    invoice_number: '',
    amount: '',
    invoice_status: 'issued',
    status: 'pending',
    payment_method: 'bank_transfer',
    payment_reference: '',
    notes: '',
  });
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: payments = [], isLoading } = useQuery({ queryKey: ['payments'], queryFn: () => appClient.entities.Payment.list('-created_date') });
  const { data: registrations = [] } = useQuery({ queryKey: ['registrations'], queryFn: () => appClient.entities.Registration.list() });
  const paidCount = payments.filter((payment) => payment.status === 'paid').length;
  const issuedInvoices = payments.filter((payment) => payment.invoice_status === 'issued').length;
  const totalPaid = payments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const createMutation = useMutation({
    mutationFn: async (form) => {
      const registration = registrations.find((entry) => entry.id === form.registration_id);
      const amount = Number(form.amount || 0);
      if (!registration) {
        throw new Error('Registration is required');
      }
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      const invoiceNumber = form.invoice_number || `INV-${new Date().getFullYear()}-${String(payments.length + 1).padStart(4, '0')}`;
      return appClient.entities.Payment.create({
        invoice_number: invoiceNumber,
        registration_id: registration.id,
        amount,
        invoice_status: form.invoice_status,
        status: form.status,
        payment_method: form.payment_method,
        payment_reference: form.payment_reference || '-',
        notes: form.notes || '',
        participant_name: registration.full_name,
        participant_email: registration.email,
        organization_name: registration.organization_name || '',
        program_name: registration.program_name || '',
        batch_name: registration.batch_name || '',
      });
    },
    onSuccess: async (payment, form) => {
      if (form?.registration_id && form?.status) {
        await appClient.entities.Registration.update(form.registration_id, {
          payment_status: form.status,
        });
      }
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['registrations'] });
      setCreateDialogOpen(false);
      setCreateForm({
        registration_id: '',
        invoice_number: '',
        amount: '',
        invoice_status: 'issued',
        status: 'pending',
        payment_method: 'bank_transfer',
        payment_reference: '',
        notes: '',
      });
      toast({ title: 'Invoice created successfully' });
      return payment;
    },
    onError: (error) => {
      toast({
        title: 'Could not create invoice',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Remove extra property before saving payment
      const paymentData = { ...data };
      delete paymentData.registration_status;
      
      const updated = await appClient.entities.Payment.update(id, paymentData);
      if (updated.registration_id && data.status) {
        const regUpdateData = {
          payment_status: data.status,
          status: data.registration_status || 'confirmed',
          enrollment_status: 'confirmed',
        };
        
        if (updated.registration_id.startsWith('corporateregistration_')) {
          await appClient.entities.CorporateRegistration.update(updated.registration_id, regUpdateData);
        } else {
          await appClient.entities.Registration.update(updated.registration_id, regUpdateData);
        }
      }
      return updated;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); setDialogOpen(false); toast({ title: 'Invoice payment updated' }); },
  });

  const verifyPayment = (payment) => {
    setSelected({
      ...payment,
      status: 'paid',
      invoice_status: 'paid',
      verified_date: new Date().toISOString().split('T')[0],
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
      registration_status: 'confirmed', // Explicitly note that registration should be confirmed
    });
    setDialogOpen(true);
  };

  const columns = [
    { header: 'Invoice', cell: (r) => <span className="font-medium font-mono text-xs">{r.invoice_number || '-'}</span> },
    { header: 'Participant', accessor: 'participant_name' },
    { header: 'Program', accessor: 'program_name' },
    { header: 'Organization', cell: (r) => <span className="text-xs">{r.organization_name || '-'}</span> },
    { header: 'Amount', cell: (r) => `IDR ${(r.amount || 0).toLocaleString()}` },
    { header: 'Invoice', cell: (r) => <StatusBadge status={r.invoice_status || 'issued'} /> },
    { header: 'Method', cell: (r) => <span className="text-xs capitalize">{r.payment_method?.replace(/_/g, ' ') || '-'}</span> },
    { header: 'Date', cell: (r) => r.payment_date ? format(new Date(r.payment_date), 'MMM d, yyyy') : '-' },
    { header: 'Payment', cell: (r) => <StatusBadge status={r.status} /> },
    { header: '', cell: (r) => (r.status === 'pending' || r.status === 'pending_verification') && (
      <Button variant="ghost" size="sm" className="h-7 text-xs text-success" onClick={(e) => { e.stopPropagation(); verifyPayment(r); }}>
        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verify
      </Button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Payments" subtitle={`${payments.length} invoice payment records`}>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-secondary hover:bg-secondary/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </PageHeader>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Paid Payments</p>
          <p className="mt-2 text-2xl font-bold font-heading">{paidCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Open Invoices</p>
          <p className="mt-2 text-2xl font-bold font-heading">{issuedInvoices}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Paid</p>
          <p className="mt-2 text-2xl font-bold font-heading">IDR {(totalPaid / 1000000).toFixed(1)}M</p>
        </div>
      </div>
      <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Use this queue to confirm payment proofs, settle invoice status, and unlock the next enrollment steps for each participant or corporate group.
      </div>
      <DataTable columns={columns} data={payments} isLoading={isLoading} emptyMessage="No payments found." />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Registration</Label>
              <Select value={createForm.registration_id} onValueChange={(value) => setCreateForm({ ...createForm, registration_id: value })}>
                <SelectTrigger><SelectValue placeholder="Select registration" /></SelectTrigger>
                <SelectContent>
                  {registrations.map((registration) => (
                    <SelectItem key={registration.id} value={registration.id}>
                      {registration.full_name} - {registration.program_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Invoice Number</Label>
                <input
                  value={createForm.invoice_number}
                  onChange={(e) => setCreateForm({ ...createForm, invoice_number: e.target.value })}
                  placeholder="Auto-generate if empty"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <Label>Amount</Label>
                <input
                  type="number"
                  min="0"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                  placeholder="3500000"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Invoice Status</Label>
                <Select value={createForm.invoice_status} onValueChange={(value) => setCreateForm({ ...createForm, invoice_status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Status</Label>
                <Select value={createForm.status} onValueChange={(value) => setCreateForm({ ...createForm, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Payment Method</Label>
                <Select value={createForm.payment_method} onValueChange={(value) => setCreateForm({ ...createForm, payment_method: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="virtual_account">Virtual Account</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Reference</Label>
                <input
                  value={createForm.payment_reference}
                  onChange={(e) => setCreateForm({ ...createForm, payment_reference: e.target.value })}
                  placeholder="Optional reference"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                placeholder="Optional invoice notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(createForm)}
              disabled={createMutation.isPending}
              className="bg-secondary hover:bg-secondary/90 text-white"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Verify Invoice Payment</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Invoice:</span> <span className="font-medium ml-1">{selected.invoice_number}</span></div>
                <div><span className="text-muted-foreground">Amount:</span> <span className="font-medium ml-1">IDR {(selected.amount || 0).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Participant:</span> <span className="font-medium ml-1">{selected.participant_name}</span></div>
                <div><span className="text-muted-foreground">Organization:</span> <span className="font-medium ml-1">{selected.organization_name || '-'}</span></div>
                <div><span className="text-muted-foreground">Reference:</span> <span className="font-medium ml-1">{selected.payment_reference || '-'}</span></div>
                <div><span className="text-muted-foreground">Verified:</span> <span className="font-medium ml-1">{selected.verified_date || '-'}</span></div>
              </div>
              <div><Label>Invoice Status</Label>
                <Select value={selected.invoice_status || 'issued'} onValueChange={v => setSelected({...selected, invoice_status: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Payment Status</Label>
                <Select value={selected.status} onValueChange={v => setSelected({...selected, status: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem><SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem><SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea value={selected.notes || ''} onChange={e => setSelected({...selected, notes: e.target.value})} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: selected.id, data: { status: selected.status, invoice_status: selected.invoice_status, notes: selected.notes, verified_date: selected.verified_date, payment_date: selected.payment_date } })} className="bg-secondary hover:bg-secondary/90 text-white">
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
