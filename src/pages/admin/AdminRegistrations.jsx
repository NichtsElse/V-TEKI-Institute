/**
 * Purpose: Review and update participant enrollments for the local MVP admin experience.
 * Used by: Admin route `/admin/registrations`.
 * Main dependencies: Local app client, React Query mutations, shared data table, and shadcn dialog/select controls.
 * Public/main functions: Default `AdminRegistrations` page export.
 * Important side effects: Updates local enrollment status, payment status, and completion state.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pencil, Users, CheckCircle, Clock, CreditCard } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { useToast } from '@/components/ui/use-toast';

export default function AdminRegistrations() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: registrations = [], isLoading } = useQuery({ queryKey: ['registrations'], queryFn: () => appClient.entities.Registration.list('-created_date') });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appClient.entities.Registration.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['registrations'] }); setDialogOpen(false); toast({ title: 'Enrollment updated' }); },
  });

  const filtered = registrations.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchPayment = paymentFilter === 'all' || r.payment_status === paymentFilter;
    return matchStatus && matchPayment;
  });

  const confirmedCount = registrations.filter(r => r.status === 'confirmed').length;
  const waitingPaymentCount = registrations.filter(r => r.payment_status === 'pending' || r.payment_status === 'waiting_payment').length;
  const inProgressCount = registrations.filter(r => r.completion_status === 'in_progress').length;
  const completedCount = registrations.filter(r => r.completion_status === 'completed').length;

  const columns = [
    { header: 'Name', cell: (r) => <span className="font-medium">{r.full_name}</span> },
    { header: 'Program', accessor: 'program_name' },
    { header: 'Batch', accessor: 'batch_name' },
    { header: 'Type', cell: (r) => <span className="text-xs capitalize">{r.registration_type || 'individual'}</span> },
    { header: 'Enrollment', cell: (r) => <StatusBadge status={r.status} /> },
    { header: 'Payment', cell: (r) => <StatusBadge status={r.payment_status} /> },
    { header: 'Completion', cell: (r) => <StatusBadge status={r.completion_status} /> },
    { header: 'Attendance', cell: (r) => <span className="text-xs">{r.attendance_percentage != null ? `${r.attendance_percentage}%` : '-'}</span> },
    { header: '', cell: (r) => (
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelected(r); setDialogOpen(true); }}>
        <Pencil className="w-3.5 h-3.5" />
      </Button>
    )},
  ];

  const summaryCards = [
    { label: 'Confirmed', value: confirmedCount, icon: CheckCircle, color: 'text-success' },
    { label: 'Waiting Payment', value: waitingPaymentCount, icon: CreditCard, color: 'text-warning' },
    { label: 'In Progress', value: inProgressCount, icon: Clock, color: 'text-secondary' },
    { label: 'Completed', value: completedCount, icon: Users, color: 'text-accent' },
  ];

  return (
    <div>
      <PageHeader title="Enrollments" subtitle={`${registrations.length} participant records`}>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Payment status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="waiting_payment">Waiting Payment</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(card => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
            <card.icon className={`w-5 h-5 mt-0.5 ${card.color}`} />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-bold font-heading">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No enrollments found." />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Enrollment</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium ml-1">{selected.full_name}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium ml-1">{selected.email}</span></div>
                <div><span className="text-muted-foreground">Program:</span> <span className="font-medium ml-1">{selected.program_name}</span></div>
                <div><span className="text-muted-foreground">Type:</span> <span className="font-medium ml-1 capitalize">{selected.registration_type || 'individual'}</span></div>
              </div>
              <div><Label>Enrollment Status</Label>
                <Select value={selected.status} onValueChange={v => setSelected({...selected, status: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem><SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="waiting_payment">Waiting Payment</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Payment Status</Label>
                <Select value={selected.payment_status || 'pending'} onValueChange={v => setSelected({...selected, payment_status: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Completion Status</Label>
                <Select value={selected.completion_status || 'not_started'} onValueChange={v => setSelected({...selected, completion_status: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem><SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem><SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Attendance Percentage</Label>
                <Select value={String(selected.attendance_percentage ?? 0)} onValueChange={v => setSelected({...selected, attendance_percentage: parseInt(v) || 0})}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="72">72%</SelectItem>
                    <SelectItem value="80">80%</SelectItem>
                    <SelectItem value="92">92%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: selected.id, data: { status: selected.status, payment_status: selected.payment_status, completion_status: selected.completion_status, attendance_percentage: selected.attendance_percentage } })} className="bg-secondary hover:bg-secondary/90 text-white">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
