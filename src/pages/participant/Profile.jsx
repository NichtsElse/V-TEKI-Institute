import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Building, Save } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { appClient } from '@/api/appClient';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organization: user?.organization_name || 'Individual'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const { checkUserAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (user?.id) {
        await appClient.entities.User.update(user.id, {
          full_name: formData.fullName,
          phone: formData.phone,
          organization_name: formData.organization,
        });

        // Cascade name change to certificates
        if (user.email) {
          const userCerts = await appClient.entities.Certificate.filter({ participant_email: user.email });
          for (const cert of userCerts) {
            await appClient.entities.Certificate.update(cert.id, { participant_name: formData.fullName });
          }

          const userRegs = await appClient.entities.Registration.filter({ email: user.email });
          for (const reg of userRegs) {
            await appClient.entities.Registration.update(reg.id, { full_name: formData.fullName });
          }
        }

        // Update local session since auth session is cached
        const sessionStr = localStorage.getItem('vteki.local.session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session.user) {
            session.user.full_name = formData.fullName;
            session.user.phone = formData.phone;
            session.user.organization_name = formData.organization;
            localStorage.setItem('vteki.local.session', JSON.stringify(session));
          }
        }
        
        await checkUserAuth();
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
        <p className="text-muted-foreground">Manage your personal information and account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details. Some fields like email may require verification.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="fullName" 
                  name="fullName"
                  value={formData.fullName} 
                  onChange={handleChange}
                  className="pl-10" 
                  placeholder="Enter your full name" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="email" 
                  name="email"
                  type="email"
                  value={formData.email} 
                  onChange={handleChange}
                  className="pl-10" 
                  placeholder="Enter your email" 
                  disabled // Email usually requires special flow to change
                />
              </div>
              <p className="text-xs text-muted-foreground">Please contact support to change your email address.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="phone" 
                  name="phone"
                  value={formData.phone} 
                  onChange={handleChange}
                  className="pl-10" 
                  placeholder="Enter your phone number" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organization / Company</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="organization" 
                  name="organization"
                  value={formData.organization} 
                  onChange={handleChange}
                  className="pl-10 bg-slate-50" 
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isLoading} className="bg-slate-900">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
