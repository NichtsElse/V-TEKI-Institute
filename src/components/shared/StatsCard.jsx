import React from 'react';
import { cn } from '@/lib/utils';

export default function StatsCard({ title, value, icon: Icon, trend, trendLabel, className, iconClassName }) {
  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-5 relative overflow-hidden group hover:shadow-lg transition-all duration-300",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold font-heading text-foreground">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                "text-xs font-semibold",
                trend >= 0 ? "text-success" : "text-destructive"
              )}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
          iconClassName || "bg-secondary/10 text-secondary"
        )}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
    </div>
  );
}