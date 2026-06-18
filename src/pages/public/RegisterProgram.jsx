/**
 * Purpose: Collect individual or corporate program inquiries for the local MVP preview.
 * Used by: Public route `/register-program/:batchId`.
 * Main dependencies: React Router params, local app client, React Query, shadcn form controls, and toast feedback.
 * Public/main functions: Default `RegisterProgram` page export.
 * Important side effects: Creates local individual enrollment interest records and corporate inquiry records.
 */
import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle, Loader2, User, Building2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function RegisterProgram() {
  const { batchId } = useParams();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [tab, setTab] = useState('individual');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  const [individual, setIndividual] = useState({ full_name: '', email: '', phone: '', company: '', job_title: '', industry: '' });
  const [corporate, setCorporate] = useState({ company_name: '', pic_name: '', pic_email: '', pic_phone: '', participant_count: 1 });
  const [corporateParticipants, setCorporateParticipants] = useState([{ name: '', email: '' }]);

  const handleParticipantCountChange = (count) => {
    const newCount = Math.max(1, parseInt(count) || 1);
    setCorporate(prev => ({ ...prev, participant_count: newCount }));
    setCorporateParticipants(prev => {
      const newParticipants = [...prev];
      if (newCount > prev.length) {
        for (let i = prev.length; i < newCount; i++) {
          newParticipants.push({ name: '', email: '' });
        }
      } else if (newCount < prev.length) {
        newParticipants.length = newCount;
      }
      return newParticipants;
    });
  };

  React.useEffect(() => {
    if (user) {
      setIndividual(prev => ({ ...prev, full_name: user.full_name || prev.full_name, email: user.email || prev.email }));
      setCorporate(prev => ({ ...prev, pic_name: user.full_name || prev.pic_name, pic_email: user.email || prev.pic_email }));
    }
  }, [user]);

  const { data: batch, isLoading } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: async () => {
      const batches = await appClient.entities.Batch.filter({ id: batchId });
      return batches[0];
    },
  });

  const { data: program } = useQuery({
    queryKey: ['program-for-batch', batch?.program_id],
    queryFn: async () => {
      const programs = await appClient.entities.Program.filter({ id: batch.program_id });
      return programs[0];
    },
    enabled: !!batch?.program_id,
  });

  const handleIndividualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const price = program?.price || 0;
    const initialStatus = price > 0 ? "waiting_payment" : "confirmed";

    const reg = await appClient.entities.Registration.create({
      ...individual,
      batch_id: batchId,
      program_id: batch.program_id,
      program_name: program?.name || batch.program_name,
      batch_name: batch.name,
      registration_type: 'individual',
      status: initialStatus,
      enrollment_status: initialStatus,
      payment_status: price > 0 ? "pending" : "paid",
    });

    if (price > 0) {
      const invNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const payment = await appClient.entities.Payment.create({
        invoice_number: invNum,
        registration_id: reg.id,
        amount: price,
        invoice_status: 'issued',
        status: 'pending',
        payment_method: 'bank_transfer',
        program_name: program?.name || batch.program_name,
        participant_name: individual.full_name,
        created_date: new Date().toISOString(),
      });
      setGeneratedInvoice(payment);
    }

    setLoading(false);
    setSuccess(true);
    toast({ title: 'Enrollment Submitted', description: 'Your registration has been processed successfully.' });
  };

  const handleCorporateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const price = program?.price || 0;
    const totalAmount = price * corporate.participant_count;
    const initialStatus = totalAmount > 0 ? "waiting_payment" : "submitted";

    const reg = await appClient.entities.CorporateRegistration.create({
      ...corporate,
      participants: corporateParticipants,
      batch_id: batchId,
      program_id: batch.program_id,
      program_name: program?.name || batch.program_name,
      batch_name: batch.name,
      status: initialStatus,
      total_amount: totalAmount,
    });

    // Create individual registrations for each participant
    for (const participant of corporateParticipants) {
      if (participant.name || participant.email) {
        await appClient.entities.Registration.create({
          full_name: participant.name,
          email: participant.email,
          phone: '',
          company: corporate.company_name,
          organization_name: corporate.company_name,
          user_id: user?.id,
          batch_id: batchId,
          program_id: batch.program_id,
          program_name: program?.name || batch.program_name,
          batch_name: batch.name,
          registration_type: 'corporate',
          corporate_registration_id: reg.id,
          status: initialStatus,
          enrollment_status: initialStatus,
          payment_status: initialStatus === 'waiting_payment' ? 'pending' : 'paid',
        });
      }
    }

    if (totalAmount > 0) {
      const invNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const payment = await appClient.entities.Payment.create({
        invoice_number: invNum,
        registration_id: reg.id,
        amount: totalAmount,
        invoice_status: 'issued',
        status: 'pending',
        payment_method: 'bank_transfer',
        program_name: program?.name || batch.program_name,
        organization_name: corporate.company_name,
        participant_name: corporate.pic_name,
        created_date: new Date().toISOString(),
      });
      setGeneratedInvoice(payment);
    }

    setLoading(false);
    setSuccess(true);
    toast({ title: 'Corporate Registration Submitted', description: 'Your registration has been submitted for review.' });
  };

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=/register-program/${batchId}`} replace />;
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-10">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold font-heading mb-2">Registration Received!</h2>
            {generatedInvoice ? (
              <div className="mt-6 mb-8 rounded-lg bg-muted/50 p-6 text-left">
                <p className="mb-4 text-sm text-muted-foreground text-center">Your invoice has been automatically generated.</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Invoice No:</span>
                    <span className="font-bold">{generatedInvoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-bold text-lg text-primary">IDR {generatedInvoice.amount?.toLocaleString()}</span>
                  </div>
                  <div className="pt-2">
                    <span className="block text-muted-foreground mb-1">Please transfer to:</span>
                    <span className="block font-semibold">Bank Mandiri</span>
                    <span className="block font-mono text-lg tracking-wider">123-456-789-0123</span>
                    <span className="block text-xs mt-1">a/n V-TEKI Institute</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mb-6 text-sm text-muted-foreground">Your registration is confirmed. We will notify you with the next steps.</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/programs" className="flex-1">
                <Button variant="outline" className="w-full">Browse Programs</Button>
              </Link>
              <Link to="/participant/dashboard" className="flex-1">
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-white">My Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="bg-primary text-primary-foreground py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={`/programs/${batch?.program_id}`} className="inline-flex items-center gap-2 text-sm text-primary-foreground/60 hover:text-primary-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Program
          </Link>
          <h1 className="text-2xl font-bold font-heading">Join {program?.name || batch?.program_name}</h1>
          <p className="text-primary-foreground/70 text-sm mt-1">Batch: {batch?.name}</p>
          {batch?.start_date && (
            <p className="text-primary-foreground/60 text-xs mt-1">
              {format(new Date(batch.start_date), 'MMM d, yyyy')}{batch.end_date && ` - ${format(new Date(batch.end_date), 'MMM d, yyyy')}`}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6 border-secondary/20">
          <CardContent className="p-5">
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Program</p>
                <p className="font-medium mt-1">{program?.name || batch?.program_name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Format</p>
                <p className="font-medium mt-1 capitalize">{program?.delivery_mode || 'Hybrid'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Fee</p>
                <p className="font-medium mt-1">{program?.price ? `IDR ${program.price.toLocaleString()}` : 'Free'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 w-full">
            <TabsTrigger value="individual" className="flex-1 gap-2"><User className="w-4 h-4" />Individual</TabsTrigger>
            <TabsTrigger value="corporate" className="flex-1 gap-2"><Building2 className="w-4 h-4" />Corporate</TabsTrigger>
          </TabsList>

          <TabsContent value="individual">
            <Card>
              <CardHeader><CardTitle>Individual Enrollment Request</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleIndividualSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Full Name *</Label><Input required value={individual.full_name} onChange={e => setIndividual({...individual, full_name: e.target.value})} /></div>
                    <div><Label>Email *</Label><Input type="email" required value={individual.email} onChange={e => setIndividual({...individual, email: e.target.value})} /></div>
                    <div><Label>Phone</Label><Input value={individual.phone} onChange={e => setIndividual({...individual, phone: e.target.value})} /></div>
                    <div><Label>Company</Label><Input value={individual.company} onChange={e => setIndividual({...individual, company: e.target.value})} /></div>
                    <div><Label>Job Title</Label><Input value={individual.job_title} onChange={e => setIndividual({...individual, job_title: e.target.value})} /></div>
                    <div><Label>Industry</Label><Input value={individual.industry} onChange={e => setIndividual({...individual, industry: e.target.value})} /></div>
                  </div>
                  {program?.price > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-bold text-lg ml-2">IDR {program.price.toLocaleString()}</span>
                    </div>
                  )}
                  <Button type="submit" disabled={loading} className="w-full bg-secondary hover:bg-secondary/90 text-white">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Submit Enrollment Request
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Your request will be stored as a local MVP inquiry and can be reviewed from the admin side.
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="corporate">
            <Card>
              <CardHeader><CardTitle>Corporate Training Inquiry</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCorporateSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Company Name *</Label><Input required value={corporate.company_name} onChange={e => setCorporate({...corporate, company_name: e.target.value})} /></div>
                    <div><Label>PIC Name *</Label><Input required value={corporate.pic_name} onChange={e => setCorporate({...corporate, pic_name: e.target.value})} /></div>
                    <div><Label>PIC Email *</Label><Input type="email" required value={corporate.pic_email} onChange={e => setCorporate({...corporate, pic_email: e.target.value})} /></div>
                    <div><Label>PIC Phone</Label><Input value={corporate.pic_phone} onChange={e => setCorporate({...corporate, pic_phone: e.target.value})} /></div>
                    <div><Label>Number of Participants</Label><Input type="number" min="1" value={corporate.participant_count} onChange={e => handleParticipantCountChange(e.target.value)} /></div>
                  </div>
                  
                  {corporateParticipants.length > 0 && (
                    <div className="mt-6 border-t border-border pt-4">
                      <h3 className="font-semibold text-sm mb-3">Participant Details</h3>
                      <div className="space-y-3">
                        {corporateParticipants.map((p, idx) => (
                          <div key={idx} className="grid sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                            <div>
                              <Label className="text-xs">Participant {idx + 1} Name</Label>
                              <Input className="h-8 mt-1" required value={p.name} onChange={e => {
                                const newP = [...corporateParticipants];
                                newP[idx].name = e.target.value;
                                setCorporateParticipants(newP);
                              }} />
                            </div>
                            <div>
                              <Label className="text-xs">Participant {idx + 1} Email</Label>
                              <Input type="email" className="h-8 mt-1" required value={p.email} onChange={e => {
                                const newP = [...corporateParticipants];
                                newP[idx].email = e.target.value;
                                setCorporateParticipants(newP);
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {program?.price > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 text-sm">
                      <span className="text-muted-foreground">Estimated Total ({corporate.participant_count} participants):</span>
                      <span className="font-bold text-lg ml-2">IDR {(program.price * corporate.participant_count).toLocaleString()}</span>
                    </div>
                  )}
                  <Button type="submit" disabled={loading} className="w-full bg-secondary hover:bg-secondary/90 text-white">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Submit Corporate Inquiry
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Corporate submissions are stored locally for preview and can later be converted into participant enrollments.
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
