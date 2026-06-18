/**
 * Purpose: Show the main operational dashboard for the local admin MVP.
 * Used by: Admin route `/admin/dashboard`.
 * Main dependencies: Local app client, React Query, shared stats components, and Recharts.
 * Public/main functions: Default `AdminDashboard` page export.
 * Important side effects: Reads local programs, batches, enrollments, payments, and certificates for summary reporting.
 */
import React from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import StatsCard from '@/components/shared/StatsCard';
import PageHeader from '@/components/shared/PageHeader';
import { 
  BookOpen, Calendar, Users, CreditCard, Award, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
  const { data: programs = [] } = useQuery({ queryKey: ['programs'], queryFn: () => appClient.entities.Program.list() });
  const { data: batches = [] } = useQuery({ queryKey: ['batches'], queryFn: () => appClient.entities.Batch.list() });
  const { data: registrations = [] } = useQuery({ queryKey: ['registrations'], queryFn: () => appClient.entities.Registration.list('-created_date') });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: () => appClient.entities.Payment.list('-created_date') });
  const { data: certificates = [] } = useQuery({ queryKey: ['certificates'], queryFn: () => appClient.entities.Certificate.list('-created_date') });

  const activeBatches = batches.filter(b => b.status === 'open' || b.status === 'closed');
  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
  const completedRegs = registrations.filter(r => r.completion_status === 'completed');
  const completionRate = registrations.length > 0 ? Math.round((completedRegs.length / registrations.length) * 100) : 0;

  // Monthly registration data for chart
  const monthlyData = React.useMemo(() => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { month: d.toLocaleString('default', { month: 'short' }), registrations: 0, revenue: 0 };
    }
    registrations.forEach(r => {
      if (r.created_date) {
        const key = r.created_date.substring(0, 7);
        if (months[key]) months[key].registrations++;
      }
    });
    payments.filter(p => p.status === 'paid').forEach(p => {
      if (p.created_date) {
        const key = p.created_date.substring(0, 7);
        if (months[key]) months[key].revenue += (p.amount || 0);
      }
    });
    return Object.values(months);
  }, [registrations, payments]);

  // Program type distribution
  const typeDistribution = React.useMemo(() => {
    const types = {};
    registrations.forEach(r => {
      // Find the program type for this registration
      let t = 'other';
      if (r.program_id) {
        const p = programs.find(prog => prog.id === r.program_id);
        if (p && p.program_type) t = p.program_type;
      } else if (r.batch_id) {
        const b = batches.find(batch => batch.id === r.batch_id);
        if (b) {
          const p = programs.find(prog => prog.id === b.program_id);
          if (p && p.program_type) t = p.program_type;
        }
      }
      types[t] = (types[t] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  }, [registrations, programs, batches]);

  const recentCertificates = certificates.slice(0, 3);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your Institute operations" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatsCard title="Programs" value={programs.length} icon={BookOpen} iconClassName="bg-secondary/10 text-secondary" />
        <StatsCard title="Active Batches" value={activeBatches.length} icon={Calendar} iconClassName="bg-accent/10 text-accent" />
        <StatsCard title="Participants" value={registrations.length} icon={Users} iconClassName="bg-purple-500/10 text-purple-500" />
        <StatsCard title="Revenue" value={`IDR ${(totalRevenue / 1000000).toFixed(1)}M`} icon={CreditCard} iconClassName="bg-success/10 text-success" />
        <StatsCard title="Certificates" value={certificates.length} icon={Award} iconClassName="bg-warning/10 text-warning" />
        <StatsCard title="Completion" value={`${completionRate}%`} icon={CheckCircle} iconClassName="bg-success/10 text-success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Enrollment Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="registrations" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ fill: 'hsl(var(--chart-1))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} formatter={(v) => [`IDR ${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Program Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={100} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Enrollments</CardTitle></CardHeader>
          <CardContent>
            {registrations.slice(0, 5).map(reg => (
              <div key={reg.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{reg.full_name}</p>
                  <p className="text-xs text-muted-foreground">{reg.program_name || reg.batch_name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    reg.status === 'confirmed' ? 'bg-success/10 text-success' :
                    reg.status === 'waiting_payment' ? 'bg-warning/10 text-warning' :
                    reg.status === 'registered' ? 'bg-secondary/10 text-secondary' :
                    'bg-muted text-muted-foreground'
                  }`}>{reg.status?.replace(/_/g, ' ')}</span>
                  {reg.payment_status && (
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      reg.payment_status === 'paid' ? 'bg-success/10 text-success' :
                      'bg-warning/10 text-warning'
                    }`}>{reg.payment_status}</span>
                  )}
                </div>
              </div>
            ))}
            {registrations.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No enrollments yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Certificates</CardTitle></CardHeader>
          <CardContent>
            {recentCertificates.map(cert => (
              <div key={cert.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{cert.participant_name}</p>
                  <p className="text-xs text-muted-foreground">{cert.program_name}</p>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-success/10 text-success">
                  {cert.verification_status}
                </span>
              </div>
            ))}
            {recentCertificates.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No certificates issued yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
