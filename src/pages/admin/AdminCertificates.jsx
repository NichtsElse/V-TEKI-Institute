/**
 * Purpose: Manage certificate issuance and downloads for the local MVP admin flow.
 * Used by: Admin route `/admin/certificates`.
 * Main dependencies: Local app client, React Query, PDF generator, and shared table components.
 * Public/main functions: Default `AdminCertificates` page export.
 * Important side effects: Generates local certificate records and downloads certificate PDFs.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Award, Loader2, Download } from 'lucide-react';
import { generateCertificatePDF } from '@/utils/certificatePDF';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function AdminCertificates() {
  const [genDialogOpen, setGenDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [generating, setGenerating] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: certificates = [], isLoading } = useQuery({ queryKey: ['certificates'], queryFn: () => appClient.entities.Certificate.list('-created_date') });
  const { data: batches = [] } = useQuery({ queryKey: ['batches'], queryFn: () => appClient.entities.Batch.list() });
  const { data: registrations = [] } = useQuery({ queryKey: ['registrations'], queryFn: () => appClient.entities.Registration.list() });
  const { data: programs = [] } = useQuery({ queryKey: ['programs'], queryFn: () => appClient.entities.Program.list() });
  const validCertificates = certificates.filter((certificate) => certificate.verification_status === 'valid');
  const eligibleRegistrations = registrations.filter((registration) => appClient.isCertificateEligible(registration));
  const pendingEligibilityCount = registrations.filter(
    (registration) => registration.payment_status === 'paid' && !appClient.isCertificateEligible(registration),
  ).length;
  const averageScore = certificates.length > 0
    ? Math.round(certificates.reduce((sum, certificate) => sum + (certificate.score || 0), 0) / certificates.length)
    : 0;

  const describeError = (error) => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === 'string' && error.trim()) return error;
    if (error && typeof error === 'object') {
      return error.message || error.details || error.hint || error.code || JSON.stringify(error);
    }
    return 'Please try again.';
  };

  const getNextCertificateNumber = (programCode, year, sequence) => {
    const matchingCertificates = certificates.filter((certificate) => certificate.program_code === programCode);
    const maxSequence = matchingCertificates.reduce((highest, certificate) => {
      const suffix = Number.parseInt((certificate.certificate_number || '').split('-').pop() || '0', 10);
      return Number.isFinite(suffix) ? Math.max(highest, suffix) : highest;
    }, 0);
    return `VTK-${year}-${programCode || 'GEN'}-${String(maxSequence + sequence).padStart(6, '0')}`;
  };

  const createCertificateRecord = async (payload, retryCount = 0) => {
    try {
      return await appClient.entities.Certificate.create(payload);
    } catch (error) {
      const isDuplicateNumber = error instanceof Error && /unique|duplicate|23505/i.test(error.message);
      if (isDuplicateNumber && retryCount < 1) {
        const retryPayload = {
          ...payload,
          certificate_number: getNextCertificateNumber(payload.program_code, new Date().getFullYear()),
        };
        return createCertificateRecord(retryPayload, retryCount + 1);
      }
      throw error;
    }
  };

  const generateCertificates = async () => {
    if (!selectedBatch) return;
    setGenerating(true);
    try {
      const batch = batches.find(b => b.id === selectedBatch);
      const program = programs.find(p => p.id === batch?.program_id);
      if (!batch || !program) {
        toast({ title: 'Batch or program not found', variant: 'destructive' });
        return;
      }
      const eligible = registrations.filter((r) =>
        r.batch_id === selectedBatch &&
        appClient.isCertificateEligible({
          ...r,
          min_attendance_pct: program?.min_attendance_pct || 80,
        }) &&
        !r.certificate_id,
      );

      if (eligible.length === 0) {
        toast({ title: 'No eligible participants found for this batch' });
        return;
      }

      const year = new Date().getFullYear();
      let sequence = 1;

      for (const reg of eligible) {
        const certNumber = getNextCertificateNumber(program?.code, year, sequence);
        const cert = await createCertificateRecord({
          certificate_number: certNumber,
          registration_id: reg.id,
          participant_name: reg.full_name,
          participant_email: reg.email,
          program_name: program?.name || reg.program_name,
          program_code: program?.code,
          batch_name: batch?.name,
          completion_date: new Date().toISOString().split('T')[0],
          trainer_name: batch?.trainer_name,
          score: reg.post_assessment_score,
          verification_status: 'valid',
        });
        sequence += 1;
        try {
          await appClient.entities.Registration.update(reg.id, { certificate_id: cert.id });
        } catch (updateError) {
          console.error('[V-TEKI] Failed to link certificate to registration', {
            registrationId: reg.id,
            certificateId: cert.id,
            error: updateError,
          });
        }
        try {
          await generateCertificatePDF({
            ...cert,
            certificate_number: certNumber,
            participant_name: reg.full_name,
            participant_email: reg.email,
            program_name: program?.name || reg.program_name,
            batch_name: batch?.name,
            trainer_name: batch?.trainer_name,
            score: reg.post_assessment_score,
          });
        } catch (pdfError) {
          console.error('[V-TEKI] Failed to generate certificate PDF', {
            registrationId: reg.id,
            certificateId: cert.id,
            error: pdfError,
          });
        }
      }

      setGenDialogOpen(false);
      qc.invalidateQueries({ queryKey: ['certificates'] });
      qc.invalidateQueries({ queryKey: ['registrations'] });
      toast({ title: `${eligible.length} certificates generated` });
    } catch (error) {
      console.error('[V-TEKI] Certificate generation failed', error);
      toast({
        title: 'Failed to generate certificates',
        description: describeError(error),
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (cert) => {
    setDownloading(cert.id);
    try {
      await generateCertificatePDF(cert);
    } finally {
      setDownloading(null);
    }
  };

  const columns = [
    { header: 'Certificate #', cell: (r) => <span className="font-mono text-xs font-medium">{r.certificate_number}</span> },
    { header: 'Participant', accessor: 'participant_name' },
    { header: 'Program', accessor: 'program_name' },
    { header: 'Batch', accessor: 'batch_name' },
    { header: 'Date', cell: (r) => r.completion_date ? format(new Date(r.completion_date), 'MMM d, yyyy') : '-' },
    { header: 'Score', cell: (r) => r.score != null ? `${r.score}%` : '-' },
    { header: 'Status', cell: (r) => <StatusBadge status={r.verification_status} /> },
    { header: '', cell: (r) => (
      <Button
        variant="ghost" size="sm"
        className="h-8 text-secondary hover:text-secondary gap-1.5"
        onClick={() => handleDownload(r)}
        disabled={downloading === r.id}
      >
        {downloading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        PDF
      </Button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Certificates" subtitle={`${certificates.length} certificates`}>
        <Button onClick={() => setGenDialogOpen(true)} className="bg-secondary hover:bg-secondary/90 text-white">
          <Award className="w-4 h-4 mr-2" /> Generate Certificates
        </Button>
      </PageHeader>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Valid Certificates</p>
          <p className="mt-2 text-2xl font-bold font-heading">{validCertificates.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Eligible Participants</p>
          <p className="mt-2 text-2xl font-bold font-heading">{eligibleRegistrations.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Waiting Requirements</p>
          <p className="mt-2 text-2xl font-bold font-heading">{pendingEligibilityCount}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-secondary/20 bg-secondary/5 p-4 text-sm text-muted-foreground">
        Certificate rule for this MVP: payment paid, attendance at least 80%, post-assessment completed, feedback submitted, and completion status completed.
        {averageScore > 0 && <span className="ml-1 text-foreground">Current average certificate score: {averageScore}%.</span>}
      </div>

      <DataTable columns={columns} data={certificates} isLoading={isLoading} emptyMessage="No certificates generated yet." />

      <Dialog open={genDialogOpen} onOpenChange={setGenDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Certificates</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select a batch to generate certificates for participants who already meet the full completion rule.</p>
            <div>
              <Label>Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={generateCertificates}
              disabled={generating || !selectedBatch || !batches.find((batch) => batch.id === selectedBatch)}
              className="bg-secondary hover:bg-secondary/90 text-white"
            >
              {generating && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
