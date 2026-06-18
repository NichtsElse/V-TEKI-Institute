import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { resolveCorporateOrganizationName } from '@/domain/corporate/scope';
import { useToast } from '@/components/ui/use-toast';

export default function RegisterEmployeesDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('');
  
  // Default 3 inputs for 3 people
  const [participants, setParticipants] = useState([
    { email: '', fullName: '' },
    { email: '', fullName: '' },
    { email: '', fullName: '' },
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available batches
  const { data: batches = [] } = useQuery({
    queryKey: ['batches-all'],
    queryFn: () => appClient.entities.Batch.list(),
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs-all'],
    queryFn: () => appClient.entities.Program.list(),
  });

  // Enrich batches with program names
  const availableBatches = batches
    .filter((b) => b.status === 'open' || b.status === 'published')
    .map((b) => {
      const p = programs.find((prog) => prog.id === b.program_id);
      return { ...b, program_name: p?.name || 'Unknown Program' };
    });

  const handleParticipantChange = (index, field, value) => {
    const newParticipants = [...participants];
    newParticipants[index][field] = value;
    setParticipants(newParticipants);
  };

  const addRow = () => {
    setParticipants([...participants, { email: '', fullName: '' }]);
  };

  const removeRow = (index) => {
    if (participants.length > 1) {
      const newParticipants = participants.filter((_, i) => i !== index);
      setParticipants(newParticipants);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBatch) {
      toast({ title: 'Error', description: 'Please select a batch.', variant: 'destructive' });
      return;
    }
    
    // Filter out completely empty rows
    const validParticipants = participants.filter(p => p.email.trim() !== '');
    
    if (validParticipants.length === 0) {
      toast({ title: 'Error', description: 'Please enter at least one participant with a valid email.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Resolve Organization Name
      const registrations = await appClient.entities.Registration.list();
      const orgName = resolveCorporateOrganizationName(user, registrations, []);

      const batch = availableBatches.find(b => b.id === selectedBatch);

      const newRegs = [];

      // 2. Process valid participants
      for (const p of validParticipants) {
        const email = p.email.trim();
        const fullName = p.fullName.trim() || email.split('@')[0];
        
        const regData = {
          user_id: user?.id,
          email: email,
          full_name: fullName,
          batch_id: selectedBatch,
          program_name: batch?.program_name,
          batch_name: batch?.batch_name,
          organization_name: orgName,
          registration_type: 'corporate',
          status: 'confirmed',
          completion_status: 'in_progress',
          attendance_percentage: 0,
          feedback_submitted: false
        };
        
        await appClient.entities.Registration.create(regData);
        newRegs.push(regData);
      }

      // Create Invoice
      if (newRegs.length > 0 && batch) {
         const prog = programs.find(p => p.id === batch.program_id);
         const pricePerPax = prog?.price || 0;
         const totalAmount = pricePerPax * newRegs.length;
         
         await appClient.entities.Payment.create({
           invoice_number: `INV-${Date.now()}`,
           registration_id: newRegs[0].id || `grp_${Date.now()}`, // Link to the first registration or group ID
           organization_name: orgName,
           amount: totalAmount,
           invoice_status: 'issued',
           status: 'pending',
           payment_method: 'bank_transfer',
           program_name: prog?.name || batch.program_name,
           participant_name: user?.full_name || 'Corporate PIC',
           due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
           created_date: new Date().toISOString()
         });
      }

      toast({
        title: 'Success',
        description: `Successfully registered ${newRegs.length} employees.`,
      });
      
      // Reset form & close
      setParticipants([
        { email: '', fullName: '' },
        { email: '', fullName: '' },
        { email: '', fullName: '' },
      ]);
      setSelectedBatch('');
      setOpen(false);
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['corporate-participant-list'] });
      queryClient.invalidateQueries({ queryKey: ['corporate-invoices'] });
      
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to register employees. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Register Employees
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Employees</DialogTitle>
          <DialogDescription>
            Enroll your employees to a specific class batch. A consolidated invoice will be generated.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="batch">Class Batch</Label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger>
                <SelectValue placeholder="Select a batch..." />
              </SelectTrigger>
              <SelectContent>
                {availableBatches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.program_name} - {b.batch_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Participant Details</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addRow} className="h-8 px-2 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Row
              </Button>
            </div>
            
            <div className="space-y-3">
              {participants.map((p, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input 
                      placeholder="Email Address" 
                      value={p.email} 
                      onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input 
                      placeholder="Full Name (Optional)" 
                      value={p.fullName} 
                      onChange={(e) => handleParticipantChange(index, 'fullName', e.target.value)}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeRow(index)}
                    disabled={participants.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Registration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
