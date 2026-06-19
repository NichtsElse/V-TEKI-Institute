/**
 * Purpose: Manage delivery batches, schedules, and trainer assignments for the admin dashboard.
 * Used by: Admin route `/admin/batches`.
 * Main dependencies: App client entity APIs, React Query mutations, shared data table components, and router navigation.
 * Public/main functions: Default `AdminBatches` page export.
 * Important side effects: Reads, creates, updates, and deletes batch records in the active data store.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const emptyBatch = { name: '', program_id: '', start_date: '', end_date: '', capacity: 30, trainer_id: '', trainer_name: '', venue: '', meeting_link: '', status: 'draft' };

export default function AdminBatches() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyBatch);
  const [editId, setEditId] = useState(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: batches = [], isLoading } = useQuery({ queryKey: ['batches'], queryFn: () => appClient.entities.Batch.list('-created_date') });
  const { data: programs = [] } = useQuery({ queryKey: ['programs'], queryFn: () => appClient.entities.Program.list() });
  const { data: trainers = [] } = useQuery({ queryKey: ['trainers'], queryFn: () => appClient.entities.Trainer.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => editId ? appClient.entities.Batch.update(editId, data) : appClient.entities.Batch.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); setDialogOpen(false); toast({ title: editId ? 'Batch updated' : 'Batch created' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.Batch.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); toast({ title: 'Batch deleted' }); },
  });

  const openCreate = () => { setForm(emptyBatch); setEditId(null); setDialogOpen(true); };
  const openEdit = (b) => { setForm({ ...emptyBatch, ...b }); setEditId(b.id); setDialogOpen(true); };
  const openBatches = batches.filter((batch) => batch.status === 'open');
  const totalSeats = batches.reduce((sum, batch) => sum + (batch.capacity || 0), 0);
  const totalEnrolled = batches.reduce((sum, batch) => sum + (batch.enrolled_count || 0), 0);

  const columns = [
    { header: 'Batch', cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: 'Program', accessor: 'program_name' },
    { header: 'Start', cell: (r) => r.start_date ? format(new Date(r.start_date), 'MMM d, yyyy') : '-' },
    { header: 'End', cell: (r) => r.end_date ? format(new Date(r.end_date), 'MMM d, yyyy') : '-' },
    { header: 'Trainer', accessor: 'trainer_name' },
    { header: 'Enrolled', cell: (r) => `${r.enrolled_count || 0}/${r.capacity || '-'}` },
    { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
    { header: '', cell: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary" onClick={(e) => { e.stopPropagation(); navigate(`/admin/batches/${r.id}`); }}><Eye className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Pencil className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    )},
  ];

  const handleSave = () => {
    const selectedProgram = programs.find(p => p.id === form.program_id);
    const selectedTrainer = trainers.find(t => t.id === form.trainer_id);
    const { id: _id, created_date: _createdDate, updated_date: _updatedDate, created_by_id: _createdById, ...data } = {
      ...form,
      program_name: selectedProgram?.name || form.program_name,
      trainer_name: selectedTrainer?.full_name || form.trainer_name,
    };
    saveMutation.mutate(data);
  };

  return (
    <div>
      <PageHeader title="Batches" subtitle={`${batches.length} batches`}>
        <Button onClick={openCreate} className="bg-secondary hover:bg-secondary/90 text-white"><Plus className="w-4 h-4 mr-2" /> New Batch</Button>
      </PageHeader>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Open Batches</p>
          <p className="mt-2 text-2xl font-bold font-heading">{openBatches.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Seats Planned</p>
          <p className="mt-2 text-2xl font-bold font-heading">{totalSeats}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Current Enrollments</p>
          <p className="mt-2 text-2xl font-bold font-heading">{totalEnrolled}</p>
        </div>
      </div>

      <DataTable columns={columns} data={batches} isLoading={isLoading} onRowClick={openEdit} emptyMessage="No batches yet." />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Batch' : 'New Batch'}</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Label>Batch Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="sm:col-span-2"><Label>Program *</Label>
              <Select value={form.program_id} onValueChange={v => setForm({...form, program_id: v})}><SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
            <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} /></div>
            <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value) || 0})} /></div>
            <div className="sm:col-span-2"><Label>Trainer</Label>
              <Select value={form.trainer_id} onValueChange={v => setForm({...form, trainer_id: v})}><SelectTrigger><SelectValue placeholder="Select trainer" /></SelectTrigger>
                <SelectContent>{trainers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Venue</Label><Input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} /></div>
            <div><Label>Meeting Link</Label><Input value={form.meeting_link} onChange={e => setForm({...form, meeting_link: e.target.value})} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="closed">Closed</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-secondary hover:bg-secondary/90 text-white">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
