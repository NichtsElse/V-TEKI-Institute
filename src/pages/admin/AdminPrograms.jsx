/**
 * Purpose: Manage program catalog data for the local MVP admin experience.
 * Used by: Admin route `/admin/programs`.
 * Main dependencies: Local app client, React Query mutations, and shared data table components.
 * Public/main functions: Default `AdminPrograms` page export.
 * Important side effects: Creates, updates, and deletes local program records.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { useToast } from '@/components/ui/use-toast';

const typeLabels = { webinar: 'Webinar', workshop: 'Workshop', bootcamp: 'Bootcamp', certification: 'Certification', corporate_training: 'Corporate', executive_program: 'Executive' };
const modeLabels = { online: 'Online', offline: 'Offline', hybrid: 'Hybrid' };

const emptyProgram = { name: '', code: '', description: '', learning_objectives: '', program_type: 'workshop', delivery_mode: 'online', duration_hours: 0, price: 0, capacity: 30, status: 'draft', level: 'beginner', passing_score: 70, min_attendance_pct: 80 };

export default function AdminPrograms() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyProgram);
  const [editId, setEditId] = useState(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: programs = [], isLoading } = useQuery({ queryKey: ['programs'], queryFn: () => appClient.entities.Program.list('-created_date') });

  const saveMutation = useMutation({
    mutationFn: (data) => editId ? appClient.entities.Program.update(editId, data) : appClient.entities.Program.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['programs'] }); setDialogOpen(false); toast({ title: editId ? 'Program updated' : 'Program created' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.Program.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['programs'] }); toast({ title: 'Program deleted' }); },
  });

  const openCreate = () => { setForm(emptyProgram); setEditId(null); setDialogOpen(true); };
  const openEdit = (p) => { setForm({ ...emptyProgram, ...p }); setEditId(p.id); setDialogOpen(true); };
  const publishedPrograms = programs.filter((program) => program.status === 'published');
  const averagePrice = programs.length > 0 ? Math.round(programs.reduce((sum, program) => sum + (program.price || 0), 0) / programs.length) : 0;

  const columns = [
    { header: 'Name', cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: 'Code', accessor: 'code' },
    { header: 'Type', cell: (r) => <span className="text-xs">{typeLabels[r.program_type] || r.program_type}</span> },
    { header: 'Mode', cell: (r) => <span className="text-xs">{modeLabels[r.delivery_mode] || r.delivery_mode}</span> },
    { header: 'Price', cell: (r) => r.price ? `IDR ${r.price.toLocaleString()}` : 'Free' },
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
      <PageHeader title="Programs" subtitle={`${programs.length} programs`}>
        <Button onClick={openCreate} className="bg-secondary hover:bg-secondary/90 text-white"><Plus className="w-4 h-4 mr-2" /> New Program</Button>
      </PageHeader>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Published</p>
          <p className="mt-2 text-2xl font-bold font-heading">{publishedPrograms.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Draft / Archive</p>
          <p className="mt-2 text-2xl font-bold font-heading">{programs.length - publishedPrograms.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Average Fee</p>
          <p className="mt-2 text-2xl font-bold font-heading">IDR {averagePrice.toLocaleString()}</p>
        </div>
      </div>

      <DataTable columns={columns} data={programs} isLoading={isLoading} onRowClick={openEdit} emptyMessage="No programs yet. Create your first program." />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Program' : 'New Program'}</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Program Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><Label>Program Code *</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
            <div className="sm:col-span-2"><Label>Learning Objectives</Label><Textarea value={form.learning_objectives} onChange={e => setForm({...form, learning_objectives: e.target.value})} rows={3} placeholder="One objective per line" /></div>
            <div><Label>Type</Label>
              <Select value={form.program_type} onValueChange={v => setForm({...form, program_type: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(typeLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Mode</Label>
              <Select value={form.delivery_mode} onValueChange={v => setForm({...form, delivery_mode: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(modeLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Level</Label>
              <Select value={form.level} onValueChange={v => setForm({...form, level: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem><SelectItem value="executive">Executive</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Duration (hours)</Label><Input type="number" value={form.duration_hours} onChange={e => setForm({...form, duration_hours: parseFloat(e.target.value) || 0})} /></div>
            <div><Label>Price (IDR)</Label><Input type="number" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} /></div>
            <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value) || 0})} /></div>
            <div><Label>Passing Score (%)</Label><Input type="number" value={form.passing_score} onChange={e => setForm({...form, passing_score: parseInt(e.target.value) || 70})} /></div>
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
