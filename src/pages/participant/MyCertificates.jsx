/**
 * Purpose: Show certificate history and downloads for the signed-in participant.
 * Used by: Participant route `/participant/certificates`.
 * Main dependencies: Local app client, React Query, PDF generator, and shared status badge component.
 * Public/main functions: Default `MyCertificates` page export.
 * Important side effects: Downloads certificate PDFs from the local generator.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';
import { Award, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { generateCertificatePDF } from '@/utils/certificatePDF';

export default function MyCertificates() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (cert) => {
    setDownloading(cert.id);
    await generateCertificatePDF(cert);
    setDownloading(null);
  };

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => appClient.entities.Certificate.filter({ participant_email: user?.email }),
    enabled: !!user?.email,
  });
  const { data: registrations = [] } = useQuery({
    queryKey: ['my-certificate-eligibility'],
    queryFn: () => appClient.entities.Registration.filter({ email: user?.email }),
    enabled: !!user?.email,
  });
  const sortedCertificates = [...certificates].sort(
    (left, right) => new Date(right.completion_date || right.created_date || 0).getTime() - new Date(left.completion_date || left.created_date || 0).getTime(),
  );
  const validCertificates = sortedCertificates.filter((certificate) => certificate.verification_status === 'valid');
  const latestCertificate = sortedCertificates[0];
  const eligiblePrograms = registrations.filter((registration) => appClient.isCertificateEligible(registration));

  return (
    <div>
      <PageHeader title="My Certificates" subtitle={`${certificates.length} certificates`} />

      {!isLoading && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Valid</p>
            <p className="mt-2 text-2xl font-bold font-heading">{validCertificates.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Eligible Programs</p>
            <p className="mt-2 text-2xl font-bold font-heading">{eligiblePrograms.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Latest Issue Date</p>
            <p className="mt-2 text-sm font-semibold">
              {latestCertificate?.completion_date ? format(new Date(latestCertificate.completion_date), 'MMM d, yyyy') : '-'}
            </p>
          </div>
        </div>
      )}

      {!isLoading && certificates.length === 0 && registrations.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Certificates are released after payment is marked paid, attendance reaches 80% or higher, post-assessment is completed, feedback is submitted, and the program is marked completed.
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1,2].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
        </div>
      ) : certificates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold mb-1">No certificates yet</h3>
            <p className="text-sm text-muted-foreground">Complete the certificate requirements to unlock your certificate.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {sortedCertificates.map(cert => (
            <Card key={cert.id} className="hover:shadow-md transition-shadow border-success/20">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold font-heading">{cert.program_name}</h4>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{cert.certificate_number}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={cert.verification_status} />
                      {cert.completion_date && (
                        <span className="text-[10px] text-muted-foreground">{format(new Date(cert.completion_date), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                    {cert.trainer_name && <p className="text-xs text-muted-foreground mt-1">Trainer: {cert.trainer_name}</p>}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5 text-xs border-success/40 text-success hover:bg-success/10"
                      onClick={() => handleDownload(cert)}
                      disabled={downloading === cert.id}
                    >
                      {downloading === cert.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Download className="w-3 h-3" />}
                      Download PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
