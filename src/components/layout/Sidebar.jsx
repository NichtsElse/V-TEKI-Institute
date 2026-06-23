/**
 * Purpose: Render the authenticated sidebar navigation for each demo role in the MVP.
 * Used by: `src/components/layout/DashboardLayout.jsx`.
 * Main dependencies: React Router, lucide icons, button component, and local app client auth logout.
 * Public/main functions: Default `Sidebar` component export.
 * Important side effects: Navigates between role dashboards and clears the local session on logout.
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, CreditCard,
  ClipboardCheck, Award, MessageSquare, BookOpen, UserCog,
  ChevronLeft, ChevronRight, Shield, BarChart3,
  FileCheck, Menu, X, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { appClient } from '@/api/appClient';
import { cn } from '@/lib/utils';

const navGroups = {
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Programs', icon: BookOpen, path: '/admin/programs' },
    { label: 'Batches', icon: Calendar, path: '/admin/batches' },
    { label: 'Registrations', icon: ClipboardCheck, path: '/admin/registrations' },
    { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { label: 'Assessments', icon: FileCheck, path: '/admin/assessments' },
    { label: 'Attendance', icon: Users, path: '/admin/attendance' },
    { label: 'Certificates', icon: Award, path: '/admin/certificates' },
    { label: 'Feedback', icon: MessageSquare, path: '/admin/feedback' },
    { label: 'Trainers', icon: UserCog, path: '/admin/trainers' },
    { label: 'Assign Roles', icon: Shield, path: '/admin/users' },
    { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  ],
  super_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Programs', icon: BookOpen, path: '/admin/programs' },
    { label: 'Batches', icon: Calendar, path: '/admin/batches' },
    { label: 'Registrations', icon: ClipboardCheck, path: '/admin/registrations' },
    { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { label: 'Assessments', icon: FileCheck, path: '/admin/assessments' },
    { label: 'Attendance', icon: Users, path: '/admin/attendance' },
    { label: 'Certificates', icon: Award, path: '/admin/certificates' },
    { label: 'Feedback', icon: MessageSquare, path: '/admin/feedback' },
    { label: 'Trainers', icon: UserCog, path: '/admin/trainers' },
    { label: 'Assign Roles', icon: Shield, path: '/admin/users' },
    { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  ],
  academy_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Programs', icon: BookOpen, path: '/admin/programs' },
    { label: 'Batches', icon: Calendar, path: '/admin/batches' },
    { label: 'Registrations', icon: ClipboardCheck, path: '/admin/registrations' },
    { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { label: 'Assessments', icon: FileCheck, path: '/admin/assessments' },
    { label: 'Attendance', icon: Users, path: '/admin/attendance' },
    { label: 'Certificates', icon: Award, path: '/admin/certificates' },
    { label: 'Feedback', icon: MessageSquare, path: '/admin/feedback' },
    { label: 'Trainers', icon: UserCog, path: '/admin/trainers' },
    { label: 'Assign Roles', icon: Shield, path: '/admin/users' },
    { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  ],
  trainer: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/trainer/dashboard' },
    { label: 'My Classes', icon: Calendar, path: '/trainer/batches' },
    { label: 'Attendance', icon: ClipboardCheck, path: '/trainer/attendance' },
    { label: 'Assessments', icon: FileCheck, path: '/trainer/assessments' },
    { label: 'Feedback', icon: MessageSquare, path: '/trainer/feedback' },
    { label: 'Reports', icon: BarChart3, path: '/trainer/reports' },
  ],
  corporate_pic: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/corporate/dashboard' },
    { label: 'Participants', icon: ClipboardCheck, path: '/corporate/registrations' },
    { label: 'Invoices', icon: CreditCard, path: '/corporate/invoices' },
    { label: 'Reports', icon: BarChart3, path: '/corporate/reports' },
    { label: 'My Profile', icon: UserCog, path: '/participant/profile' },
  ],
  participant: [
    { label: 'My Dashboard', icon: LayoutDashboard, path: '/participant/dashboard' },
    { label: 'My Programs', icon: BookOpen, path: '/participant/programs' },
    { label: 'Assessments', icon: FileCheck, path: '/participant/assessments' },
    { label: 'Certificates', icon: Award, path: '/participant/certificates' },
    { label: 'My Profile', icon: UserCog, path: '/participant/profile' },
  ],
  user: [
    { label: 'My Dashboard', icon: LayoutDashboard, path: '/participant/dashboard' },
    { label: 'My Programs', icon: BookOpen, path: '/participant/programs' },
    { label: 'Assessments', icon: FileCheck, path: '/participant/assessments' },
    { label: 'Certificates', icon: Award, path: '/participant/certificates' },
    { label: 'My Profile', icon: UserCog, path: '/participant/profile' },
  ]
};

export default function Sidebar({ user }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoSrc = '/v-teki_institute.jpeg';
  const role = user?.role || 'participant';
  const items = navGroups[role] || navGroups.participant;

  const handleLogout = () => {
    appClient.auth.logout('/');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link to="/" className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-colors cursor-pointer",
        collapsed && "justify-center px-2"
      )}>
        <img src={logoSrc} alt="V-TEKI" className="h-10 w-auto flex-shrink-0 object-contain" />
        {!collapsed && (
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground font-heading tracking-tight">V-TEKI</h1>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">Institute</p>
          </div>
        )}
      </Link>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-secondary/20"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className={cn("px-3 py-4 border-t border-sidebar-border", collapsed && "px-2")}>
        {!collapsed ? (
          <Link 
            to="/participant/profile" 
            className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-foreground">
              {user?.full_name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.full_name || 'User'}</p>
              <p className="text-[10px] text-sidebar-foreground/50 capitalize">{role.replace('_', ' ')}</p>
            </div>
          </Link>
        ) : (
          <Link 
            to="/participant/profile" 
            className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors cursor-pointer text-xs font-bold text-sidebar-foreground"
          >
            {user?.full_name?.[0] || 'U'}
          </Link>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full",
            "text-sidebar-foreground/50 hover:text-red-400 hover:bg-sidebar-accent transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle - desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex items-center justify-center py-3 border-t border-sidebar-border text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden bg-card shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-sidebar z-40 transition-all duration-300 flex flex-col",
        collapsed ? "w-[68px]" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <NavContent />
      </aside>

      {/* Spacer */}
      <div className={cn(
        "hidden md:block flex-shrink-0 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-64"
      )} />
    </>
  );
}
