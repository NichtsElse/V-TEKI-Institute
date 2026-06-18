/**
 * Purpose: Show enrolled programs and progress details for the signed-in participant.
 * Used by: Participant route `/participant/programs`.
 * Main dependencies: Local app client, React Query, shared status badge, and progress components.
 * Public/main functions: Default `MyPrograms` page export.
 * Important side effects: Reads local enrollment records scoped to the current user.
 */
import React from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import StatusBadge from '@/components/shared/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';
import { BookOpen, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { getCertificateEligibilityChecklist } from '@/domain/certificates/eligibility';
import { getAssessmentLifecycleSummary } from '@/domain/assessments/summary';
import UploadPaymentDialog from '@/components/shared/UploadPaymentDialog';
import ParticipantCheckInDialog from '@/components/shared/ParticipantCheckInDialog';

export default function MyPrograms() {
  const { user } = useAuth();

  const { data: registrations = [], isLoading: isLoadingIndividual } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => appClient.entities.Registration.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: corporateRegistrations = [], isLoading: isLoadingCorporate } = useQuery({
    queryKey: ['my-corporate-registrations'],
    queryFn: () => appClient.entities.CorporateRegistration.filter({ pic_email: user?.email }),
    enabled: !!user?.email,
  });

  const isLoading = isLoadingIndividual || isLoadingCorporate;
  const inProgressCount = registrations.filter((registration) => registration.completion_status === 'in_progress').length;
  const completedCount = registrations.filter((registration) => registration.completion_status === 'completed').length;
  const certificateReadyCount = registrations.filter((registration) => appClient.isCertificateEligible(registration)).length;
  const feedbackSubmittedCount = registrations.filter(
    (registration) => registration.feedback_submitted || registration.feedback_status === 'submitted',
  ).length;
  const attendanceVisibleCount = registrations.filter((registration) => (registration.attendance_percentage || 0) > 0).length;
  const averageAttendance = registrations.length > 0
    ? Math.round(registrations.reduce((sum, registration) => sum + (registration.attendance_percentage || 0), 0) / registrations.length)
    : 0;

  return (
    <div>
      <PageHeader title="My Programs" subtitle={`${registrations.length} enrollments`} />

      {!isLoading && registrations.length > 0 && (
        <div className="grid sm:grid-cols-5 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">In Progress</p>
            <p className="mt-2 text-2xl font-bold font-heading">{inProgressCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Completed</p>
            <p className="mt-2 text-2xl font-bold font-heading">{completedCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg Attendance</p>
            <p className="mt-2 text-2xl font-bold font-heading">{averageAttendance}%</p>
            <p className="text-[10px] text-muted-foreground mt-1">{attendanceVisibleCount} enrollments show attendance</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Certificate Ready</p>
            <p className="mt-2 text-2xl font-bold font-heading">{certificateReadyCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Feedback Sent</p>
            <p className="mt-2 text-2xl font-bold font-heading">{feedbackSubmittedCount}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
        </div>
      ) : registrations.length === 0 && corporateRegistrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold mb-1">No enrollments</h3>
            <p className="text-sm text-muted-foreground">You haven't enrolled in any programs yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {registrations.map(reg => (
            <Card key={reg.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary uppercase tracking-wider">Individual</span>
                    </div>
                    <h3 className="font-semibold font-heading">{reg.program_name || 'Program'}</h3>
                    <p className="text-sm text-muted-foreground">{reg.batch_name}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <StatusBadge status={reg.status} />
                      <StatusBadge status={reg.completion_status} />
                      <StatusBadge status={reg.feedback_status || (reg.feedback_submitted ? 'submitted' : 'pending')} />
                      <StatusBadge status={appClient.isCertificateEligible(reg) ? 'eligible' : 'pending'} />
                    </div>
                    {reg.payment_status === 'pending' || reg.payment_status === 'waiting_payment' ? (
                      <div className="mt-4">
                        <UploadPaymentDialog registrationId={reg.id} />
                      </div>
                    ) : reg.payment_status === 'pending_verification' ? (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground italic">Payment pending verification...</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="sm:text-right space-y-2">
                    <div className="w-32 sm:ml-auto">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-muted-foreground">
                          Attendance: {reg.attendance_percentage || 0}%
                        </p>
                        {reg.status === 'confirmed' && (reg.attendance_percentage || 0) < 100 && (
                          <ParticipantCheckInDialog 
                            registrationId={reg.id} 
                            batchId={reg.batch_id}
                            currentAttendance={reg.attendance_percentage} 
                          >
                            <button className="text-[10px] font-medium text-primary hover:underline">Check-in</button>
                          </ParticipantCheckInDialog>
                        )}
                      </div>
                      <Progress value={reg.attendance_percentage || 0} className="h-1.5" />
                    </div>
                    {reg.post_assessment_score != null && (
                      <p className="text-xs text-muted-foreground">Score: <span className="font-medium text-foreground">{reg.post_assessment_score}%</span></p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Assessments: {getAssessmentLifecycleSummary(reg).preAssessmentCompleted ? 'pre done' : 'pre pending'} / {getAssessmentLifecycleSummary(reg).postAssessmentCompleted ? 'post done' : 'post pending'}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">
                        Feedback: {reg.feedback_submitted || reg.feedback_status === 'submitted' ? 'Submitted' : 'Pending'}
                      </p>
                      {!(reg.feedback_submitted || reg.feedback_status === 'submitted') && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" asChild>
                          <Link to={`/participant/feedback/${reg.id}`}>
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Submit
                          </Link>
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Certificate: {appClient.isCertificateEligible(reg) ? 'Ready for issuance' : 'Waiting for remaining requirements'}
                    </p>
                    {!appClient.isCertificateEligible(reg) && (
                      <p className="text-[11px] text-muted-foreground">
                        Missing: {Object.entries(getCertificateEligibilityChecklist(reg))
                          .filter(([, value]) => !value)
                          .map(([key]) => {
                            if (key === 'paymentPaid') return 'payment';
                            if (key === 'attendanceReached') return 'attendance';
                            if (key === 'postAssessmentCompleted') return 'post-assessment';
                            if (key === 'feedbackSubmitted') return 'feedback';
                            if (key === 'completionDone') return 'completion';
                            return key;
                          })
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {corporateRegistrations.map(reg => (
            <Card key={reg.id} className="hover:shadow-md transition-shadow border-secondary/30">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary/10 text-secondary uppercase tracking-wider">Corporate PIC</span>
                    </div>
                    <h3 className="font-semibold font-heading">{reg.program_name || 'Program'}</h3>
                    <p className="text-sm text-muted-foreground">{reg.batch_name}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <StatusBadge status={reg.status} />
                    </div>
                    <div className="mt-3 text-sm">
                      <p><span className="text-muted-foreground">Company:</span> {reg.company_name}</p>
                      <p><span className="text-muted-foreground">Participants:</span> {reg.participant_count} pax</p>
                    </div>
                    {reg.status === 'waiting_payment' || reg.status === 'pending' ? (
                      <div className="mt-4">
                        <UploadPaymentDialog registrationId={reg.id} />
                      </div>
                    ) : reg.status === 'pending_verification' ? (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground italic">Payment pending verification...</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="sm:text-right">
                    <div className="bg-muted/50 p-3 rounded-lg inline-block">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Fee</p>
                      <p className="font-bold">IDR {(reg.total_amount || 0).toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 max-w-xs sm:ml-auto mb-4">
                      Corporate registrations are managed centrally. Individual participants will receive email instructions once payment is cleared.
                    </p>
                  </div>
                </div>
                
                {reg.participants && reg.participants.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Participant Roster</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {reg.participants.map((p, idx) => (
                        <div key={idx} className="bg-muted/30 border border-border/50 rounded p-2 text-sm">
                          <p className="font-medium">{p.name || 'Unnamed Participant'}</p>
                          <p className="text-xs text-muted-foreground">{p.email || 'No email provided'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
