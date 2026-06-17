'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/**
 * RoleGuard — restricts a route to specific roles.
 * Props:
 *   allowedRoles: string[]  e.g. ['admin']
 *   children: ReactNode
 *
 * Role lives in Clerk's publicMetadata.role (set to 'admin' or 'user').
 * Middleware already guarantees the user is signed in for everything
 * under /dashboard, so this only needs to check role.
 */
export default function RoleGuard({ allowedRoles, children }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const role = user?.publicMetadata?.role;

  // Admins bypass all role restrictions — they can access every dashboard
  if (role !== 'admin' && !allowedRoles.includes(role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4 text-3xl">
            🔒
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You do not have permission to access this page.
          </p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return children;
}
