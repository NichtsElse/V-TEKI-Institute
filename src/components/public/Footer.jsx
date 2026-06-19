/**
 * Purpose: Render the public footer across non-dashboard pages.
 * Used by: `src/components/layout/PublicLayout.jsx`.
 * Main dependencies: React Router links.
 * Public/main functions: Default `Footer` component export.
 * Important side effects: None.
 */
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const logoSrc = '/v-teki_institute.jpeg';

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-start gap-3">
          <img src={logoSrc} alt="V-TEKI" className="h-12 w-auto object-contain" />
          <div>
          <p className="font-display text-lg font-semibold text-primary">V-TEKI Institute</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Professional learning experiences in AI, data, and digital transformation.
          </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/programs" className="hover:text-foreground">
            Programs
          </Link>
          <Link to="/trainers" className="hover:text-foreground">
            Trainers
          </Link>
          <Link to="/verify-certificate" className="hover:text-foreground">
            Verify Certificate
          </Link>
          <Link to="/register" className="hover:text-foreground">
            Register
          </Link>
        </div>
      </div>
    </footer>
  );
}
