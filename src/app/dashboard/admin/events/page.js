'use client';

import { db } from '@/lib/api-client';

import React from 'react';
import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import RoleGuard from '@/components/layout/RoleGuard';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  nomination_open: 'bg-blue-100 text-blue-700',
  nomination_closed: 'bg-orange-100 text-orange-700',
  voting_open: 'bg-emerald-100 text-emerald-700',
  voting_closed: 'bg-gray-100 text-gray-700',
  paid_out: 'bg-purple-100 text-purple-700',
  active: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-700',
};

function AdminEventsContent() {
  const { data: events = [] } = useQuery({
    queryKey: ['admin-events-list'],
    queryFn: () => db.entities.Event.list('-created_date', 100),
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black">Events</h1>
          <p className="text-sm text-muted-foreground">Manage all elections on the platform</p>
        </div>
        <Link href="/dashboard/admin/events/new">
          <Button className="gold-gradient text-white border-0 font-semibold gap-2">
            <Plus className="w-4 h-4" /> Create Event
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Voting Period</TableHead>
                <TableHead className="text-right">Votes</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(event => (
                <TableRow key={event.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="font-medium">{event.name}</div>
                    <div className="text-xs text-muted-foreground">{event.region}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {event.event_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[event.status]} text-xs capitalize`}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(event.voting_start), 'MMM d')} – {format(new Date(event.voting_end), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(event.total_votes || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    GH₵ {(parseFloat(event.total_revenue) || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/admin/events/${event.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs">
                        <Eye className="w-3 h-3" /> Manage
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No events created yet. Click "Create Event" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export default function AdminEventsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminEventsContent />
    </RoleGuard>
  );
}
