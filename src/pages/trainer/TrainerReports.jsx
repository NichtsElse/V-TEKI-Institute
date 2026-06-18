/**
 * Purpose: Provide trainers with analytics and reports on their batch performance.
 * Used by: Trainer route `/trainer/reports`.
 * Main dependencies: appClient, React Query, trainer identity helper, and chart components.
 * Public/main functions: Default `TrainerReports` page export.
 * Important side effects: None - display only.
 */
import React from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, CheckCircle, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { resolveTrainerRecord } from '@/domain/trainers/identity';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function TrainerReports() {
  const { user } = useAuth();

  const { data: trainerInfo } = useQuery({
    queryKey: ['trainer-info', user?.id],
    queryFn: async () => {
      const trainers = await appClient.entities.Trainer.list();
      return resolveTrainerRecord(user, trainers);
    },
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['batches-trainer', trainerInfo?.id],
    queryFn: async () => {
      const allBatches = await appClient.entities.Batch.list();
      return allBatches.filter(b => b.trainer_id === trainerInfo?.id);
    },
    enabled: !!trainerInfo?.id,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations'],
    queryFn: () => appClient.entities.Registration.list(),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => appClient.entities.Assessment.list(),
  });

  const { data: results = [] } = useQuery({
    queryKey: ['assessment-results'],
    queryFn: () => appClient.entities.AssessmentResult.list(),
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => appClient.entities.Feedback.list(),
  });

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance-records'],
    queryFn: () => appClient.entities.AttendanceRecord.list(),
  });

  // Prepare batch performance data
  const batchPerformanceData = batches.map(batch => {
    const batchRegs = registrations.filter(r => r.batch_id === batch.id);
    const completedCount = batchRegs.filter(r => r.completion_status === 'completed').length;
    const avgAttendance = batchRegs.length > 0
      ? Math.round(batchRegs.reduce((sum, r) => sum + (r.attendance_percentage || 0), 0) / batchRegs.length)
      : 0;

    return {
      name: batch.name.substring(0, 20),
      participants: batchRegs.length,
      completed: completedCount,
      avgAttendance,
      batchId: batch.id,
    };
  });

  // Prepare completion status data
  const completionStatusData = [
    { name: 'Completed', value: registrations.filter(r => batches.some(b => b.id === r.batch_id) && r.completion_status === 'completed').length },
    { name: 'In Progress', value: registrations.filter(r => batches.some(b => b.id === r.batch_id) && r.completion_status === 'in_progress').length },
    { name: 'Not Started', value: registrations.filter(r => batches.some(b => b.id === r.batch_id) && r.completion_status === 'not_started').length },
  ];

  // Assessment performance
  const assessmentPerf = batches.map(batch => {
    const batchResults = results.filter(r => {
      const assess = assessments.find(a => a.id === r.assessment_id);
      return assess && assess.batch_id === batch.id;
    });

    const avgScore = batchResults.length > 0
      ? Math.round(batchResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / batchResults.length)
      : 0;

    return {
      name: batch.name.substring(0, 15),
      avgScore,
      passCount: batchResults.filter(r => r.passed).length,
      totalAssessments: batchResults.length,
    };
  });

  // Overall stats
  const totalParticipants = registrations.filter(r => batches.some(b => b.id === r.batch_id)).length;
  const totalCompleted = registrations.filter(r => batches.some(b => b.id === r.batch_id) && r.completion_status === 'completed').length;
  const avgAttendanceOverall = totalParticipants > 0
    ? Math.round(registrations
        .filter(r => batches.some(b => b.id === r.batch_id))
        .reduce((sum, r) => sum + (r.attendance_percentage || 0), 0) / totalParticipants)
    : 0;

  const trainerAttendanceRecords = attendanceRecords.filter((record) =>
    batches.some((batch) => batch.id === record.batch_id),
  );
  const attendanceLoggedCount = trainerAttendanceRecords.length;
  const attendanceAverage = trainerAttendanceRecords.length > 0
    ? Math.round(
        trainerAttendanceRecords.reduce((sum, record) => sum + (['present', 'late', 'excused'].includes(record.status) ? 1 : 0), 0)
        / trainerAttendanceRecords.length * 100,
      )
    : 0;

  const batchFeedbacks = feedbacks.filter(f => batches.some(b => b.id === f.batch_id));
  const avgTrainerRating = batchFeedbacks.length > 0
    ? (batchFeedbacks.reduce((sum, f) => sum + (f.trainer_rating || 0), 0) / batchFeedbacks.length).toFixed(1)
    : 0;

  return (
    <div>
      <PageHeader
        title="Performance Reports"
        subtitle={`Analytics for ${batches.length} batches`}
      />

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Participants</p>
              <p className="mt-2 text-2xl font-bold font-heading">{totalParticipants}</p>
            </div>
            <Users className="w-8 h-8 text-muted-foreground/30" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Completed</p>
              <p className="mt-2 text-2xl font-bold font-heading text-success">{totalCompleted}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalParticipants > 0 ? Math.round((totalCompleted / totalParticipants) * 100) : 0}% completion
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-success/30" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg Attendance</p>
              <p className="mt-2 text-2xl font-bold font-heading">{avgAttendanceOverall}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary/30" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Trainer Rating</p>
              <p className="mt-2 text-2xl font-bold font-heading">{avgTrainerRating}</p>
              <p className="text-xs text-muted-foreground mt-1">out of 5.0</p>
            </div>
            <AlertCircle className="w-8 h-8 text-warning/30" />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Attendance Logs</p>
          <p className="mt-2 text-2xl font-bold font-heading">{attendanceLoggedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{attendanceAverage}% attendance status logged as present-like</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Trainer</p>
          <p className="mt-2 text-lg font-semibold font-heading">{trainerInfo?.full_name || user?.full_name || 'Trainer'}</p>
          <p className="text-xs text-muted-foreground mt-1">{trainerInfo?.expertise || 'Assigned trainer profile'}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Batch Performance */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4 text-sm">Batch Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={batchPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="participants" fill="#6366f1" name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Status */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4 text-sm">Overall Completion Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={completionStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                {completionStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assessment Performance */}
      {assessmentPerf.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4 text-sm">Assessment Performance by Batch</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={assessmentPerf}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgScore" stroke="#3b82f6" name="Avg Score %" />
              <Line type="monotone" dataKey="passCount" stroke="#10b981" name="Pass Count" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
