/**
 * Purpose: Manage trainer profiles for the local MVP admin experience.
 * Used by: Admin route `/admin/trainers`.
 * Main dependencies: Local app client, React Query mutations, and shared data table components.
 * Public/main functions: Default `AdminTrainers` page export.
 * Important side effects: Creates, updates, and deletes local trainer records.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { useToast } from '@/components/ui/use-toast';

const emptyTrainer = { full_name: '', bio: '', expertise: '', experience_years: 0, linkedin_url: '', status: 'active' };

export default function AdminTrainers() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyTrainer);
  const [editId, setEditId] = useState(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: trainers = [], isLoading } = useQuery({ queryKey: ['trainers'], queryFn: () => appClient.entities.Trainer.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => editId ? appClient.entities.Trainer.update(editId, data) : appClient.entities.Trainer.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trainers'] }); setDialogOpen(false); toast({ title: editId ? 'Trainer updated' : 'Trainer added' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.Trainer.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trainers'] }); toast({ title: 'Trainer removed' }); },
  });

  const openCreate = () => { setForm(emptyTrainer); setEditId(null); setDialogOpen(true); };
  const openEdit = (t) => { setForm({ ...emptyTrainer, ...t }); setEditId(t.id); setDialogOpen(true); };
  const activeTrainers = trainers.filter((trainer) => trainer.status === 'active');
  const averageExperience = trainers.length > 0
    ? Math.round(trainers.reduce((sum, trainer) => sum + (trainer.experience_years || 0), 0) / trainers.length)
    : 0;

  const columns = [
    { header: 'Name', cell: (r) => <span className="font-medium">{r.full_name}</span> },
    { header: 'Expertise', accessor: 'expertise' },
    { header: 'Experience', cell: (r) => r.experience_years ? `${r.experience_years} years` : '-' },
    { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
    { header: '', cell: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Pencil className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    )},
  ];

  const handleSave = () => {
    const { id: _id, created_date: _createdDate, updated_date: _updatedDate, created_by_id: _createdById, ...data } = form;
    saveMutation.mutate(data);
  };

  return (
    <div>
      <PageHeader title="Trainers" subtitle={`${trainers.length} trainers`}>
        <Button onClick={openCreate} className="bg-secondary hover:bg-secondary/90 text-white"><Plus className="w-4 h-4 mr-2" /> Add Trainer</Button>
      </PageHeader>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Active Trainers</p>
          <p className="mt-2 text-2xl font-bold font-heading">{activeTrainers.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Average Experience</p>
          <p className="mt-2 text-2xl font-bold font-heading">{averageExperience} yrs</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Specialist Areas</p>
          <p className="mt-2 text-sm font-semibold">{trainers.slice(0, 2).map((trainer) => trainer.expertise).filter(Boolean).join(' / ') || '-'}</p>
        </div>
      </div>

      <DataTable columns={columns} data={trainers} isLoading={isLoading} onRowClick={openEdit} emptyMessage="No trainers yet." />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Trainer' : 'Add Trainer'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
            <div><Label>Expertise</Label><Input value={form.expertise} onChange={e => setForm({...form, expertise: e.target.value})} /></div>
            <div><Label>Experience (years)</Label><Input type="number" value={form.experience_years} onChange={e => setForm({...form, experience_years: parseInt(e.target.value) || 0})} /></div>
            <div><Label>Bio</Label><Textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} /></div>
            <div><Label>LinkedIn URL</Label><Input value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-secondary hover:bg-secondary/90 text-white">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editId ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
