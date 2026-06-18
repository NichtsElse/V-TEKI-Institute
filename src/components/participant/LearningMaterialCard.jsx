/**
 * Purpose: Show session progress, meeting details, and assessments for a participant enrollment.
 * Used by: `src/pages/participant/StudentDashboard.jsx`.
 * Main dependencies: React Query, date-fns, shadcn badge/progress, and the local app client.
 * Public/main functions: Default `LearningMaterialCard` component export.
 * Important side effects: Reads batch assessments from the local app adapter.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Video, MapPin, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

export default function LearningMaterialCard({ registration, batch }) {
  const [sessionsExpanded, setSessionsExpanded] = useState(false);

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments-for-batch', batch?.id],
    queryFn: () => appClient.entities.Assessment.filter({ batch_id: batch.id }),
    enabled: !!batch?.id,
  });

  if (!batch) return null;

  const sessions = batch.sessions || [];
  const completedSessions = sessions.filter((session) => session.date && isPast(new Date(session.date))).length;
  const sessionProgress = sessions.length > 0 ? Math.round((completedSessions / sessions.length) * 100) : 0;
  const isOnline = Boolean(batch.meeting_link);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold font-heading">{registration.program_name || batch.program_name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{batch.name}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] border shrink-0',
              isOnline ? 'text-accent border-accent/30 bg-accent/5' : 'text-muted-foreground',
            )}
          >
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          {batch.start_date && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {format(new Date(batch.start_date), 'MMM d')}
                {' - '}
                {batch.end_date ? format(new Date(batch.end_date), 'MMM d, yyyy') : '?'}
              </span>
            </div>
          )}
          {batch.trainer_name && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{batch.trainer_name}</span>
            </div>
          )}
          {isOnline && (
            <a
              href={batch.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-accent hover:underline"
            >
              <Video className="w-3.5 h-3.5" />
              Join Meeting Link
            </a>
          )}
          {!isOnline && batch.venue && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{batch.venue}</span>
            </div>
          )}
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Progress</span>
            <span className="text-xs text-muted-foreground">{completedSessions}/{sessions.length} sessions</span>
          </div>
          <Progress value={sessionProgress} className="h-2" />

          <button
            className="mt-3 flex items-center gap-1.5 text-xs text-secondary hover:underline"
            onClick={() => setSessionsExpanded(!sessionsExpanded)}
          >
            {sessionsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {sessionsExpanded ? 'Hide' : 'View'} all {sessions.length} sessions
          </button>

          {sessionsExpanded && (
            <div className="mt-3 space-y-2">
              {sessions.map((session, index) => {
                const sessionDone = session.date && isPast(new Date(session.date));
                return (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg text-xs',
                      sessionDone ? 'bg-success/5 text-muted-foreground' : 'bg-muted/40',
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0',
                        sessionDone ? 'bg-success text-white' : 'bg-border text-muted-foreground',
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{session.title || `Session ${index + 1}`}</p>
                      {session.date && (
                        <p className="text-muted-foreground">
                          {format(new Date(session.date), 'MMM d, yyyy')}
                          {session.start_time && ` - ${session.start_time}`}
                        </p>
                      )}
                    </div>
                    {sessionDone && <span className="text-success text-[10px] font-semibold shrink-0">Done</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {assessments.length > 0 && (
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assessments</p>
          <div className="space-y-2">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/40">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium">{assessment.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px]">
                    {assessment.assessment_type === 'pre_assessment' ? 'Pre' : 'Post'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      assessment.status === 'published'
                        ? 'text-success border-success/30'
                        : assessment.status === 'closed'
                          ? 'text-muted-foreground'
                          : 'text-warning border-warning/30',
                    )}
                  >
                    {assessment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
