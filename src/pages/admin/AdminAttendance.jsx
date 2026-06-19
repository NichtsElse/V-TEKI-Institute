/**
 * Purpose: Review attendance sessions and participant records for the local MVP admin flow.
 * Used by: Admin route `/admin/attendance`.
 * Main dependencies: Local app client, React Query mutations, shared table components, dialog controls, and attendance summary helper.
 * Public/main functions: Default `AdminAttendance` page export.
 * Important side effects: Creates local attendance sessions/records and updates enrollment attendance percentage.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { calculateAttendancePercentage } from '@/domain/attendance/summary';

export default function AdminAttendance() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState({ registration_id: '', batch_id: '', session_date: '', session_title: '', status: 'present', join_time: '09:00', leave_time: '12:00' });
  const [bulkForm, setBulkForm] = useState({ batch_id: '', session_date: '', session_title: '', status: 'present', join_time: '09:00', leave_time: '12:00' });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: attendanceSessions = [] } = useQuery({ queryKey: ['attendance-sessions'], queryFn: () => appClient.entities.AttendanceSession.list('session_date') });
  const { data: attendanceRecords = [], isLoading } = useQuery({ queryKey: ['attendance-records'], queryFn: () => appClient.entities.AttendanceRecord.list('-created_date') });
  const { data: batches = [] } = useQuery({ queryKey: ['batches'], queryFn: () => appClient.entities.Batch.list() });
  const { data: registrations = [] } = useQuery({ queryKey: ['registrations'], queryFn: () => appClient.entities.Registration.list() });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const existingSession = attendanceSessions.find(
        (session) =>
          session.batch_id === data.batch_id &&
          session.session_date === data.session_date &&
          session.session_title.toLowerCase() === data.session_title.toLowerCase(),
      );

      const session = existingSession || await appClient.entities.AttendanceSession.create({
        batch_id: data.batch_id,
        session_date: data.session_date,
        session_title: data.session_title,
      });

      const record = await appClient.entities.AttendanceRecord.create({
        attendance_session_id: session.id,
        registration_id: data.registration_id,
        batch_id: data.batch_id,
        participant_name: data.participant_name,
        participant_email: data.participant_email,
        session_title: data.session_title,
        session_date: data.session_date,
        status: data.status,
        join_time: data.status === 'present' || data.status === 'late' ? data.join_time : '-',
        leave_time: data.status === 'present' || data.status === 'late' ? data.leave_time : '-',
      });

      const registrationRecords = [...attendanceRecords, record].filter((entry) => entry.registration_id === data.registration_id);
      const attendancePercentage = calculateAttendancePercentage(registrationRecords);
      await appClient.entities.Registration.update(data.registration_id, { attendance_percentage: attendancePercentage });
      return record;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-sessions'] });
      qc.invalidateQueries({ queryKey: ['attendance-records'] });
      qc.invalidateQueries({ queryKey: ['registrations'] });
      setDialogOpen(false);
      toast({ title: 'Attendance recorded' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (!editingRecord) {
        throw new Error('No attendance record selected');
      }

      const session = attendanceSessions.find((entry) => entry.id === editingRecord.attendance_session_id) || await appClient.entities.AttendanceSession.create({
        batch_id: data.batch_id,
        session_date: data.session_date,
        session_title: data.session_title,
      });

      const updated = await appClient.entities.AttendanceRecord.update(editingRecord.id, {
        attendance_session_id: session.id,
        registration_id: data.registration_id,
        batch_id: data.batch_id,
        participant_name: data.participant_name,
        participant_email: data.participant_email,
        session_title: data.session_title,
        session_date: data.session_date,
        status: data.status,
        join_time: data.status === 'present' || data.status === 'late' ? data.join_time : '-',
        leave_time: data.status === 'present' || data.status === 'late' ? data.leave_time : '-',
      });

      const relevantRecords = attendanceRecords
        .filter((entry) => entry.id !== editingRecord.id)
        .concat([updated])
        .filter((entry) => entry.registration_id === data.registration_id);
      const attendancePercentage = calculateAttendancePercentage(relevantRecords);
      await appClient.entities.Registration.update(data.registration_id, { attendance_percentage: attendancePercentage });
      return updated;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-sessions'] });
      qc.invalidateQueries({ queryKey: ['attendance-records'] });
      qc.invalidateQueries({ queryKey: ['registrations'] });
      setDialogOpen(false);
      setEditingRecord(null);
      setForm({ registration_id: '', batch_id: '', session_date: '', session_title: '', status: 'present', join_time: '09:00', leave_time: '12:00' });
      toast({ title: 'Attendance updated' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (record) => {
      await appClient.entities.AttendanceRecord.delete(record.id);
      const remaining = attendanceRecords.filter((entry) => entry.id !== record.id && entry.registration_id === record.registration_id);
      const attendancePercentage = calculateAttendancePercentage(remaining);
      await appClient.entities.Registration.update(record.registration_id, { attendance_percentage: attendancePercentage });
      return record;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-sessions'] });
      qc.invalidateQueries({ queryKey: ['attendance-records'] });
      qc.invalidateQueries({ queryKey: ['registrations'] });
      toast({ title: 'Attendance deleted' });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (data) => {
      const existingSession = attendanceSessions.find(
        (session) =>
          session.batch_id === data.batch_id &&
          session.session_date === data.session_date &&
          session.session_title.toLowerCase() === data.session_title.toLowerCase(),
      );

      const session = existingSession || await appClient.entities.AttendanceSession.create({
        batch_id: data.batch_id,
        session_date: data.session_date,
        session_title: data.session_title,
      });

      const batchRegsLocal = registrations.filter((r) => r.batch_id === data.batch_id);
      
      for (const reg of batchRegsLocal) {
        // Check if record exists
        const exists = attendanceRecords.find(r => r.registration_id === reg.id && r.attendance_session_id === session.id);
        if (!exists) {
          const record = await appClient.entities.AttendanceRecord.create({
            attendance_session_id: session.id,
            registration_id: reg.id,
            batch_id: data.batch_id,
            participant_name: reg.full_name,
            participant_email: reg.email,
            session_title: data.session_title,
            session_date: data.session_date,
            status: data.status,
            join_time: data.status === 'present' || data.status === 'late' ? data.join_time : '-',
            leave_time: data.status === 'present' || data.status === 'late' ? data.leave_time : '-',
          });
          const registrationRecords = [...attendanceRecords, record].filter((entry) => entry.registration_id === reg.id);
          const attendancePercentage = calculateAttendancePercentage(registrationRecords);
          await appClient.entities.Registration.update(reg.id, { attendance_percentage: attendancePercentage });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-sessions'] });
      qc.invalidateQueries({ queryKey: ['attendance-records'] });
      qc.invalidateQueries({ queryKey: ['registrations'] });
      setBulkDialogOpen(false);
      toast({ title: 'Bulk attendance recorded' });
    },
  });

  const filtered = selectedBatch === 'all' ? attendanceRecords : attendanceRecords.filter(a => a.batch_id === selectedBatch);
  const batchRegs = form.batch_id ? registrations.filter((r) => r.batch_id === form.batch_id) : [];
  const presentLikeCount = filtered.filter((record) => ['present', 'late', 'excused'].includes(record.status)).length;
  const attendanceRate = filtered.length > 0 ? Math.round((presentLikeCount / filtered.length) * 100) : 0;
  const sessionCount = selectedBatch === 'all'
    ? attendanceSessions.length
    : attendanceSessions.filter((session) => session.batch_id === selectedBatch).length;

  const columns = [
    { header: 'Participant', cell: (r) => <span className="font-medium">{r.participant_name}</span> },
    { header: 'Session', accessor: 'session_title' },
    { header: 'Date', cell: (r) => r.session_date ? format(new Date(r.session_date), 'MMM d, yyyy') : '-' },
    { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
    { header: 'Join', accessor: 'join_time' },
    { header: 'Leave', accessor: 'leave_time' },
    { header: '', cell: (r) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => {
            setEditingRecord(r);
            setForm({
              registration_id: r.registration_id,
              batch_id: r.batch_id,
              session_date: r.session_date || '',
              session_title: r.session_title || '',
              status: r.status || 'present',
              join_time: r.join_time || '09:00',
              leave_time: r.leave_time || '12:00',
            });
            setDialogOpen(true);
            setSelectedBatch(r.batch_id);
          }}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive"
          onClick={() => deleteMutation.mutate(r)}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Attendance" subtitle={`${attendanceRecords.length} records`}>
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button onClick={() => setBulkDialogOpen(true)} variant="outline">
            Bulk Check-in
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="bg-secondary hover:bg-secondary/90 text-white">
            <Plus className="w-4 h-4 mr-2" /> Mark Attendance
          </Button>
        </div>
      </PageHeader>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Sessions</p>
          <p className="mt-2 text-2xl font-bold font-heading">{sessionCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Filtered Records</p>
          <p className="mt-2 text-2xl font-bold font-heading">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Attendance Rate</p>
          <p className="mt-2 text-2xl font-bold font-heading">{attendanceRate}%</p>
        </div>
      </div>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No attendance records." />

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingRecord(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingRecord ? 'Edit Attendance' : 'Mark Attendance'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Batch</Label>
              <Select value={form.batch_id} onValueChange={v => setForm({...form, batch_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Participant</Label>
              <Select value={form.registration_id} onValueChange={v => setForm({...form, registration_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
                <SelectContent>
                  {batchRegs.map(r => <SelectItem key={r.id} value={r.id}>{r.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Session Date</Label><Input type="date" value={form.session_date} onChange={e => setForm({...form, session_date: e.target.value})} /></div>
            <div><Label>Session Title</Label><Input value={form.session_title} onChange={e => setForm({...form, session_title: e.target.value})} /></div>
            <div><Label>Join Time</Label><Input type="time" value={form.join_time} onChange={e => setForm({...form, join_time: e.target.value})} /></div>
            <div><Label>Leave Time</Label><Input type="time" value={form.leave_time} onChange={e => setForm({...form, leave_time: e.target.value})} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem><SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem><SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              const reg = batchRegs.find(r => r.id === form.registration_id);
              const payload = {
                ...form,
                participant_name: reg?.full_name || '',
                participant_email: reg?.email || '',
              };
              if (editingRecord) {
                updateMutation.mutate(payload);
              } else {
                createMutation.mutate(payload);
              }
            }} disabled={createMutation.isPending || updateMutation.isPending} className="bg-secondary hover:bg-secondary/90 text-white">
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />} {editingRecord ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Check-in</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Batch</Label>
              <Select value={bulkForm.batch_id} onValueChange={v => setBulkForm({...bulkForm, batch_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Session Date</Label><Input type="date" value={bulkForm.session_date} onChange={e => setBulkForm({...bulkForm, session_date: e.target.value})} /></div>
            <div><Label>Session Title</Label><Input value={bulkForm.session_title} onChange={e => setBulkForm({...bulkForm, session_title: e.target.value})} /></div>
            <div><Label>Join Time</Label><Input type="time" value={bulkForm.join_time} onChange={e => setBulkForm({...bulkForm, join_time: e.target.value})} /></div>
            <div><Label>Leave Time</Label><Input type="time" value={bulkForm.leave_time} onChange={e => setBulkForm({...bulkForm, leave_time: e.target.value})} /></div>
            <div><Label>Status</Label>
              <Select value={bulkForm.status} onValueChange={v => setBulkForm({...bulkForm, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem><SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem><SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => bulkMutation.mutate(bulkForm)} disabled={bulkMutation.isPending} className="bg-secondary hover:bg-secondary/90 text-white">
              {bulkMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Bulk Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
