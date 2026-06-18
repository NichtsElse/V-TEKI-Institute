/**
 * Purpose: Render a compact visual badge for domain statuses across the local MVP.
 * Used by: Admin, participant, and shared list/detail components.
 * Main dependencies: shadcn badge component and local class name helper.
 * Public/main functions: Default `StatusBadge` component export.
 * Important side effects: None.
 */
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles = {
  // General
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground',
  
  // Program
  published: 'bg-success/10 text-success border-success/20',
  archived: 'bg-muted text-muted-foreground',
  
  // Batch
  open: 'bg-secondary/10 text-secondary border-secondary/20',
  closed: 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-success/10 text-success border-success/20',
  
  // Registration
  registered: 'bg-secondary/10 text-secondary border-secondary/20',
  waiting_payment: 'bg-warning/10 text-warning border-warning/20',
  paid: 'bg-success/10 text-success border-success/20',
  confirmed: 'bg-accent/10 text-accent border-accent/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  
  // Payment
  issued: 'bg-secondary/10 text-secondary border-secondary/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  refunded: 'bg-muted text-muted-foreground',
  
  // Completion
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-secondary/10 text-secondary border-secondary/20',
  
  // Assessment
  submitted: 'bg-secondary/10 text-secondary border-secondary/20',
  graded: 'bg-success/10 text-success border-success/20',
  reviewed: 'bg-accent/10 text-accent border-accent/20',
  
  // Attendance
  present: 'bg-success/10 text-success border-success/20',
  absent: 'bg-destructive/10 text-destructive border-destructive/20',
  late: 'bg-warning/10 text-warning border-warning/20',
  excused: 'bg-muted text-muted-foreground',
  
  // Certificate
  eligible: 'bg-success/10 text-success border-success/20',
  valid: 'bg-success/10 text-success border-success/20',
  invalid: 'bg-destructive/10 text-destructive border-destructive/20',
  revoked: 'bg-destructive/10 text-destructive border-destructive/20',
  
  // Boolean
  true: 'bg-success/10 text-success border-success/20',
  false: 'bg-muted text-muted-foreground',
  passed: 'bg-success/10 text-success border-success/20',
};

export default function StatusBadge({ status, className }) {
  if (!status) return null;
  const key = String(status).toLowerCase();
  const label = key.replace(/_/g, ' ');
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[10px] font-semibold uppercase tracking-wider border",
        statusStyles[key] || 'bg-muted text-muted-foreground',
        className
      )}
    >
      {label}
    </Badge>
  );
}
