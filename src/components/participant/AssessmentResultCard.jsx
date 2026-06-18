/**
 * Purpose: Render an expandable participant assessment result card with pass/fail detail.
 * Used by: Participant dashboard and assessment history views.
 * Main dependencies: Lucide icons, shadcn badge, date-fns, and UI class helper.
 * Public/main functions: Default `AssessmentResultCard` component export.
 * Important side effects: None.
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AssessmentResultCard({ result }) {
  const [expanded, setExpanded] = useState(false);

  const pct = result.percentage ?? 0;
  const passed = result.passed;
  const assessmentType = result.assessment?.assessment_type;
  const typeLabel =
    assessmentType === 'pre_assessment'
      ? 'Pre-Assessment'
      : assessmentType === 'post_assessment'
        ? 'Post-Assessment'
        : 'Assessment';

  const scoreColor = pct >= 80 ? 'text-success' : pct >= 60 ? 'text-warning' : 'text-destructive';
  const barColor = pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-warning' : 'bg-destructive';

  return (
    <div
      className={cn(
        'bg-card border rounded-xl overflow-hidden',
        passed ? 'border-success/30' : passed === false ? 'border-destructive/30' : 'border-border',
      )}
    >
      <div
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            passed ? 'bg-success/10' : passed === false ? 'bg-destructive/10' : 'bg-muted',
          )}
        >
          {passed === true ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : passed === false ? (
            <XCircle className="w-5 h-5 text-destructive" />
          ) : (
            <Clock className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold font-heading truncate">{result.programName}</h4>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {typeLabel}
            </Badge>
          </div>
          {result.submission_date && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Submitted {format(new Date(result.submission_date), 'MMM d, yyyy')}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-muted rounded-full h-1.5 max-w-[120px]">
              <div className={cn('h-1.5 rounded-full', barColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className={cn('text-sm font-bold font-heading', scoreColor)}>{pct}%</span>
            <span className="text-xs text-muted-foreground">({result.score}/{result.total_points} pts)</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && result.answers && result.answers.length > 0 && (
        <div className="border-t border-border bg-muted/20 px-4 pb-4 pt-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Answer Breakdown</p>
          {result.answers.map((ans, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              {ans.is_correct ? (
                <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <span className="text-muted-foreground">Q{idx + 1}: </span>
                <span>{ans.answer || '-'}</span>
                {ans.points_earned != null && (
                  <span className={cn('ml-2 font-medium', ans.is_correct ? 'text-success' : 'text-muted-foreground')}>
                    +{ans.points_earned}pts
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
