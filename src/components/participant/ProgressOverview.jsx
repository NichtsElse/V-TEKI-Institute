import React from 'react';
import { BookOpen, TrendingUp, CheckCircle, Award } from 'lucide-react';

const stats = [
  { key: 'total', label: 'Total Enrolled', icon: BookOpen, color: 'text-secondary', bg: 'bg-secondary/10' },
  { key: 'active', label: 'In Progress', icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
  { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  { key: 'certificates', label: 'Certificates', icon: Award, color: 'text-warning', bg: 'bg-warning/10' },
];

export default function ProgressOverview({ total, active, completed, certificates }) {
  const values = { total, active, completed, certificates };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ key, label, icon: Icon, color, bg }) => (
        <div key={key} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading leading-none">{values[key] ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}