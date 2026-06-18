/**
 * Purpose: Manage pre/post assessments for the local MVP admin assessment flow.
 * Used by: Admin route `/admin/assessments`.
 * Main dependencies: Local app client, React Query mutations, shared table components, and shadcn dialogs.
 * Public/main functions: Default `AdminAssessments` page export.
 * Important side effects: Creates, updates, and deletes local assessment configuration records.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, CheckCircle, List } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { useToast } from '@/components/ui/use-toast';

const emptyAssessment = { title: '', batch_id: '', assessment_type: 'pre_assessment', question_type: 'multiple_choice', total_points: 100, passing_score: 70, duration_minutes: 60, status: 'draft' };

export default function AdminAssessments() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyAssessment);
  const [editId, setEditId] = useState(null);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: assessments = [], isLoading } = useQuery({ queryKey: ['assessments'], queryFn: () => appClient.entities.Assessment.list('-created_date') });
  const { data: batches = [] } = useQuery({ queryKey: ['batches'], queryFn: () => appClient.entities.Batch.list() });
  const { data: results = [] } = useQuery({ queryKey: ['assessment-results'], queryFn: () => appClient.entities.AssessmentResult.list('-submission_date') });
  const { data: registrations = [] } = useQuery({ queryKey: ['registrations'], queryFn: () => appClient.entities.Registration.list() });
  const publishedCount = assessments.filter((assessment) => assessment.status === 'published').length;
  const postAssessmentCount = assessments.filter((assessment) => assessment.assessment_type === 'post_assessment').length;
  const reviewedResults = results.filter((result) => result.status === 'reviewed').length;

  const saveMutation = useMutation({
    mutationFn: (data) => editId ? appClient.entities.Assessment.update(editId, data) : appClient.entities.Assessment.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assessments'] }); setDialogOpen(false); toast({ title: editId ? 'Assessment updated' : 'Assessment created' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.Assessment.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assessments'] }); toast({ title: 'Assessment deleted' }); },
  });

  const simulateGradingMutation = useMutation({
    mutationFn: async (assessment) => {
      const batchRegs = registrations.filter(r => r.batch_id === assessment.batch_id && (r.status === 'confirmed' || r.payment_status === 'paid'));
      for (const reg of batchRegs) {
        if (assessment.assessment_type === 'post_assessment') {
          await appClient.entities.Registration.update(reg.id, {
            post_assessment_status: 'completed',
            post_assessment_score: 85, // Mock score
            completion_status: 'completed',
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registrations'] });
      toast({ title: 'Mock grading simulation completed' });
    },
  });

  const openCreate = () => { setForm(emptyAssessment); setEditId(null); setDialogOpen(true); };
  const openEdit = (a) => { setForm({ ...emptyAssessment, ...a }); setEditId(a.id); setDialogOpen(true); };

  const columns = [
    { header: 'Title', cell: (r) => <span className="font-medium">{r.title}</span> },
    { header: 'Type', cell: (r) => <span className="text-xs capitalize">{r.assessment_type?.replace(/_/g, ' ')}</span> },
    { header: 'Format', cell: (r) => <span className="text-xs capitalize">{r.question_type?.replace(/_/g, ' ')}</span> },
    { header: 'Points', accessor: 'total_points' },
    { header: 'Pass Score', cell: (r) => `${r.passing_score || 70}%` },
    { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
    { header: '', cell: (r) => (
      <div className="flex gap-1 justify-end">
        {r.assessment_type === 'post_assessment' && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-success" title="Simulate Grading" onClick={(e) => { e.stopPropagation(); simulateGradingMutation.mutate(r); }}>
            {simulateGradingMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Manage Questions" onClick={(e) => { e.stopPropagation(); navigate(`/admin/assessments/${r.id}/questions`); }}><List className="w-3.5 h-3.5" /></Button>
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
      <PageHeader title="Assessments" subtitle={`${assessments.length} assessments`}>
        <Button onClick={openCreate} className="bg-secondary hover:bg-secondary/90 text-white"><Plus className="w-4 h-4 mr-2" /> New Assessment</Button>
      </PageHeader>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Published</p>
          <p className="mt-2 text-2xl font-bold font-heading">{publishedCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Post-Assessments</p>
          <p className="mt-2 text-2xl font-bold font-heading">{postAssessmentCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Reviewed Results</p>
          <p className="mt-2 text-2xl font-bold font-heading">{reviewedResults}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Post-assessment completion is part of certificate release readiness. Use this page to keep pre-assessments and post-assessments clearly separated by delivery batch.
      </div>

      <DataTable columns={columns} data={assessments} isLoading={isLoading} onRowClick={openEdit} emptyMessage="No assessments yet." />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Assessment' : 'New Assessment'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div><Label>Batch</Label>
              <Select value={form.batch_id} onValueChange={v => setForm({...form, batch_id: v})}><SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Type</Label>
                <Select value={form.assessment_type} onValueChange={v => setForm({...form, assessment_type: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pre_assessment">Pre-Assessment</SelectItem><SelectItem value="post_assessment">Post-Assessment</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Format</Label>
                <Select value={form.question_type} onValueChange={v => setForm({...form, question_type: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="multiple_choice">Multiple Choice</SelectItem><SelectItem value="self_assessment">Self Assessment</SelectItem><SelectItem value="quiz">Quiz</SelectItem><SelectItem value="final_exam">Final Exam</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Total Points</Label><Input type="number" value={form.total_points} onChange={e => setForm({...form, total_points: parseInt(e.target.value) || 0})} /></div>
              <div><Label>Pass Score (%)</Label><Input type="number" value={form.passing_score} onChange={e => setForm({...form, passing_score: parseInt(e.target.value) || 70})} /></div>
              <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: parseInt(e.target.value) || 0})} /></div>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
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
