/**
 * Purpose: Render the public top navigation for marketing and catalog pages.
 * Used by: `src/components/layout/PublicLayout.jsx`.
 * Main dependencies: React Router links, button component, auth context, and lucide icons.
 * Public/main functions: Default `Navbar` component export.
 * Important side effects: Reads auth state to switch between dashboard/login actions and toggles the mobile nav menu.
 */
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import { Menu, X, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/programs', label: 'Programs' },
  { to: '/trainers', label: 'Trainers' },

  { to: '/verify-certificate', label: 'Verify Certificate' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const dashboardPath = appClient.getRoleHomePath(user?.role);
  const logoSrc = '/vteki-logo-front.png';

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoSrc} alt="V-TEKI" className="h-10 w-auto object-contain" />
          <div className="hidden sm:block">
            <p className="font-display text-lg font-bold tracking-tight text-primary">V-TEKI</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Institute</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link to={dashboardPath}>
                <Button className="h-10 px-4">Dashboard</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-muted border border-border">
                    {user?.full_name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.full_name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email || "user@example.com"}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/participant/profile" className="flex w-full cursor-pointer items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => appClient.auth.logout("/")} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" className="h-10 px-4">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button className="h-10 px-4">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="mt-2 grid gap-2 border-t border-border/60 pt-3">
              {isAuthenticated ? (
                <>
                  <Link to={dashboardPath} onClick={closeMobileMenu}>
                    <Button className="w-full">Dashboard</Button>
                  </Link>
                  <Link to="/participant/profile" onClick={closeMobileMenu}>
                    <Button variant="outline" className="w-full justify-start">
                      <User className="mr-2 h-4 w-4" /> My Profile
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      closeMobileMenu();
                      appClient.auth.logout("/");
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMobileMenu}>
                    <Button variant="outline" className="w-full">Log in</Button>
                  </Link>
                  <Link to="/register" onClick={closeMobileMenu}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
