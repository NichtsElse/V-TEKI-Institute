/**
 * Purpose: Allow trainers to collect and review feedback from their participants.
 * Used by: Trainer route `/trainer/feedback`.
 * Main dependencies: appClient, React Query, trainer identity helper, and table/dialog components.
 * Public/main functions: Default `TrainerFeedback` page export.
 * Important side effects: None - display only.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Star } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { format } from 'date-fns';
import { resolveTrainerRecord } from '@/domain/trainers/identity';

export default function TrainerFeedback() {
  const { user } = useAuth();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Get trainer info
  const { data: trainerInfo } = useQuery({
    queryKey: ['trainer-info', user?.id],
    queryFn: async () => {
      const trainers = await appClient.entities.Trainer.list();
      return resolveTrainerRecord(user, trainers);
    },
  });

  // Get trainer's batches
  const { data: batches = [] } = useQuery({
    queryKey: ['batches-trainer', trainerInfo?.id],
    queryFn: async () => {
      const allBatches = await appClient.entities.Batch.list();
      return allBatches.filter(b => b.trainer_id === trainerInfo?.id);
    },
    enabled: !!trainerInfo?.id,
  });

  // Get feedback for trainer's batches
  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['feedbacks-trainer', batches],
    queryFn: async () => {
      const allFeedbacks = await appClient.entities.Feedback.list();
      return allFeedbacks.filter(f => batches.some(b => b.id === f.batch_id));
    },
    enabled: batches.length > 0,
  });

  const getRating = (rating) => {
    if (!rating) return '-';
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i < rating ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
          />
        ))}
        <span className="ml-1 text-xs font-medium">{rating}/5</span>
      </div>
    );
  };

  const openDetail = (feedback) => {
    setSelectedFeedback(feedback);
    setDetailDialogOpen(true);
  };

  const columns = [
    { header: 'Participant', accessor: 'participant_name' },
    { header: 'Batch', accessor: 'batch_name' },
    { header: 'Trainer Rating', cell: (f) => getRating(f.trainer_rating) },
    { header: 'Program Rating', cell: (f) => getRating(f.program_rating) },
    { header: 'Satisfaction', cell: (f) => getRating(f.satisfaction_score) },
    { header: 'Date', cell: (f) => format(new Date(f.created_date), 'MMM d, yyyy') },
    { header: '', cell: (f) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs"
        onClick={() => openDetail(f)}
      >
        <MessageSquare className="w-3.5 h-3.5 mr-1" />
        View
      </Button>
    )},
  ];

  const averageTrainerRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + (f.trainer_rating || 0), 0) / feedbacks.length).toFixed(1)
    : 0;

  const averageProgramRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + (f.program_rating || 0), 0) / feedbacks.length).toFixed(1)
    : 0;

  const averageSatisfaction = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + (f.satisfaction_score || 0), 0) / feedbacks.length).toFixed(1)
    : 0;

  return (
    <div>
      <PageHeader
        title="Participant Feedback"
        subtitle={`${trainerInfo?.full_name || user?.full_name || 'Trainer'} - ${feedbacks.length} feedback submissions`}
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Trainer Rating</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-bold font-heading">{averageTrainerRating}</p>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(averageTrainerRating) ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Average trainer score from participant feedback</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Program Rating</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-bold font-heading">{averageProgramRating}</p>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(averageProgramRating) ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Average program delivery score</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Satisfaction</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-bold font-heading">{averageSatisfaction}</p>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(averageSatisfaction) ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Overall participant satisfaction</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Review feedback from participants in your batches. This helps improve delivery and participant experience.
      </div>

      <DataTable
        columns={columns}
        data={feedbacks}
        isLoading={isLoading}
        emptyMessage="No feedback collected yet."
      />

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback Detail</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Participant</p>
                    <p className="font-medium">{selectedFeedback.participant_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium text-xs">{selectedFeedback.participant_email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Batch</p>
                    <p className="font-medium">{selectedFeedback.batch_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(selectedFeedback.created_date), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Ratings</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Trainer</span>
                      {getRating(selectedFeedback.trainer_rating)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Material</span>
                      {getRating(selectedFeedback.material_rating)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Program</span>
                      {getRating(selectedFeedback.program_rating)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overall Satisfaction</span>
                      {getRating(selectedFeedback.satisfaction_score)}
                    </div>
                  </div>
                </div>
              </div>

              {selectedFeedback.comments && (
                <div className="border-t pt-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Comments</p>
                  <p className="text-sm text-muted-foreground italic">"{selectedFeedback.comments}"</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
