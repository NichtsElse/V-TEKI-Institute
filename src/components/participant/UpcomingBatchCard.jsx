/**
 * Purpose: Render a participant batch card with schedule, access, and attendance progress.
 * Used by: Participant dashboard upcoming and in-progress sections.
 * Main dependencies: React Query, local app client, lucide icons, and shared UI helpers.
 * Public/main functions: Default `UpcomingBatchCard` component export.
 * Important side effects: Reads attendance records for the current enrollment.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Video, Users } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { appClient } from '@/api/appClient';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import UploadPaymentDialog from '@/components/shared/UploadPaymentDialog';
import ParticipantCheckInDialog from '@/components/shared/ParticipantCheckInDialog';

export default function UpcomingBatchCard({ registration, batch, inProgress }) {
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance-records-for-registration', registration?.id],
    queryFn: () => appClient.entities.AttendanceRecord.filter({ registration_id: registration.id }),
    enabled: !!registration?.id,
  });

  if (!batch) {
    return null;
  }

  const today = new Date();
  const startDate = batch.start_date ? new Date(batch.start_date) : null;
  const endDate = batch.end_date ? new Date(batch.end_date) : null;
  const daysUntilStart = startDate ? differenceInDays(startDate, today) : null;
  const isOnline = batch.meeting_link;

  const countdownColor =
    daysUntilStart === null
      ? ''
      : daysUntilStart <= 3
        ? 'text-destructive bg-destructive/10 border-destructive/20'
        : daysUntilStart <= 7
          ? 'text-warning bg-warning/10 border-warning/20'
          : 'text-secondary bg-secondary/10 border-secondary/20';

  return (
    <div
      className={cn(
        'bg-card border rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow',
        inProgress ? 'border-accent/40' : 'border-border',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-semibold font-heading text-sm leading-tight">{registration.program_name || batch.program_name}</h3>
          <p className="text-xs text-muted-foreground mt-1">{batch.name}</p>
        </div>
        {inProgress ? (
          <Badge className="bg-accent/10 text-accent border border-accent/30 text-[10px]">In Progress</Badge>
        ) : (
          daysUntilStart !== null && (
            <Badge className={cn('border text-[10px] font-semibold whitespace-nowrap', countdownColor)}>
              {daysUntilStart === 0 ? 'Today!' : daysUntilStart < 0 ? 'Started' : `${daysUntilStart}d left`}
            </Badge>
          )
        )}
      </div>

      <div className="space-y-2">
        {startDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {format(startDate, 'MMM d, yyyy')}
              {endDate && ` - ${format(endDate, 'MMM d, yyyy')}`}
            </span>
          </div>
        )}
        {batch.sessions && batch.sessions.length > 0 && batch.sessions[0]?.start_time && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{batch.sessions[0].start_time} - {batch.sessions[0].end_time}</span>
          </div>
        )}
        {isOnline ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Video className="w-3.5 h-3.5 flex-shrink-0 text-accent" />
            <a
              href={batch.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline truncate"
            >
              Join Online Class
            </a>
          </div>
        ) : (
          batch.venue && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{batch.venue}</span>
            </div>
          )
        )}
        {batch.trainer_name && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{batch.trainer_name}</span>
          </div>
        )}
      </div>

      {inProgress && registration.attendance_percentage > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Attendance</span>
            <span className={registration.attendance_percentage >= 80 ? 'text-success' : 'text-warning'}>
              {registration.attendance_percentage}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className={cn(
                'h-1.5 rounded-full transition-all',
                registration.attendance_percentage >= 80 ? 'bg-success' : 'bg-warning',
              )}
              style={{ width: `${Math.min(registration.attendance_percentage, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Minimum 80% required for certificate</p>
        </div>
      )}

      {batch.sessions && batch.sessions.length > 0 && (
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {attendanceRecords.length > 0
                ? `${attendanceRecords.length}/${batch.sessions.length} attendance records logged`
                : `${batch.sessions.length} sessions scheduled`}
            </span>
          </div>
          <div className="flex gap-2">
            {(registration.payment_status === 'pending' || registration.payment_status === 'waiting_payment') && (
              <UploadPaymentDialog registrationId={registration.id} />
            )}
            {registration.status === 'confirmed' && (registration.attendance_percentage || 0) < 100 && (
              <ParticipantCheckInDialog 
                registrationId={registration.id} 
                batchId={batch.id} 
                currentAttendance={registration.attendance_percentage}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
