/**
 * Purpose: Review participant feedback scores and comments for the local MVP admin experience.
 * Used by: Admin route `/admin/feedback`.
 * Main dependencies: Local app client, React Query, shared table components, and stats cards.
 * Public/main functions: Default `AdminFeedback` page export.
 * Important side effects: Reads local feedback responses for quality and completion monitoring.
 */
import React from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare, CheckCircle, Clock, Wand2, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/shared/DataTable';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

function StarRating({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= (value || 0) ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

export default function AdminFeedback() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: feedback = [], isLoading } = useQuery({ queryKey: ['feedback'], queryFn: () => appClient.entities.Feedback.list('-created_date') });
  const { data: registrations = [] } = useQuery({ queryKey: ['registrations'], queryFn: () => appClient.entities.Registration.list() });

  const confirmedEnrollments = registrations.filter(r => r.status === 'confirmed').length;
  const feedbackRate = confirmedEnrollments > 0
    ? Math.round((feedback.length / confirmedEnrollments) * 100)
    : 0;
  const pendingFeedback = Math.max(0, confirmedEnrollments - feedback.length);

  const avgTrainer = feedback.length ? (feedback.reduce((s, f) => s + (f.trainer_rating || 0), 0) / feedback.length).toFixed(1) : '0';
  const avgMaterial = feedback.length ? (feedback.reduce((s, f) => s + (f.material_rating || 0), 0) / feedback.length).toFixed(1) : '0';
  const avgProgram = feedback.length ? (feedback.reduce((s, f) => s + (f.program_rating || 0), 0) / feedback.length).toFixed(1) : '0';
  const avgSatisfaction = feedback.length ? (feedback.reduce((s, f) => s + (f.satisfaction_score || 0), 0) / feedback.length).toFixed(1) : '0';

  const columns = [
    { header: 'Participant', cell: (r) => <span className="font-medium">{r.participant_name || '-'}</span> },
    { header: 'Program', accessor: 'program_name' },
    { header: 'Batch', cell: (r) => <span className="text-xs text-muted-foreground">{r.batch_name || '-'}</span> },
    { header: 'Trainer', cell: (r) => <StarRating value={r.trainer_rating} /> },
    { header: 'Material', cell: (r) => <StarRating value={r.material_rating} /> },
    { header: 'Program', cell: (r) => <StarRating value={r.program_rating} /> },
    { header: 'Satisfaction', cell: (r) => <StarRating value={r.satisfaction_score} /> },
    { header: 'Date', cell: (r) => r.created_date ? <span className="text-xs text-muted-foreground">{format(new Date(r.created_date), 'MMM d, yyyy')}</span> : '-' },
    { header: 'Comments', cell: (r) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-[180px]">{r.comments || '-'}</span> },
  ];

  const summaryCards = [
    { label: 'Responses', value: feedback.length, icon: MessageSquare, color: 'text-secondary' },
    { label: 'Submitted', value: `${feedbackRate}%`, icon: CheckCircle, color: 'text-success' },
    { label: 'Pending', value: pendingFeedback, icon: Clock, color: 'text-warning' },
    { label: 'Avg Satisfaction', value: `${avgSatisfaction}/5`, icon: Star, color: 'text-accent' },
  ];

  const simulateFeedbackMutation = useMutation({
    mutationFn: async () => {
      const pendingRegs = registrations.filter(r => r.status === 'confirmed' && r.feedback_status !== 'submitted');
      for (const reg of pendingRegs) {
        await appClient.entities.Feedback.create({
          registration_id: reg.id,
          batch_id: reg.batch_id,
          batch_name: reg.batch_name,
          participant_name: reg.full_name,
          participant_email: reg.email,
          program_name: reg.program_name,
          trainer_name: 'Simulated Trainer',
          trainer_rating: 5,
          material_rating: 4,
          program_rating: 5,
          satisfaction_score: 5,
          comments: 'Simulated feedback for completion.',
        });
        await appClient.entities.Registration.update(reg.id, { feedback_status: 'submitted', feedback_submitted: true });
      }
      return pendingRegs.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['feedback'] });
      qc.invalidateQueries({ queryKey: ['registrations'] });
      toast({ title: `Simulated ${count} feedback records` });
    },
  });

  return (
    <div>
      <PageHeader title="Feedback" subtitle={`${feedback.length} responses from ${confirmedEnrollments} confirmed enrollments`}>
        <Button onClick={() => simulateFeedbackMutation.mutate()} disabled={simulateFeedbackMutation.isPending || pendingFeedback === 0} variant="outline">
          {simulateFeedbackMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
          Simulate Feedback
        </Button>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Avg Trainer Rating', value: `${avgTrainer}/5` },
          { label: 'Avg Material Rating', value: `${avgMaterial}/5` },
          { label: 'Avg Program Rating', value: `${avgProgram}/5` },
          { label: 'Avg Satisfaction', value: `${avgSatisfaction}/5` },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-xl font-bold font-heading text-warning">{item.value}</p>
            <div className="flex justify-center mt-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-3 h-3 ${i <= Math.round(parseFloat(item.value)) ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Feedback submission is a required condition for certificate release. Participants who have not submitted feedback are shown as <strong>Pending</strong> above.
      </div>

      <DataTable columns={columns} data={feedback} isLoading={isLoading} emptyMessage="No feedback submitted yet." />
    </div>
  );
}
