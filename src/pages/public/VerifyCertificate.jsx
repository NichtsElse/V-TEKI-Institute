import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Search, CheckCircle, XCircle, Award, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function VerifyCertificate() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    
    let certs = [];
    // Try searching by certificate number first
    certs = await appClient.entities.Certificate.filter({ certificate_number: query.trim() });
    
    // If no results, try by email
    if (certs.length === 0) {
      certs = await appClient.entities.Certificate.filter({ participant_email: query.trim().toLowerCase() });
    }

    setResult(certs);
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <section className="bg-primary text-primary-foreground py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Award className="w-12 h-12 mx-auto mb-4 text-accent" />
          <h1 className="text-3xl lg:text-4xl font-bold font-heading mb-3">Certificate Verification</h1>
          <p className="text-primary-foreground/70">Verify the authenticity of V-TEKI Academy certificates.</p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="mb-8">
          <CardContent className="p-6">
            <Label className="text-sm font-medium mb-2 block">Search by Certificate Number or Email</Label>
            <div className="flex gap-3">
              <Input
                placeholder="e.g. VTK-2026-AI-000001 or email@example.com"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading} className="bg-secondary hover:bg-secondary/90 text-white px-6">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {searched && !loading && (
          <>
            {result && result.length > 0 ? (
              <div className="space-y-4">
                {result.map(cert => (
                  <Card key={cert.id} className={cert.verification_status === 'valid' ? 'border-success/30' : 'border-destructive/30'}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        {cert.verification_status === 'valid' ? (
                          <CheckCircle className="w-8 h-8 text-success" />
                        ) : (
                          <XCircle className="w-8 h-8 text-destructive" />
                        )}
                        <div>
                          <h3 className="font-semibold font-heading text-lg">
                            {cert.verification_status === 'valid' ? 'Valid Certificate' : 'Invalid Certificate'}
                          </h3>
                          <p className="text-xs text-muted-foreground">{cert.certificate_number}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Participant</p>
                          <p className="font-medium mt-0.5">{cert.participant_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Program</p>
                          <p className="font-medium mt-0.5">{cert.program_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Completion Date</p>
                          <p className="font-medium mt-0.5">
                            {cert.completion_date ? format(new Date(cert.completion_date), 'MMMM d, yyyy') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Trainer</p>
                          <p className="font-medium mt-0.5">{cert.trainer_name || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-destructive/20">
                <CardContent className="p-8 text-center">
                  <XCircle className="w-12 h-12 text-destructive/40 mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-1">No Certificate Found</h3>
                  <p className="text-sm text-muted-foreground">Please check the certificate number or email address and try again.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
