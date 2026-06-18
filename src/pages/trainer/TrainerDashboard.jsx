/**
 * Purpose: Present a trainer-specific dashboard summarizing assigned classes and learner progress.
 * Used by: Trainer route `/trainer/dashboard`.
 * Main dependencies: Local app client, auth context, React Query, trainer identity helper, shared page header, and stats cards.
 * Public/main functions: Default `TrainerDashboard` page export.
 * Important side effects: Reads local batch, enrollment, and assessment data scoped to the signed-in trainer.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Users, FileCheck, Award } from 'lucide-react';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/shared/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveTrainerRecord } from '@/domain/trainers/identity';

export default function TrainerDashboard() {
  const { user } = useAuth();
  const { data: batches = [] } = useQuery({ queryKey: ['trainer-batches'], queryFn: () => appClient.entities.Batch.list() });
  const { data: registrations = [] } = useQuery({ queryKey: ['trainer-registrations'], queryFn: () => appClient.entities.Registration.list() });
  const { data: assessments = [] } = useQuery({ queryKey: ['trainer-assessments'], queryFn: () => appClient.entities.Assessment.list() });
  const { data: trainers = [] } = useQuery({ queryKey: ['trainers'], queryFn: () => appClient.entities.Trainer.list() });

  const trainerInfo = resolveTrainerRecord(user, trainers);
  const trainerBatches = batches.filter((batch) => batch.trainer_id === trainerInfo?.id);
  const trainerBatchIds = new Set(trainerBatches.map((batch) => batch.id));
  const trainerRegistrations = registrations.filter((registration) => trainerBatchIds.has(registration.batch_id));
  const trainerAssessments = assessments.filter((assessment) => trainerBatchIds.has(assessment.batch_id));
  const certificateReady = trainerRegistrations.filter((registration) => appClient.isCertificateEligible(registration));

  return (
    <div>
      <PageHeader
        title="Trainer Dashboard"
        subtitle={`Teaching operations and learner readiness for ${trainerInfo?.full_name || user?.full_name || 'trainer'}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Assigned Classes" value={trainerBatches.length} icon={Calendar} iconClassName="bg-secondary/10 text-secondary" />
        <StatsCard title="Participants" value={trainerRegistrations.length} icon={Users} iconClassName="bg-accent/10 text-accent" />
        <StatsCard title="Assessment Reviews" value={trainerAssessments.length} icon={FileCheck} iconClassName="bg-warning/10 text-warning" />
        <StatsCard title="Certificate Ready" value={certificateReady.length} icon={Award} iconClassName="bg-success/10 text-success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Assigned Classes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {trainerBatches.map((batch) => (
              <div key={batch.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{batch.name}</p>
                  <p className="text-xs text-muted-foreground">{batch.program_name}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{batch.enrolled_count || 0} participants</p>
                  <p className="capitalize">{batch.status}</p>
                </div>
              </div>
            ))}
            {trainerBatches.length === 0 && <p className="text-sm text-muted-foreground">No classes assigned yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Learners Needing Attention</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {trainerRegistrations
              .filter((registration) => registration.completion_status !== 'completed' || Number(registration.attendance_percentage || 0) < 80)
              .slice(0, 5)
              .map((registration) => (
                <div key={registration.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{registration.full_name}</p>
                    <p className="text-xs text-muted-foreground">{registration.program_name}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Attendance {registration.attendance_percentage || 0}%</p>
                    <p>{registration.post_assessment_status === 'completed' ? 'post-assessment done' : 'post-assessment pending'}</p>
                  </div>
                </div>
              ))}
            {trainerRegistrations.length === 0 && <p className="text-sm text-muted-foreground">No learner records assigned yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
