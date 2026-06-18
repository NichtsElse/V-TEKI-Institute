/**
 * Purpose: Allow participants to submit feedback for completed programs/batches.
 * Used by: Participant route `/participant/feedback/:enrollmentId`.
 * Main dependencies: appClient, React Query, form components.
 * Public/main functions: Default `FeedbackSubmit` page export.
 * Important side effects: Creates feedback records.
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, ArrowLeft, Send, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function FeedbackSubmit() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [trainerRating, setTrainerRating] = useState(0);
  const [materialRating, setMaterialRating] = useState(0);
  const [programRating, setProgramRating] = useState(0);
  const [satisfactionScore, setSatisfactionScore] = useState(0);
  const [comments, setComments] = useState('');
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  // Get enrollment/registration
  const { data: enrollment, isLoading } = useQuery({
    queryKey: ['enrollment', enrollmentId],
    queryFn: async () => {
      const registrations = await appClient.entities.Registration.list();
      return registrations.find(r => r.id === enrollmentId);
    },
  });

  // Get batch for context
  const { data: batch } = useQuery({
    queryKey: ['batch', enrollment?.batch_id],
    queryFn: async () => {
      if (!enrollment?.batch_id) return null;
      const batches = await appClient.entities.Batch.list();
      return batches.find(b => b.id === enrollment.batch_id);
    },
    enabled: !!enrollment?.batch_id,
  });

  // Get program for context
  const { data: program } = useQuery({
    queryKey: ['program', enrollment?.program_id],
    queryFn: async () => {
      if (!enrollment?.program_id) return null;
      const programs = await appClient.entities.Program.list();
      return programs.find(p => p.id === enrollment.program_id);
    },
    enabled: !!enrollment?.program_id,
  });

  // Check if feedback already exists
  const { data: existingFeedback } = useQuery({
    queryKey: ['feedback-check', enrollmentId],
    queryFn: async () => {
      const feedbacks = await appClient.entities.Feedback.list();
      return feedbacks.find(f => f.registration_id === enrollmentId);
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async () => {
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      const feedbackData = {
        registration_id: enrollmentId,
        batch_id: enrollment.batch_id,
        batch_name: batch?.name,
        participant_name: enrollment.full_name,
        participant_email: enrollment.email,
        program_name: program?.name,
        trainer_name: batch?.trainer_name,
        trainer_rating: trainerRating,
        material_rating: materialRating,
        program_rating: programRating,
        satisfaction_score: satisfactionScore,
        comments,
      };

      let result;
      if (existingFeedback) {
        result = await appClient.entities.Feedback.update(existingFeedback.id, feedbackData);
      } else {
        result = await appClient.entities.Feedback.create(feedbackData);
      }

      // Update registration feedback status
      await appClient.entities.Registration.update(enrollmentId, {
        feedback_status: 'submitted',
        feedback_submitted: true,
      });

      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback'] });
      qc.invalidateQueries({ queryKey: ['registrations'] });
      toast({ title: 'Feedback submitted successfully!' });
      setTimeout(() => navigate('/participant/programs'), 1500);
    },
    onError: (error) => {
      toast({ title: 'Failed to submit feedback', description: error.message, variant: 'destructive' });
    },
  });

  const RatingStars = ({ value, onChange }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-colors"
          aria-label={`Rate ${star} stars`}
        >
          <Star
            className={`w-6 h-6 ${
              star <= value
                ? 'fill-warning text-warning'
                : 'text-muted-foreground hover:text-warning'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Enrollment not found.</p>
        <Button onClick={() => navigate('/participant/programs')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Programs
        </Button>
      </div>
    );
  }

  const allRatingsComplete = trainerRating > 0 && materialRating > 0 && programRating > 0 && satisfactionScore > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/participant/programs')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div>
            <p className="text-sm text-muted-foreground">Program Feedback</p>
            <h1 className="text-3xl font-bold font-heading mt-1">
              How was your experience?
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {program?.name} • {batch?.name}
            </p>
          </div>
        </div>

        {/* Feedback Form */}
        <div className="bg-card rounded-xl border border-border p-8 space-y-8 mb-8">
          {/* Trainer Rating */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Rate Your Trainer: {batch?.trainer_name}
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              How well did the trainer present and facilitate the learning?
            </p>
            <RatingStars value={trainerRating} onChange={setTrainerRating} />
          </div>

          {/* Material Rating */}
          <div className="border-t pt-8">
            <Label className="text-base font-semibold mb-3 block">
              Rate the Learning Materials
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              How relevant and helpful were the course materials?
            </p>
            <RatingStars value={materialRating} onChange={setMaterialRating} />
          </div>

          {/* Program Rating */}
          <div className="border-t pt-8">
            <Label className="text-base font-semibold mb-3 block">
              Rate the Overall Program
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              How would you rate the program overall?
            </p>
            <RatingStars value={programRating} onChange={setProgramRating} name="program" />
          </div>

          {/* Satisfaction Score */}
          <div className="border-t pt-8">
            <Label className="text-base font-semibold mb-3 block">
              How Satisfied Are You?
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Overall satisfaction with your learning experience.
            </p>
            <RatingStars value={satisfactionScore} onChange={setSatisfactionScore} name="satisfaction" />
          </div>

          {/* Comments */}
          <div className="border-t pt-8">
            <Label htmlFor="comments" className="text-base font-semibold mb-3 block">
              Additional Comments (Optional)
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Any suggestions for improvement or areas you particularly enjoyed?
            </p>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share your thoughts and suggestions..."
              rows={5}
              className="resize-none"
            />
          </div>
        </div>

        {/* Summary */}
        {allRatingsComplete && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-success-foreground">
              ✓ All ratings complete. Ready to submit your feedback.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/participant/programs')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            className="flex-1 bg-secondary hover:bg-secondary/90 text-white"
            disabled={!allRatingsComplete || submitFeedbackMutation.isPending}
            onClick={() => setSubmitDialogOpen(true)}
          >
            {submitFeedbackMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>

        {/* Submit Dialog */}
        <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Feedback?</AlertDialogTitle>
              <AlertDialogDescription>
                Your feedback helps us improve the program experience for future participants. Once submitted, your feedback cannot be changed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 text-sm border-y py-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trainer:</span>
                <span className="font-semibold">{trainerRating}/5 ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Materials:</span>
                <span className="font-semibold">{materialRating}/5 ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Program:</span>
                <span className="font-semibold">{programRating}/5 ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Satisfaction:</span>
                <span className="font-semibold">{satisfactionScore}/5 ⭐</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-secondary hover:bg-secondary/90"
                onClick={() => {
                  submitFeedbackMutation.mutate();
                  setSubmitDialogOpen(false);
                }}
              >
                Submit
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
