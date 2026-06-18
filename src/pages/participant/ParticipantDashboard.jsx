/**
 * Purpose: Provide a concise participant home dashboard with current learning status, attendance snapshot, and certificate highlights.
 * Used by: Participant route `/participant/dashboard`.
 * Main dependencies: Local app client, React Query, shared stats/status components, and shadcn cards.
 * Public/main functions: Default `ParticipantDashboard` page export.
 * Important side effects: Reads local enrollment, attendance, and certificate records for the current user.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import StatsCard from '@/components/shared/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';
import { BookOpen, Award, FileCheck, TrendingUp, ArrowRight, MessageSquare } from 'lucide-react';

export default function ParticipantDashboard() {
  const { user } = useAuth();

  const { data: registrations = [] } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => appClient.entities.Registration.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => appClient.entities.Certificate.filter({ participant_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['my-attendance-records', user?.email],
    queryFn: () => appClient.entities.AttendanceRecord.filter({ participant_email: user?.email }),
    enabled: !!user?.email,
  });

  const enrolled = registrations.filter(r => ['confirmed', 'paid'].includes(r.status));
  const completed = registrations.filter(r => r.completion_status === 'completed');
  const inProgress = registrations.filter(r => r.completion_status === 'in_progress');
  const feedbackSubmitted = registrations.filter((registration) => registration.feedback_submitted || registration.feedback_status === 'submitted');
  const presentLikeAttendance = attendanceRecords.filter((record) => ['present', 'late', 'excused'].includes(record.status));
  const recentAttendanceRecords = [...attendanceRecords].sort((left, right) => {
    const rightDate = new Date(`${right.session_date || ''}T00:00:00`).getTime();
    const leftDate = new Date(`${left.session_date || ''}T00:00:00`).getTime();

    return rightDate - leftDate;
  });
  const nextProgram = registrations.find((registration) => registration.status === 'registered' || registration.status === 'paid');

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'Student'}`} subtitle="Your learning dashboard" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard title="Enrolled Programs" value={enrolled.length} icon={BookOpen} iconClassName="bg-secondary/10 text-secondary" />
        <StatsCard title="In Progress" value={inProgress.length} icon={TrendingUp} iconClassName="bg-accent/10 text-accent" />
        <StatsCard title="Completed" value={completed.length} icon={FileCheck} iconClassName="bg-success/10 text-success" />
        <StatsCard title="Attendance Logs" value={attendanceRecords.length} icon={MessageSquare} iconClassName="bg-secondary/10 text-secondary" />
        <StatsCard title="Feedback Sent" value={feedbackSubmitted.length} icon={MessageSquare} iconClassName="bg-accent/10 text-accent" />
        <StatsCard title="Certificates" value={certificates.length} icon={Award} iconClassName="bg-warning/10 text-warning" />
      </div>

      {nextProgram && (
        <Card className="mb-6 border-secondary/20">
          <CardHeader>
            <CardTitle className="text-base">Next Demo Milestone</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold">{nextProgram.program_name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Current status: <span className="font-medium text-foreground">{nextProgram.status?.replace(/_/g, ' ')}</span>
              </p>
            </div>
            <Link to="/participant/programs">
              <Button className="bg-secondary hover:bg-secondary/90 text-white">Open My Programs</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Active Programs */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">My Programs</CardTitle>
          <Link to="/participant/programs">
            <Button variant="ghost" size="sm" className="text-xs">View All <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">You haven't enrolled in any programs yet.</p>
              <Link to="/programs"><Button size="sm" className="bg-secondary hover:bg-secondary/90 text-white">Browse Programs</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.slice(0, 5).map(reg => (
                <div key={reg.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">{reg.program_name || reg.batch_name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{reg.batch_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={reg.completion_status} />
                      <StatusBadge status={reg.status} />
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {reg.attendance_percentage > 0 && (
                      <div className="w-24">
                        <p className="text-[10px] text-muted-foreground mb-1">Attendance: {reg.attendance_percentage}%</p>
                        <Progress value={reg.attendance_percentage} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Certificates */}
      {certificates.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">My Certificates</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {certificates.map(cert => (
                <div key={cert.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <h4 className="text-sm font-semibold">{cert.program_name}</h4>
                    <p className="text-xs text-muted-foreground font-mono">{cert.certificate_number}</p>
                  </div>
                  <StatusBadge status={cert.verification_status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Attendance Summary</CardTitle>
          <p className="text-xs text-muted-foreground">
            {presentLikeAttendance.length}/{attendanceRecords.length || 0} attended or excused
          </p>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance records yet.</p>
          ) : (
            <div className="space-y-3">
              {recentAttendanceRecords.slice(0, 6).map((record) => (
                <div key={record.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{record.session_title}</p>
                    <p className="text-xs text-muted-foreground">{record.session_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm capitalize">{record.status}</p>
                    <div className="mt-1 flex justify-end">
                      <StatusBadge status={record.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{record.join_time} - {record.leave_time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
