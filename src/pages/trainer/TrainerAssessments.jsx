/**
 * Purpose: Allow trainers to review and grade assessments for their assigned batches.
 * Used by: Trainer route `/trainer/assessments`.
 * Main dependencies: appClient, React Query, trainer identity helper, and review dialog components.
 * Public/main functions: Default `TrainerAssessments` page export.
 * Important side effects: Updates assessment result status and scores.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { resolveTrainerRecord } from '@/domain/trainers/identity';

export default function TrainerAssessments() {
  const { user } = useAuth();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const qc = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: trainers = [] } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => appClient.entities.Trainer.list(),
  });
  const trainerInfo = resolveTrainerRecord(user, trainers);

  const { data: batches = [] } = useQuery({
    queryKey: ['batches-trainer', trainerInfo?.id],
    queryFn: async () => {
      const allBatches = await appClient.entities.Batch.list();
      return allBatches.filter((b) => b.trainer_id === trainerInfo?.id);
    },
    enabled: !!trainerInfo?.id,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments-trainer', batches],
    queryFn: async () => {
      const allAssessments = await appClient.entities.Assessment.list();
      return allAssessments.filter((a) => batches.some((b) => b.id === a.batch_id));
    },
    enabled: batches.length > 0,
  });

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['assessment-results-trainer', assessments],
    queryFn: async () => {
      const allResults = await appClient.entities.AssessmentResult.list();
      return allResults.filter((r) => assessments.some((a) => a.id === r.assessment_id));
    },
    enabled: assessments.length > 0,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations'],
    queryFn: () => appClient.entities.Registration.list(),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ resultId, registrationId, data }) => {
      const updated = await appClient.entities.AssessmentResult.update(resultId, {
        ...data,
        status: 'reviewed',
      });

      const assessment = assessments.find((a) => a.id === results.find((r) => r.id === resultId)?.assessment_id);
      if (assessment?.assessment_type === 'post_assessment') {
        await appClient.entities.Registration.update(registrationId, {
          post_assessment_status: 'completed',
          post_assessment_score: data.percentage,
        });
      }

      return updated;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessment-results-trainer'] });
      qc.invalidateQueries({ queryKey: ['registrations'] });
      setReviewDialogOpen(false);
      toast({ title: 'Assessment reviewed and saved' });
    },
  });

  const openReview = (result) => {
    setSelected(result);
    setScore(result.percentage || '');
    setFeedback(result.feedback || '');
    setReviewDialogOpen(true);
  };

  const handleSaveReview = () => {
    if (!score) {
      toast({ title: 'Please enter a score', variant: 'destructive' });
      return;
    }

    const registration = registrations.find((r) => r.id === selected.registration_id);
    if (!registration) {
      toast({ title: 'Registration not found', variant: 'destructive' });
      return;
    }

    updateMutation.mutate({
      resultId: selected.id,
      registrationId: registration.id,
      data: {
        percentage: parseInt(score, 10) || 0,
        passed: parseInt(score, 10) >= 70,
        feedback,
      },
    });
  };

  const pendingResults = results.filter((r) => r.status !== 'reviewed');
  const reviewedResults = results.filter((r) => r.status === 'reviewed');
  const trainerName = trainerInfo?.full_name || user?.full_name || 'Trainer';

  const assessmentColumns = [
    { header: 'Assessment Title', cell: (r) => <span className="font-medium">{r.title}</span> },
    { header: 'Type', cell: (r) => <span className="text-xs capitalize">{r.assessment_type?.replace(/_/g, ' ')}</span> },
    { header: 'Format', cell: (r) => <span className="text-xs capitalize">{r.question_type?.replace(/_/g, ' ')}</span> },
    { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: '',
      cell: (r) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-primary"
            onClick={() => navigate(`/trainer/assessments/${r.id}/questions`)}
          >
            <List className="w-3.5 h-3.5 mr-1" />
            Manage Questions
          </Button>
        </div>
      ),
    },
  ];

  const columns = [
    {
      header: 'Assessment',
      cell: (r) => {
        const assess = assessments.find((a) => a.id === r.assessment_id);
        return <span className="font-medium">{assess?.title || 'Unknown'}</span>;
      },
    },
    {
      header: 'Type',
      cell: (r) => {
        const assess = assessments.find((a) => a.id === r.assessment_id);
        return <span className="text-xs capitalize">{assess?.assessment_type?.replace(/_/g, ' ')}</span>;
      },
    },
    { header: 'Participant', accessor: 'participant_email' },
    { header: 'Date', cell: (r) => format(new Date(r.submission_date), 'MMM d, yyyy HH:mm') },
    {
      header: 'Score',
      cell: (r) => (
        <span className={`font-medium ${r.percentage >= 70 ? 'text-success' : 'text-destructive'}`}>
          {r.percentage}%
        </span>
      ),
    },
    { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: '',
      cell: (r) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => openReview(r)}
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1" />
          Review
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Assessment Reviews"
        subtitle={`${trainerName} - ${assessments.length} assessments, ${pendingResults.length} pending review`}
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Results</p>
          <p className="mt-2 text-2xl font-bold font-heading">{results.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending Review</p>
          <p className="mt-2 text-2xl font-bold font-heading text-warning">{pendingResults.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Need manual scoring</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Reviewed</p>
          <p className="mt-2 text-2xl font-bold font-heading text-success">{reviewedResults.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Already finalized</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Review assessment submissions from your participants. Set scores and provide feedback to guide their learning progress.
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3 text-sm">My Assessments</h3>
          <DataTable
            columns={assessmentColumns}
            data={assessments}
            isLoading={!assessments.length}
            emptyMessage="No assessments found for your batches."
          />
        </div>

        {pendingResults.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 text-sm">Pending Review</h3>
            <DataTable
              columns={columns}
              data={pendingResults}
              isLoading={isLoading}
              emptyMessage="No pending assessments."
            />
          </div>
        )}

        {reviewedResults.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 text-sm">Reviewed</h3>
            <DataTable
              columns={columns}
              data={reviewedResults}
              isLoading={isLoading}
              emptyMessage="No reviewed assessments."
            />
          </div>
        )}
      </div>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Assessment Submission</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm border-b pb-4">
                <div>
                  <span className="text-muted-foreground">Participant:</span>
                  <p className="font-medium">{selected.participant_email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted:</span>
                  <p className="font-medium">{format(new Date(selected.submission_date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Assessment:</span>
                  <p className="font-medium">{selected.title}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Score:</span>
                  <p className="font-medium">{selected.percentage || '-'}%</p>
                </div>
              </div>

              {selected.answers && selected.answers.length > 0 && (
                <div className="border-b pb-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Participant Answers</p>
                  <div className="space-y-2">
                    {selected.answers.slice(0, 3).map((ans, idx) => (
                      <div key={idx} className="text-xs p-2 bg-muted rounded">
                        <p className="font-medium">{ans.answer}</p>
                        <p className="text-muted-foreground">Points: {ans.points_earned || 0}</p>
                      </div>
                    ))}
                    {selected.answers.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{selected.answers.length - 3} more answers</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label>Final Score (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="0-100"
                />
              </div>

              <div>
                <Label>Feedback for Participant</Label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide constructive feedback on their performance..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveReview}
              disabled={updateMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
