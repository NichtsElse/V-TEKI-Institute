import React from 'react';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/shared/StatusBadge';
import { Building2 } from 'lucide-react';

export default function StudentProgressRow({ registration: reg, payment }) {
  const attendance = reg.attendance_percentage || 0;
  const attendanceColor = attendance >= 80 ? 'bg-success' : attendance >= 50 ? 'bg-warning' : attendance > 0 ? 'bg-destructive' : 'bg-muted';

  const paymentStatus = payment?.status || (reg.status === 'paid' || reg.status === 'confirmed' ? 'paid' : 'pending');

  return (
    <div className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors text-sm">
      {/* Student info */}
      <div className="col-span-4 flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold flex-shrink-0">
          {reg.full_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate text-sm">{reg.full_name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{reg.email}</p>
          {reg.company && (
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground truncate">{reg.company}</span>
            </div>
          )}
        </div>
      </div>

      {/* Registration status */}
      <div className="col-span-2">
        <StatusBadge status={reg.status} />
        {reg.registration_type === 'corporate' && (
          <div className="mt-1">
            <StatusBadge status="corporate" />
          </div>
        )}
      </div>

      {/* Payment status */}
      <div className="col-span-2">
        <StatusBadge status={paymentStatus} />
        {payment?.amount && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Rp {Number(payment.amount).toLocaleString('id-ID')}
          </p>
        )}
      </div>

      {/* Attendance */}
      <div className="col-span-2">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 bg-muted rounded-full h-1.5 max-w-[60px]">
            <div className={cn("h-1.5 rounded-full", attendanceColor)} style={{ width: `${Math.min(attendance, 100)}%` }} />
          </div>
          <span className={cn(
            "text-[11px] font-semibold",
            attendance >= 80 ? 'text-success' : attendance > 0 ? 'text-warning' : 'text-muted-foreground'
          )}>
            {attendance}%
          </span>
        </div>
      </div>

      {/* Completion */}
      <div className="col-span-2">
        <StatusBadge status={reg.completion_status} />
        {reg.post_assessment_score != null && (
          <p className="text-[10px] text-muted-foreground mt-1">Score: {reg.post_assessment_score}%</p>
        )}
      </div>
    </div>
  );
}