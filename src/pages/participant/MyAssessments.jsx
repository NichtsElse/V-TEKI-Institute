/**
 * Purpose: Show assessment submissions and scores for the signed-in participant.
 * Used by: Participant route `/participant/assessments`.
 * Main dependencies: Local app client, React Query, shared status badge, and shadcn cards.
 * Public/main functions: Default `MyAssessments` page export.
 * Important side effects: Reads local assessment result records scoped to the current user.
 */
import React from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/shared/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';
import { getAssessmentLifecycleSummary } from '@/domain/assessments/summary';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export default function MyAssessments() {
  const { user } = useAuth();

  const { data: results = [], isLoading: isLoadingResults } = useQuery({
    queryKey: ['my-assessment-results'],
    queryFn: () => appClient.entities.AssessmentResult.filter({ participant_email: user?.email }),
    enabled: !!user?.email,
  });
  const { data: registrations = [], isLoading: isLoadingRegs } = useQuery({
    queryKey: ['my-assessment-registrations'],
    queryFn: () => appClient.entities.Registration.filter({ email: user?.email }),
    enabled: !!user?.email,
  });
  
  // Fetch all assessments to match with registrations
  const { data: allAssessments = [], isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['all-assessments'],
    queryFn: () => appClient.entities.Assessment.list(),
  });
  
  const isLoading = isLoadingResults || isLoadingRegs || isLoadingAssessments;
  const passedCount = results.filter((result) => result.passed === true).length;
  const averageScore = results.length > 0
    ? Math.round(results.reduce((sum, result) => sum + (result.percentage || 0), 0) / results.length)
    : 0;
  const postAssessmentCompleted = registrations.filter(
    (registration) => getAssessmentLifecycleSummary(registration).postAssessmentCompleted,
  ).length;

  // Calculate pending assessments
  // Find all assessments for the programs the user is registered in
  const userProgramIds = registrations.map(r => r.program_id);
  const relevantAssessments = allAssessments.filter(a => userProgramIds.includes(a.program_id) && a.status === 'published');
  
  // Filter out the ones that have a result
  const completedAssessmentIds = results.map(r => r.assessment_id);
  const pendingAssessments = relevantAssessments.filter(a => !completedAssessmentIds.includes(a.id));

  return (
    <div>
      <PageHeader title="My Assessments" subtitle={`${results.length} submissions`} />

      {!isLoading && results.length > 0 && (
        <div className="grid sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Submissions</p>
            <p className="mt-2 text-2xl font-bold font-heading">{results.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Passed</p>
            <p className="mt-2 text-2xl font-bold font-heading">{passedCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Average Score</p>
            <p className="mt-2 text-2xl font-bold font-heading">{averageScore}%</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Post-Assessments Done</p>
            <p className="mt-2 text-2xl font-bold font-heading">{postAssessmentCompleted}</p>
          </div>
        </div>
      )}

      {!isLoading && registrations.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Certificate readiness depends on post-assessment completion. Keep your post-assessment submitted and reviewed before final certificate release.
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Assessments */}
          <div>
            <h3 className="text-lg font-semibold font-heading mb-4">Pending Assessments</h3>
            {pendingAssessments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  You have no pending assessments.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingAssessments.map(a => (
                  <Card key={a.id} className="border-accent/40 bg-accent/5">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold">{a.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                        <div className="mt-2">
                          <StatusBadge status="pending" />
                        </div>
                      </div>
                      <div>
                        <Button asChild size="sm">
                          <Link to={`/participant/assessments/${a.id}/take`}>
                            Take Assessment
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Completed Assessments */}
          <div>
            <h3 className="text-lg font-semibold font-heading mb-4">Completed Assessments</h3>
            {results.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <h3 className="font-semibold mb-1">No completed assessments</h3>
                  <p className="text-sm text-muted-foreground">You haven't completed any assessments yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {results.map(r => (
                  <Card key={r.id} className="overflow-hidden">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold">{r.title || 'Assessment Result'}</h4>
                        <div className="flex gap-2 mt-1">
                          <StatusBadge status={r.status} />
                          {r.passed !== undefined && <StatusBadge status={r.passed ? 'passed' : 'failed'} />}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-3">
                        <div>
                          <p className="text-lg font-bold font-heading">{r.percentage != null ? `${r.percentage}%` : '-'}</p>
                          <p className="text-[10px] text-muted-foreground">{r.score}/{r.total_points} points</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/participant/assessments/${r.assessment_id}/take`}>
                            <RotateCcw className="w-3 h-3 mr-2" />
                            Retake
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                    {r.feedback && (
                      <div className="bg-muted/30 p-3 border-t text-sm">
                        <span className="font-medium text-xs uppercase tracking-wider text-muted-foreground block mb-1">Trainer Feedback</span>
                        <p className="text-foreground whitespace-pre-wrap">{r.feedback}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
