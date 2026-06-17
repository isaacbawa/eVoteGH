'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

const VALID_ROLES = ['admin', 'user'];

export default function DashboardRootLayout({ children }) {
  const { user, isLoaded } = useUser();
  const [open, setOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const role = user?.publicMetadata?.role;

  if (!VALID_ROLES.includes(role)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            Your account does not have permission to access the dashboard. Please contact an administrator.
          </p>
          <Button variant="outline" onClick={() => { window.location.href = '/'; }}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden lg:block">
        <DashboardSidebar role={role} />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <DashboardSidebar role={role} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden h-14 border-b flex items-center px-4 bg-card">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="ml-3 font-heading font-semibold">eVoteGH</span>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
