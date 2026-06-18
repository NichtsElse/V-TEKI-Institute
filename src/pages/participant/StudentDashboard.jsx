/**
 * Purpose: Present the main participant learning dashboard with class, materials, and assessment progress.
 * Used by: Participant route `/participant/dashboard` and temporary trainer/participant aliases where needed.
 * Main dependencies: Local app client, auth context, React Query, shared participant cards, and shadcn tabs.
 * Public/main functions: Default `StudentDashboard` page export.
 * Important side effects: Reads local enrollment, batch, assessment, and certificate records for the signed-in user.
 */
import React from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar, BookOpen, FileCheck
} from 'lucide-react';
import { format, isAfter } from 'date-fns';
import StatusBadge from '@/components/shared/StatusBadge';
import UpcomingBatchCard from '@/components/participant/UpcomingBatchCard';
import AssessmentResultCard from '@/components/participant/AssessmentResultCard';
import LearningMaterialCard from '@/components/participant/LearningMaterialCard';
import ProgressOverview from '@/components/participant/ProgressOverview';
import { getCertificateEligibilityChecklist } from '@/domain/certificates/eligibility';
import { getAssessmentLifecycleSummary } from '@/domain/assessments/summary';

export default function StudentDashboard() {
  const { user } = useAuth();

  const { data: registrations = [] } = useQuery({
    queryKey: ['my-registrations', user?.email],
    queryFn: () => appClient.entities.Registration.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allBatches = [] } = useQuery({
    queryKey: ['batches-all'],
    queryFn: () => appClient.entities.Batch.list(),
  });

  const { data: assessmentResults = [] } = useQuery({
    queryKey: ['my-assessment-results', user?.email],
    queryFn: () => appClient.entities.AssessmentResult.filter({ participant_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments-all'],
    queryFn: () => appClient.entities.Assessment.list(),
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['my-certificates', user?.email],
    queryFn: () => appClient.entities.Certificate.filter({ participant_email: user?.email }),
    enabled: !!user?.email,
  });

  // Map batch info onto registrations
  const enrichedRegs = registrations.map(reg => {
    const batch = allBatches.find(b => b.id === reg.batch_id);
    return { ...reg, batch };
  });

  const today = new Date();
  const upcomingRegs = enrichedRegs.filter(r =>
    r.batch && r.batch.start_date &&
    (isAfter(new Date(r.batch.start_date), today) || (r.batch.status === 'open' || r.batch.status === 'closed')) &&
    ['confirmed', 'paid', 'registered'].includes(r.status)
  );

  const activeRegs = enrichedRegs.filter(r =>
    r.batch && r.batch.status === 'closed' &&
    r.completion_status === 'in_progress'
  );

  const completedRegs = enrichedRegs.filter(r => r.completion_status === 'completed');

  // Enrich assessment results with assessment details
  const enrichedResults = assessmentResults.map(res => {
    const assessment = assessments.find(a => a.id === res.assessment_id);
    const reg = registrations.find(r => r.id === res.registration_id);
    return { ...res, assessment, programName: reg?.program_name || assessment?.title || 'Assessment' };
  });

  const firstName = user?.full_name?.split(' ')[0] || 'Student';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Good day, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your active classes, assessment outcomes, and certificate readiness from one place.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{format(today, 'EEEE, MMMM d, yyyy')}</span>
        </div>
      </div>

      {/* Progress Overview */}
      <ProgressOverview
        total={registrations.length}
        active={activeRegs.length}
        completed={completedRegs.length}
        certificates={certificates.length}
      />

      {registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion Journey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrichedRegs.slice(0, 3).map((registration) => {
              const checklist = getCertificateEligibilityChecklist(registration);
              const assessmentSummary = getAssessmentLifecycleSummary(registration);
              const nextStep = !checklist.paymentPaid
                ? 'Complete payment verification'
                : !assessmentSummary.preAssessmentCompleted
                  ? 'Finish pre-assessment'
                  : !checklist.attendanceReached
                    ? 'Reach minimum attendance'
                    : !checklist.postAssessmentCompleted
                      ? 'Complete post-assessment'
                      : !checklist.feedbackSubmitted
                        ? 'Submit feedback'
                        : !checklist.completionDone
                          ? 'Wait for completion validation'
                          : 'Ready for certificate release';

              const steps = [
                { label: 'Payment', done: checklist.paymentPaid },
                { label: 'Attendance', done: checklist.attendanceReached },
                { label: 'Post-Assessment', done: checklist.postAssessmentCompleted },
                { label: 'Feedback', done: checklist.feedbackSubmitted },
                { label: 'Certificate', done: appClient.isCertificateEligible(registration) },
              ];

              return (
                <div key={registration.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold">{registration.program_name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{registration.batch_name}</p>
                    </div>
                    <StatusBadge status={appClient.isCertificateEligible(registration) ? 'eligible' : 'in_progress'} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {steps.map((step) => (
                      <div
                        key={step.label}
                        className={`rounded-lg border px-3 py-2 text-xs ${
                          step.done
                            ? 'border-success/30 bg-success/5 text-success'
                            : 'border-border bg-muted/40 text-muted-foreground'
                        }`}
                      >
                        {step.label}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Next step: <span className="font-medium text-foreground">{nextStep}</span>
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl w-full sm:w-auto">
          <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Upcoming Batches
            {upcomingRegs.length > 0 && (
              <Badge className="ml-2 bg-secondary text-white text-[10px] px-1.5 py-0 h-4">{upcomingRegs.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="materials" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            Learning Materials
          </TabsTrigger>
          <TabsTrigger value="assessments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileCheck className="w-3.5 h-3.5 mr-1.5" />
            Assessment Results
            {assessmentResults.length > 0 && (
              <Badge className="ml-2 bg-accent text-white text-[10px] px-1.5 py-0 h-4">{assessmentResults.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Batches Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingRegs.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming batches"
              description="You don't have any upcoming classes scheduled. Browse programs to join a new cohort."
              action={{ label: 'Browse Programs', href: '/programs' }}
            />
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {upcomingRegs.map(reg => (
                <UpcomingBatchCard key={reg.id} registration={reg} batch={reg.batch} />
              ))}
            </div>
          )}

          {/* Active / In Progress */}
          {activeRegs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">In Progress</h3>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeRegs.map(reg => (
                  <UpcomingBatchCard key={reg.id} registration={reg} batch={reg.batch} inProgress />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Learning Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          {enrichedRegs.filter(r => r.batch).length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No learning materials yet"
              description="Materials will appear here once your enrollment is confirmed."
            />
          ) : (
            <div className="space-y-6">
              {enrichedRegs.filter(r => r.batch).map(reg => (
                <LearningMaterialCard key={reg.id} registration={reg} batch={reg.batch} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Assessment Results Tab */}
        <TabsContent value="assessments" className="space-y-4">
          {enrichedResults.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="No assessment results"
              description="Your assessment results will appear here after your submissions are reviewed."
            />
          ) : (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold font-heading text-success">{enrichedResults.filter(r => r.passed).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Passed</p>
                </div>
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold font-heading text-destructive">{enrichedResults.filter(r => r.passed === false).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Not Passed</p>
                </div>
                <div className="bg-muted/50 border border-border rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold font-heading">
                    {enrichedResults.length > 0
                      ? Math.round(enrichedResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / enrichedResults.length)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Avg. Score</p>
                </div>
              </div>

              <div className="space-y-3">
                {enrichedResults.map(result => (
                  <AssessmentResultCard key={result.id} result={result} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <h3 className="font-semibold font-heading mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
        {action && (
          <a href={action.href}>
            <Button className="mt-4 bg-secondary hover:bg-secondary/90 text-white" size="sm">{action.label}</Button>
          </a>
        )}
      </CardContent>
    </Card>
  );
}
