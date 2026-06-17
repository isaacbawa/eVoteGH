'use client';

import { db } from '@/lib/api-client';

import React from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
import RoleGuard from '@/components/layout/RoleGuard';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

function AdminPayoutsContent() {
  const queryClient = useQueryClient();

  const { data: payouts = [] } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: () => db.entities.Payout.list('-created_date', 100),
  });

  const { data: organizers = [] } = useQuery({
    queryKey: ['admin-organizers-for-payouts'],
    queryFn: () => db.entities.Organizer.list(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['admin-events-for-payouts'],
    queryFn: () => db.entities.Event.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => db.entities.Payout.update(id, {
      status,
      processed_at: status === 'completed' ? new Date().toISOString() : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      toast.success('Payout updated');
    },
  });

  const getOrganizer = (id) => organizers.find(o => o.id === id);
  const getEvent = (id) => events.find(e => e.id === id);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black">Payouts</h1>
        <p className="text-sm text-muted-foreground">Review and process organizer payouts</p>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Event</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Net Payout</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{getEvent(p.event_id)?.name || '—'}</TableCell>
                  <TableCell>{getOrganizer(p.organizer_id)?.organization_name || '—'}</TableCell>
                  <TableCell className="text-right font-mono">GH₵ {parseFloat(p.gross_revenue).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">GH₵ {parseFloat(p.commission_amount).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono font-bold">GH₵ {parseFloat(p.net_payout).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize text-xs">{p.disbursement_method}</Badge></TableCell>
                  <TableCell><Badge className={`${statusColors[p.status]} text-xs capitalize`}>{p.status}</Badge></TableCell>
                  <TableCell className="text-sm">{format(new Date(p.created_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {p.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => updateMutation.mutate({ id: p.id, status: 'completed' })}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateMutation.mutate({ id: p.id, status: 'failed' })}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {payouts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No payouts yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
export default function AdminPayoutsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminPayoutsContent />
    </RoleGuard>
  );
}
