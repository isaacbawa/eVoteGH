'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function DashboardIndexPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const role = user.publicMetadata?.role;
    if (role === 'admin') {
      router.replace('/dashboard/admin');
    } else if (role === 'user') {
      router.replace('/dashboard/user');
    } else {
      router.replace('/');
    }
  }, [isLoaded, user, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
}
