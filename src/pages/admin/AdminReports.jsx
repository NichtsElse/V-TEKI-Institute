/**
 * Purpose: Render admin reporting summaries and revenue/participant charts.
 * Used by: Admin reports route/page.
 * Main dependencies: React Query, appClient entity APIs, shadcn cards, lucide icons, and Recharts.
 * Public/main functions: Default `AdminReports` page export.
 * Important side effects: Reads program, registration, payment, and certificate records through appClient.
 */
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, Award, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';

export default function AdminReports() {
  const { data: programs = [] } = useQuery({ queryKey: ['programs'], queryFn: () => appClient.entities.Program.list() });
  const { data: registrations = [] } = useQuery({ queryKey: ['registrations'], queryFn: () => appClient.entities.Registration.list('-created_date') });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: () => appClient.entities.Payment.list('-created_date') });
  const { data: certificates = [] } = useQuery({ queryKey: ['certificates'], queryFn: () => appClient.entities.Certificate.list('-created_date') });

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalParticipants = registrations.length;
  const activePrograms = programs.length;
  const totalCertificates = certificates.length;

  const passRate = totalParticipants > 0 ? Math.round((totalCertificates / totalParticipants) * 100) : 0;

  // Calculate monthly data for the chart
  const revenueData = useMemo(() => {
    const months = {};
    const now = new Date();
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { month: d.toLocaleString('default', { month: 'short' }), revenue: 0, participants: 0 };
    }
    
    registrations.forEach(r => {
      if (r.created_date) {
        const key = r.created_date.substring(0, 7);
        if (months[key]) months[key].participants++;
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Platform Reports</h2>
        <p className="text-muted-foreground">Comprehensive overview of platform performance, revenue, and usage.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(totalRevenue).toLocaleString('id-ID')}</div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              Based on all paid invoices
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-slate-500">Across all batches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePrograms}</div>
            <p className="text-xs text-slate-500">Total programs available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCertificates}</div>
            <p className="text-xs text-slate-500">{passRate}% overall pass rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Revenue & Enrollment Trends</CardTitle>
          <CardDescription>
            Monthly performance metrics for the last 6 months.
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}M`} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  formatter={(value, name) => {
                    if (name === 'Revenue') return [`Rp ${value.toLocaleString('id-ID')}`, name];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                <Line yAxisId="right" type="monotone" dataKey="participants" name="Participants" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
