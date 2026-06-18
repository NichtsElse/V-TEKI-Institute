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
import { QrCode, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';

export default function ParticipantCheckInDialog({ registrationId, batchId, currentAttendance, children }) {
  const [open, setOpen] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!sessionCode) throw new Error('Please enter a session code');
      
      // Simulate validating session code and updating attendance
      const newAttendance = Math.min((currentAttendance || 0) + 20, 100);
      
      await appClient.entities.Registration.update(registrationId, {
        attendance_percentage: newAttendance,
      });

      // Create a mock attendance record
      await appClient.entities.AttendanceRecord.create({
        attendance_session_id: `mock_session_${Date.now()}`,
        registration_id: registrationId,
        batch_id: batchId,
        participant_name: user?.full_name || 'Participant',
        participant_email: user?.email || '',
        session_title: `Session: ${sessionCode}`,
        session_date: new Date().toISOString().split('T')[0],
        status: 'present',
        join_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        leave_time: '-',
      });
      
      return newAttendance;
    },
    onSuccess: (newAttendance) => {
      toast({
        title: 'Check-in Successful!',
        description: `Your attendance is now ${newAttendance}%.`,
      });
      qc.invalidateQueries({ queryKey: ['my-registrations'] });
      qc.invalidateQueries({ queryKey: ['registrations'] });
      setOpen(false);
      setSessionCode('');
    },
    onError: (err) => {
      toast({
        title: 'Check-in Failed',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleCheckIn = () => {
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline" className="gap-2">
            <QrCode className="w-4 h-4" />
            Check-in
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Class Check-in</DialogTitle>
          <DialogDescription>
            Enter the Session Code provided by your trainer or scan the QR code to check in.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sessionCode">Session Code</Label>
            <Input 
              id="sessionCode" 
              placeholder="e.g. AI-DAY1"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleCheckIn} disabled={mutation.isPending || !sessionCode}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Check-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
