'use client';

import { db } from '@/lib/api-client';

import React from 'react';
import { useUser } from '@clerk/nextjs';

import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Trophy } from 'lucide-react';

import OrganizerSection from '@/components/dashboard/user/OrganizerSection';
import NomineeSection from '@/components/dashboard/user/NomineeSection';

export default function UserDashboard() {
  const { user } = useUser();

  // Check if user has an organizer profile
  const { data: organizerArr = [], isLoading: loadingOrg } = useQuery({
    queryKey: ['my-organizer', user?.id],
    queryFn: () => db.entities.Organizer.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });
  const organizer = organizerArr[0] || null;

  // Check if user has a nominee profile
  const { data: nomineeArr = [], isLoading: loadingNom } = useQuery({
    queryKey: ['my-nominee', user?.id],
    queryFn: () => db.entities.Nominee.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });
  const nominee = nomineeArr.find(n => n.approval_status === 'approved') || nomineeArr[0] || null;

  const isLoading = loadingOrg || loadingNom;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const hasOrganizer = !!organizer;
  const hasNominee = !!nominee;

  if (!hasOrganizer && !hasNominee) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-3xl">
            🔒
          </div>
          <h2 className="font-heading text-xl font-bold mb-2">No Event Access Found</h2>
          <p className="text-muted-foreground text-sm">
            Your account hasn't been linked to any event yet. Please contact your event administrator to be invited as an organizer, or submit a nomination at an event.
          </p>
        </div>
      </div>
    );
  }

  if (hasOrganizer && !hasNominee) {
    return <OrganizerSection organizer={organizer} />;
  }
  if (!hasOrganizer && hasNominee) {
    return <NomineeSection nominee={nominee} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black">My Dashboard</h1>
        <p className="text-sm text-muted-foreground">You have access as both an organizer and a nominee.</p>
      </div>
      <Tabs defaultValue="organizer">
        <TabsList className="mb-6">
          <TabsTrigger value="organizer" className="gap-2">
            <Building2 className="w-4 h-4" /> Organizer
          </TabsTrigger>
          <TabsTrigger value="nominee" className="gap-2">
            <Trophy className="w-4 h-4" /> Nominee
          </TabsTrigger>
        </TabsList>
        <TabsContent value="organizer">
          <OrganizerSection organizer={organizer} />
        </TabsContent>
        <TabsContent value="nominee">
          <NomineeSection nominee={nominee} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
