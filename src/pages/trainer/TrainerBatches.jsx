/**
 * Purpose: Show trainers their assigned batches and batch management options.
 * Used by: Trainer route `/trainer/batches`.
 * Main dependencies: appClient, React Query, trainer identity helper, and detail dialog components.
 * Public/main functions: Default `TrainerBatches` page export.
 * Important side effects: None - display only.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Calendar, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import { resolveTrainerRecord } from '@/domain/trainers/identity';

export default function TrainerBatches() {
  const { user } = useAuth();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

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
      return allBatches
        .filter((batch) => batch.trainer_id === trainerInfo?.id)
        .sort((left, right) => new Date(left.start_date).getTime() - new Date(right.start_date).getTime());
    },
    enabled: !!trainerInfo?.id,
  });

  // Get programs for context
  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => appClient.entities.Program.list(),
  });

  // Get registrations for batch stats
  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations'],
    queryFn: () => appClient.entities.Registration.list(),
  });

  // Get attendance sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['attendance-sessions'],
    queryFn: () => appClient.entities.AttendanceSession.list(),
  });

  // Get assessments
  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => appClient.entities.Assessment.list(),
  });

  const getBatchStats = (batchId) => {
    const batchRegs = registrations.filter(r => r.batch_id === batchId);
    const batchSessions = sessions.filter(s => s.batch_id === batchId);
    const batchAssessments = assessments.filter(a => a.batch_id === batchId);
    
    return {
      enrollmentCount: batchRegs.length,
      sessionsCount: batchSessions.length,
      assessmentCount: batchAssessments.length,
      completedCount: batchRegs.filter(r => r.completion_status === 'completed').length,
    };
  };

  const openBatchDetail = (batch) => {
    setSelectedBatch(batch);
    setDetailDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="My Batches"
        subtitle={`${batches.length} batches assigned${trainerInfo?.full_name ? ` for ${trainerInfo.full_name}` : ''}`}
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Batches</p>
          <p className="mt-2 text-2xl font-bold font-heading">{batches.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Participants</p>
          <p className="mt-2 text-2xl font-bold font-heading">
            {registrations.filter(r => batches.some(b => b.id === r.batch_id)).length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Completed</p>
          <p className="mt-2 text-2xl font-bold font-heading">
            {registrations.filter(r => batches.some(b => b.id === r.batch_id) && r.completion_status === 'completed').length}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Below are all batches assigned to you. Click Details to view participants, sessions, and assessments for each batch.
      </div>

      {batches.length > 0 ? (
        <div className="grid gap-4">
          {batches.map((batch) => {
            const stats = getBatchStats(batch.id);
            return (
              <div key={batch.id} className="rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{batch.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {programs.find(p => p.id === batch.program_id)?.name}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-xs">
                        <p className="text-muted-foreground">Participants</p>
                        <p className="font-semibold text-sm">{stats.enrollmentCount}</p>
                      </div>
                      <div className="text-xs">
                        <p className="text-muted-foreground">Sessions</p>
                        <p className="font-semibold text-sm">{stats.sessionsCount}</p>
                      </div>
                      <div className="text-xs">
                        <p className="text-muted-foreground">Assessments</p>
                        <p className="font-semibold text-sm">{stats.assessmentCount}</p>
                      </div>
                      <div className="text-xs">
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-semibold text-sm">{stats.completedCount}/{stats.enrollmentCount}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <StatusBadge status={batch.status} />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openBatchDetail(batch)}
                      className="whitespace-nowrap"
                    >
                      <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No batches assigned yet.</p>
        </div>
      )}

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBatch?.name}</DialogTitle>
            {selectedBatch && (
              <p className="text-sm text-muted-foreground">
                {selectedBatch.program_name || programs.find((p) => p.id === selectedBatch.program_id)?.name || 'Program'}
                {selectedBatch.trainer_name ? ` • ${selectedBatch.trainer_name}` : ''}
              </p>
            )}
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-6">
              {/* Batch Info */}
              <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                <div>
                  <p className="text-muted-foreground">Program</p>
                  <p className="font-medium">
                    {programs.find(p => p.id === selectedBatch.program_id)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{selectedBatch.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {format(new Date(`${selectedBatch.start_date}T00:00`), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {format(new Date(`${selectedBatch.end_date}T00:00`), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Venue</p>
                  <p className="font-medium">{selectedBatch.venue}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Capacity</p>
                  <p className="font-medium">{selectedBatch.capacity} participants</p>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h4 className="font-semibold mb-3 text-sm">Batch Statistics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-2 bg-muted rounded">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Participants</p>
                      <p className="font-semibold">
                        {getBatchStats(selectedBatch.id).enrollmentCount}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-muted rounded">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                      <p className="font-semibold">
                        {getBatchStats(selectedBatch.id).sessionsCount}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-muted rounded">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Assessments</p>
                      <p className="font-semibold">
                        {getBatchStats(selectedBatch.id).assessmentCount}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-muted rounded">
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="font-semibold">
                        {getBatchStats(selectedBatch.id).completedCount} / {getBatchStats(selectedBatch.id).enrollmentCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scheduled Sessions */}
              <div>
                <h4 className="font-semibold mb-3 text-sm">Scheduled Sessions</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {selectedBatch.sessions && selectedBatch.sessions.length > 0 ? (
                    selectedBatch.sessions.map((sess, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 border rounded text-sm hover:bg-muted">
                        <div>
                          <p className="font-medium">{sess.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(`${sess.date}T00:00`), 'MMM d')} • {sess.start_time} - {sess.end_time}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No sessions scheduled</p>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedBatch.description && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedBatch.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
