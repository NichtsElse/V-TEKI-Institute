import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appClient } from '@/api/appClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Users, Calendar, MapPin, Video, UserCog,
  Search, TrendingUp, CreditCard, Award, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import StatusBadge from '@/components/shared/StatusBadge';
import BatchStatBar from '@/components/admin/BatchStatBar';
import StudentProgressRow from '@/components/admin/StudentProgressRow';
import { generateCertificatePDF } from '@/utils/certificatePDF';
import { useToast } from '@/components/ui/use-toast';

export default function BatchDetail() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [generating, setGenerating] = useState(false);

  const { data: batch, isLoading: loadingBatch } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => appClient.entities.Batch.list().then(list => list.find(b => b.id === batchId)),
    enabled: !!batchId,
  });

  const { data: registrations = [], isLoading: loadingRegs } = useQuery({
    queryKey: ['registrations-batch', batchId],
    queryFn: () => appClient.entities.Registration.filter({ batch_id: batchId }),
    enabled: !!batchId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments-batch', batchId],
    queryFn: () => appClient.entities.Payment.list(),
  });

  // Map payments to registration IDs
  const paymentMap = {};
  payments.forEach(p => {
    if (!paymentMap[p.registration_id] || p.status === 'paid') {
      paymentMap[p.registration_id] = p;
    }
  });

  const enriched = registrations.map(reg => ({
    ...reg,
    payment: paymentMap[reg.id] || null,
  }));

  const filtered = enriched.filter(r => {
    const matchSearch = !search ||
      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.company?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Fetch program for passing score / attendance threshold
  const { data: programs = [] } = useQuery({ queryKey: ['programs'], queryFn: () => appClient.entities.Program.list() });
  const { data: existingCerts = [] } = useQuery({ queryKey: ['certificates'], queryFn: () => appClient.entities.Certificate.list() });

  // Eligible = confirmed, completed, ≥80% attendance, no cert yet
  const batchProgram = programs.find(p => p.id === batch?.program_id);
  const minAttendance = batchProgram?.min_attendance_pct || 80;
  const passingScore = batchProgram?.passing_score || 70;
  const certRegIds = new Set(existingCerts.map(c => c.registration_id));

  const eligible = registrations.filter(r =>
    r.completion_status === 'completed' &&
    (r.attendance_percentage || 0) >= minAttendance &&
    (r.post_assessment_score == null || r.post_assessment_score >= passingScore) &&
    !certRegIds.has(r.id)
  );

  const handleGenerateCertificates = async () => {
    if (!batch || eligible.length === 0) return;
    setGenerating(true);
    const year = new Date().getFullYear();
    let counter = existingCerts.filter(c => c.program_code === batchProgram?.code).length;
    const created = [];

    for (const reg of eligible) {
      counter++;
      const certNumber = `VTK-${year}-${batchProgram?.code || 'GEN'}-${String(counter).padStart(6, '0')}`;
      const certData = {
        certificate_number: certNumber,
        registration_id: reg.id,
        participant_name: reg.full_name,
        participant_email: reg.email,
        program_name: batchProgram?.name || reg.program_name,
        program_code: batchProgram?.code,
        batch_name: batch.name,
        completion_date: new Date().toISOString().split('T')[0],
        trainer_name: batch.trainer_name,
        score: reg.post_assessment_score,
        verification_status: 'valid',
      };
      const cert = await appClient.entities.Certificate.create(certData);
      await appClient.entities.Registration.update(reg.id, { certificate_id: cert.id });
      await generateCertificatePDF({ ...certData, id: cert.id });
      created.push(cert);
    }

    qc.invalidateQueries({ queryKey: ['certificates'] });
    qc.invalidateQueries({ queryKey: ['registrations-batch', batchId] });
    setGenerating(false);
    toast({ title: `${created.length} certificate${created.length !== 1 ? 's' : ''} generated & downloaded` });
  };

  // Stats
  const total = registrations.length;
  const paid = registrations.filter(r => ['paid', 'confirmed'].includes(r.status)).length;
  const pending = registrations.filter(r => r.status === 'waiting_payment').length;
  const completed = registrations.filter(r => r.completion_status === 'completed').length;
  const fillRate = batch?.capacity ? Math.round((total / batch.capacity) * 100) : 0;

  if (loadingBatch) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-40 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Batch not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/batches')}>Back to Batches</Button>
      </div>
    );
  }

  const statusFilters = ['all', 'registered', 'waiting_payment', 'paid', 'confirmed', 'cancelled'];

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" onClick={() => navigate('/admin/batches')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Batches
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold font-heading">{batch.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{batch.program_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={batch.status} className="text-sm px-3 py-1" />
            {eligible.length > 0 && (
              <Button
                onClick={handleGenerateCertificates}
                disabled={generating}
                className="bg-secondary hover:bg-secondary/90 text-white gap-2"
              >
                {generating
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Award className="w-4 h-4" />
                }
                {generating ? 'Generating...' : `Generate ${eligible.length} Certificate${eligible.length !== 1 ? 's' : ''}`}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Batch Info Card */}
      <Card>
        <CardContent className="p-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {batch.start_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Schedule</p>
                  <p className="font-medium">{format(new Date(batch.start_date), 'MMM d')} – {batch.end_date ? format(new Date(batch.end_date), 'MMM d, yyyy') : '?'}</p>
                </div>
              </div>
            )}
            {batch.trainer_name && (
              <div className="flex items-center gap-2 text-sm">
                <UserCog className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Trainer</p>
                  <p className="font-medium">{batch.trainer_name}</p>
                </div>
              </div>
            )}
            {batch.meeting_link ? (
              <div className="flex items-center gap-2 text-sm">
                <Video className="w-4 h-4 text-accent flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Delivery</p>
                  <a href={batch.meeting_link} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">Online Class Link</a>
                </div>
              </div>
            ) : batch.venue ? (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Venue</p>
                  <p className="font-medium">{batch.venue}</p>
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Capacity</p>
                <p className="font-medium">{total} / {batch.capacity || '∞'} enrolled</p>
                {batch.capacity && <Progress value={fillRate} className="h-1 mt-1" />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BatchStatBar label="Total Registered" value={total} icon={Users} color="text-secondary" bg="bg-secondary/10" />
        <BatchStatBar label="Payment Complete" value={paid} icon={CreditCard} color="text-success" bg="bg-success/10" />
        <BatchStatBar label="Awaiting Payment" value={pending} icon={TrendingUp} color="text-warning" bg="bg-warning/10" />
        <BatchStatBar label="Course Completed" value={completed} icon={Award} color="text-accent" bg="bg-accent/10" />
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Enrolled Students ({filtered.length})</CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Status filter pills */}
              <div className="flex gap-1.5 flex-wrap">
                {statusFilters.map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                      filterStatus === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {s === 'all' ? 'All' : s.replace('_', ' ')}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-48"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingRegs ? (
            <div className="space-y-px">
              {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted/40 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              {registrations.length === 0 ? 'No students enrolled yet.' : 'No students match your filters.'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-3 px-5 py-2 bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-4">Student</div>
                <div className="col-span-2">Registration</div>
                <div className="col-span-2">Payment</div>
                <div className="col-span-2">Attendance</div>
                <div className="col-span-2">Progress</div>
              </div>
              {filtered.map(reg => (
                <StudentProgressRow key={reg.id} registration={reg} payment={reg.payment} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}