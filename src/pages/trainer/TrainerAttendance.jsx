/**
 * Purpose: Allow trainers to record and manage attendance for their assigned batch sessions.
 * Used by: Trainer route `/trainer/attendance`.
 * Main dependencies: appClient, React Query, trainer identity helper, and attendance dialog components.
 * Public/main functions: Default `TrainerAttendance` page export.
 * Important side effects: Creates attendance records and calculates attendance percentage.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { resolveTrainerRecord } from '@/domain/trainers/identity';

const formatSafeDate = (value) => {
  if (!value) return '-';
  const date = new Date(`${value}T00:00`);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy');
};

export default function TrainerAttendance() {
  const { user } = useAuth();
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceMarks, setAttendanceMarks] = useState({});
  const [joinTime, setJoinTime] = useState('09:00');
  const [leaveTime, setLeaveTime] = useState('12:00');
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: trainers = [] } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => appClient.entities.Trainer.list(),
  });
  const trainerInfo = resolveTrainerRecord(user, trainers);

  // Get trainer's batches
  const { data: batches = [] } = useQuery({
    queryKey: ['batches-trainer', trainerInfo?.id],
    queryFn: async () => {
      const allBatches = await appClient.entities.Batch.list();
      return allBatches.filter(b => b.trainer_id === trainerInfo?.id);
    },
    enabled: !!trainerInfo?.id,
  });

  // Get attendance sessions for trainer's batches
  const { data: sessions = [] } = useQuery({
    queryKey: ['attendance-sessions-trainer', batches],
    queryFn: async () => {
      const allSessions = await appClient.entities.AttendanceSession.list();
      return allSessions.filter(s => batches.some(b => b.id === s.batch_id));
    },
    enabled: batches.length > 0,
  });

  // Get attendance records
  const { data: records = [] } = useQuery({
    queryKey: ['attendance-records'],
    queryFn: () => appClient.entities.AttendanceRecord.list(),
  });

  // Get registrations
  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations'],
    queryFn: () => appClient.entities.Registration.list(),
  });

  const trainerBatchIds = new Set(batches.map((batch) => batch.id));
  const trainerRegistrationIds = new Set(
    registrations
      .filter((registration) => trainerBatchIds.has(registration.batch_id))
      .map((registration) => registration.id),
  );

  const createAttendanceMutation = useMutation({
    mutationFn: async ({ sessionId, marks, customJoinTime, customLeaveTime }) => {
      const session = sessions.find(s => s.id === sessionId);
      const batch = batches.find(b => b.id === session?.batch_id);
      if (!session || !batch) {
        throw new Error('Session data is not ready yet');
      }
      
      // Get registrations for this batch
      const batchRegistrations = registrations.filter(r => r.batch_id === batch?.id);
      
      // Create or update attendance records
      const recordsToCreate = [];
      for (const reg of batchRegistrations) {
        const existingRecord = records.find(
          r => r.attendance_session_id === sessionId && r.registration_id === reg.id
        );
        
        const status = marks[reg.id] || 'absent';
        
        if (existingRecord) {
          await appClient.entities.AttendanceRecord.update(existingRecord.id, { status });
        } else {
          const record = await appClient.entities.AttendanceRecord.create({
            attendance_session_id: sessionId,
            registration_id: reg.id,
            batch_id: batch?.id,
            participant_name: reg.full_name,
            participant_email: reg.email,
            session_title: session?.session_title,
            session_date: session?.session_date,
            status,
            join_time: status !== 'absent' ? customJoinTime : '-',
            leave_time: status !== 'absent' ? customLeaveTime : '-',
          });
          recordsToCreate.push(record);
        }
      }
      
      // Recalculate attendance percentage for this batch
      const sessionCount = sessions.filter(s => s.batch_id === batch.id).length;
      for (const reg of batchRegistrations) {
        const registrationRecords = records.filter(
          r => r.registration_id === reg.id && batches.find(b => b.id === r.batch_id)
        );
        const presentCount = registrationRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        const percentage = sessionCount > 0 ? Math.round((presentCount / sessionCount) * 100) : 0;
        
        await appClient.entities.Registration.update(reg.id, {
          attendance_percentage: percentage,
        });
      }
      
      return recordsToCreate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-records'] });
      qc.invalidateQueries({ queryKey: ['registrations'] });
      setSessionDialogOpen(false);
      setAttendanceMarks({});
      toast({ title: 'Attendance recorded successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Could not save attendance',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const openSessionDialog = (session) => {
    setSelectedSession(session);
    
    // Load existing marks for this session
    const batch = batches.find(b => b.id === session.batch_id);
    const batchRegistrations = registrations.filter(r => r.batch_id === batch?.id);
    
    const marks = {};
    batchRegistrations.forEach(reg => {
      const record = records.find(
        r => r.attendance_session_id === session.id && r.registration_id === reg.id
      );
      marks[reg.id] = record?.status || 'absent';
    });
    
    setAttendanceMarks(marks);
    setSessionDialogOpen(true);
  };

  const handleSaveAttendance = () => {
    createAttendanceMutation.mutate({
      sessionId: selectedSession.id,
      marks: attendanceMarks,
      customJoinTime: joinTime,
      customLeaveTime: leaveTime,
    });
  };

  const sessionsSummary = sessions.map(s => {
    const recordsForSession = records.filter(r => r.attendance_session_id === s.id);
    const presentCount = recordsForSession.filter(r => r.status === 'present' || r.status === 'late').length;
    return {
      ...s,
      presentCount,
      totalExpected: registrations.filter(r => r.batch_id === s.batch_id).length,
    };
  });

  return (
    <div>
      <PageHeader
        title="Attendance Tracking"
        subtitle={`${sessions.length} sessions scheduled`}
      />

      {!trainerInfo && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          Trainer profile could not be resolved for this account.
        </div>
      )}

      {trainerInfo && batches.length === 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Trainer account found, but no batches are assigned yet.
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Sessions</p>
          <p className="mt-2 text-2xl font-bold font-heading">{sessions.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Expected</p>
          <p className="mt-2 text-2xl font-bold font-heading">
            {registrations.filter(r => batches.some(b => b.id === r.batch_id)).length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg Attendance</p>
          <p className="mt-2 text-2xl font-bold font-heading">
            {sessionsSummary.length > 0
              ? Math.round(
                  sessionsSummary.reduce((sum, s) => sum + s.presentCount, 0) /
                    (sessionsSummary.length * Math.max(1, sessionsSummary[0]?.totalExpected || 1)) *
                    100
                )
              : 0}%
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Mark attendance for each session. This will automatically calculate attendance percentage for each participant.
      </div>

      {sessionsSummary.length > 0 ? (
        <div className="space-y-3">
          {sessionsSummary.map((session) => (
            <div key={session.id} className="rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{session.session_title}</h4>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Date: {formatSafeDate(session.session_date)}</span>
                    <span>Time: {session.start_time} - {session.end_time}</span>
                    <span>Present: {session.presentCount} / {session.totalExpected}</span>
                  </div>
                </div>
                <Button
                  className="whitespace-nowrap"
                  onClick={() => openSessionDialog(session)}
                  size="sm"
                >
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  Mark
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No sessions scheduled for your batches.</p>
        </div>
      )}

      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSession?.session_title}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedSession ? `${formatSafeDate(selectedSession.session_date)} - ${selectedSession?.start_time || '-'} - ${selectedSession?.end_time || '-'}` : '-'}
            </p>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground mb-4">
                Mark attendance for each participant. This will automatically update their attendance percentage.
              </div>

              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Label className="text-xs mb-1">Default Join Time</Label>
                  <Input type="time" value={joinTime} onChange={(e) => setJoinTime(e.target.value)} className="h-8" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs mb-1">Default Leave Time</Label>
                  <Input type="time" value={leaveTime} onChange={(e) => setLeaveTime(e.target.value)} className="h-8" />
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {registrations
                  .filter(r => r.batch_id === selectedSession.batch_id && trainerRegistrationIds.has(r.id))
                  .sort((a, b) => a.full_name.localeCompare(b.full_name))
                  .map((reg) => (
                    <div key={reg.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{reg.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{reg.email}</p>
                      </div>
                      <Select
                        value={attendanceMarks[reg.id] || 'absent'}
                        onValueChange={(value) =>
                          setAttendanceMarks({ ...attendanceMarks, [reg.id]: value })
                        }
                      >
                        <SelectTrigger className="w-24 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="excused">Excused</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAttendance}
              disabled={createAttendanceMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createAttendanceMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
