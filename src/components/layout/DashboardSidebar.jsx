'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Vote, LayoutDashboard, Calendar, Users, CreditCard,
  LogOut, UserCircle, FileText, Shield
} from 'lucide-react';

const adminLinks = [
  { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Events', href: '/dashboard/admin/events', icon: Calendar },
  { label: 'Organizers', href: '/dashboard/admin/organizers', icon: Users },
  { label: 'Payouts', href: '/dashboard/admin/payouts', icon: CreditCard },
  { label: 'Transactions', href: '/dashboard/admin/transactions', icon: FileText },
];

const userLinks = [
  { label: 'My Dashboard', href: '/dashboard/user', icon: LayoutDashboard },
];

export default function DashboardSidebar({ role }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();

  const links = role === 'admin' ? adminLinks : userLinks;

  const handleLogout = () => signOut({ redirectUrl: '/' });

  return (
    <div className="w-64 h-screen flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <Vote className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-foreground">
            eVote<span className="text-gold">GH</span>
          </span>
        </Link>
      </div>

      <div className="px-4 mb-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent">
          <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.fullName || user?.primaryEmailAddress?.emailAddress || 'User'}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize flex items-center gap-1">
              {role === 'admin' && <Shield className="w-3 h-3" />}
              {role === 'user' ? 'Event Member' : role}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-0.5 py-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start gap-3 font-medium h-10 ${
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
