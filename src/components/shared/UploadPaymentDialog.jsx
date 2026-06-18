import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function UploadPaymentDialog({ registrationId, invoiceId, amount, children }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const paymentProofUrl = file ? file.name : 'mock_proof.jpg';

      if (invoiceId && invoiceId.startsWith('payment_')) {
        // Just update the existing payment, DO NOT create a new one!
        await appClient.entities.Payment.update(invoiceId, {
          payment_proof_url: paymentProofUrl,
          payment_reference: `TRX-${Date.now()}`,
          payment_date: new Date().toISOString(),
          status: 'pending_verification',
          invoice_status: 'pending_verification',
        });
      } else {
        // Create a mock payment record
        const paymentData = {
          invoice_id: invoiceId || `inv_mock_${Date.now()}`,
          registration_id: registrationId,
          amount: amount || 0,
          payment_method: 'bank_transfer',
          payment_reference: `TRX-${Date.now()}`,
          payment_proof_url: paymentProofUrl,
          payment_date: new Date().toISOString(),
          status: 'pending_verification',
          created_date: new Date().toISOString(),
        };
        await appClient.entities.Payment.create(paymentData);
      }

      // Update registration status
      if (registrationId) {
        if (registrationId.startsWith('corporateregistration_')) {
          await appClient.entities.CorporateRegistration.update(registrationId, {
            payment_status: 'pending_verification',
            status: 'pending_verification',
          });
        } else {
          await appClient.entities.Registration.update(registrationId, {
            payment_status: 'pending_verification',
            status: 'pending_verification',
          });
        }
      }
      
      // Update invoice if exists
      if (invoiceId && !invoiceId.startsWith('payment_')) {
        await appClient.entities.Invoice.update(invoiceId, {
          invoice_status: 'pending_verification',
        });
      }
    },
    onSuccess: () => {
      toast({
        title: 'Payment Proof Uploaded',
        description: 'Your payment is now pending verification by the admin.',
      });
      qc.invalidateQueries({ queryKey: ['my-registrations'] });
      qc.invalidateQueries({ queryKey: ['corporate-invoices'] });
      setOpen(false);
    },
    onError: (err) => {
      toast({
        title: 'Upload Failed',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleUpload = () => {
    if (!file) {
      toast({ title: 'Error', description: 'Please select a file to upload.', variant: 'destructive' });
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Proof
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Payment Proof</DialogTitle>
          <DialogDescription>
            Please upload a screenshot or PDF of your transfer receipt.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="receipt">Receipt File (JPG, PNG, PDF)</Label>
            <Input 
              id="receipt" 
              type="file" 
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
          {file && (
            <div className="flex items-center gap-2 text-sm text-success bg-success/10 p-3 rounded-lg border border-success/20">
              <CheckCircle2 className="w-4 h-4" />
              <span>{file.name} selected</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={mutation.isPending || !file}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Proof
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
