/**
 * Purpose: Manage local user roles and invitations for the MVP admin flow.
 * Used by: Admin route `/admin/users`.
 * Main dependencies: Local app client, React Query mutations, and shared data table/dialog components.
 * Public/main functions: Default `AdminUsers` page export.
 * Important side effects: Updates local user roles and creates invited local users.
 */
import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Pencil, UserPlus, Loader2, ShieldCheck, Users, Briefcase, GraduationCap } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { useToast } from '@/components/ui/use-toast';

const roleLabels = {
  super_admin: 'Super Admin',
  academy_admin: 'Academy Admin',
  trainer: 'Trainer',
  corporate_pic: 'Corporate PIC',
  participant: 'Participant',
  user: 'User',
};

export default function AdminUsers() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('participant');
  const [inviting, setInviting] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: () => appClient.entities.User.list() });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appClient.entities.User.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditDialogOpen(false); toast({ title: 'User updated' }); },
  });

  const adminCount = users.filter(u => ['super_admin', 'academy_admin'].includes(u.role)).length;
  const trainerCount = users.filter(u => u.role === 'trainer').length;
  const corporateCount = users.filter(u => u.role === 'corporate_pic').length;
  const participantCount = users.filter(u => ['participant', 'user'].includes(u.role)).length;

  const filtered = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);

  const handleInvite = async () => {
    setInviting(true);
    await appClient.users.inviteUser(inviteEmail, ['super_admin', 'academy_admin'].includes(inviteRole) ? 'admin' : 'user');
    setInviting(false);
    setInviteDialogOpen(false);
    setInviteEmail('');
    toast({ title: 'Invitation sent' });
  };

  const columns = [
    { header: 'Name', cell: (r) => <span className="font-medium">{r.full_name || '-'}</span> },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', cell: (r) => (
      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
        ['super_admin','academy_admin'].includes(r.role) ? 'bg-destructive/10 text-destructive' :
        r.role === 'trainer' ? 'bg-secondary/10 text-secondary' :
        r.role === 'corporate_pic' ? 'bg-accent/10 text-accent' :
        'bg-muted text-muted-foreground'
      }`}>
        {roleLabels[r.role] || r.role || 'User'}
      </span>
    )},
    { header: 'Organization', cell: (r) => <span className="text-xs text-muted-foreground">{r.organization_name || '-'}</span> },
    { header: 'Phone', cell: (r) => <span className="text-xs">{r.phone || '-'}</span> },
    { header: 'Status', cell: (r) => <StatusBadge status={r.status || 'active'} /> },
    { header: '', cell: (r) => (
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelected({...r}); setEditDialogOpen(true); }}>
        <Pencil className="w-3.5 h-3.5" />
      </Button>
    )},
  ];

  const summaryCards = [
    { label: 'Admin', value: adminCount, icon: ShieldCheck, color: 'text-destructive' },
    { label: 'Trainers', value: trainerCount, icon: GraduationCap, color: 'text-secondary' },
    { label: 'Corporate PIC', value: corporateCount, icon: Briefcase, color: 'text-accent' },
    { label: 'Participants', value: participantCount, icon: Users, color: 'text-muted-foreground' },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} users`}>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="academy_admin">Academy Admin</SelectItem>
            <SelectItem value="trainer">Trainer</SelectItem>
            <SelectItem value="corporate_pic">Corporate PIC</SelectItem>
            <SelectItem value="participant">Participant</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setInviteDialogOpen(true)} className="bg-secondary hover:bg-secondary/90 text-white">
          <UserPlus className="w-4 h-4 mr-2" /> Invite User
        </Button>
      </PageHeader>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(card => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
            <card.icon className={`w-5 h-5 mt-0.5 ${card.color}`} />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-bold font-heading">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No users yet." />

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium ml-1">{selected.full_name}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium ml-1">{selected.email}</span></div>
                {selected.organization_name && (
                  <div className="col-span-2"><span className="text-muted-foreground">Organization:</span> <span className="font-medium ml-1">{selected.organization_name}</span></div>
                )}
              </div>
              <div><Label>Role</Label>
                <Select value={selected.role || 'user'} onValueChange={v => setSelected({...selected, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(roleLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={selected.status || 'active'} onValueChange={v => setSelected({...selected, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: selected.id, data: { role: selected.role, status: selected.status } })} className="bg-secondary hover:bg-secondary/90 text-white">Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Email</Label><Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@example.com" /></div>
            <div><Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(roleLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Invited users are created locally with a temporary password <code className="bg-muted px-1 rounded">welcome123</code> for demo purposes.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="bg-secondary hover:bg-secondary/90 text-white">
              {inviting && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
