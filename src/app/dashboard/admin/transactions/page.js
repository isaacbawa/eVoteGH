'use client';

import { db } from '@/lib/api-client';

import React from 'react';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import RoleGuard from '@/components/layout/RoleGuard';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

function AdminTransactionsContent() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['admin-all-transactions'],
    queryFn: () => db.entities.VoteTransaction.list('-created_date', 200),
  });

  const { data: nominees = [] } = useQuery({
    queryKey: ['admin-nominees-for-tx'],
    queryFn: () => db.entities.Nominee.list('-created_date', 500),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['admin-events-for-tx'],
    queryFn: () => db.entities.Event.list(),
  });

  const getNominee = (id) => nominees.find(n => n.id === id);
  const getEvent = (id) => events.find(e => e.id === id);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black">Transactions</h1>
        <p className="text-sm text-muted-foreground">Full vote transaction ledger</p>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Nominee</TableHead>
                <TableHead>Voter</TableHead>
                <TableHead className="text-right">Votes</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="text-sm">{format(new Date(tx.created_date), 'MMM d, h:mm a')}</TableCell>
                  <TableCell className="text-sm">{getEvent(tx.event_id)?.name || '—'}</TableCell>
                  <TableCell className="font-medium text-sm">{getNominee(tx.nominee_id)?.name || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{tx.voter_name || tx.voter_email || 'Anonymous'}</TableCell>
                  <TableCell className="text-right font-mono">{tx.votes_cast}</TableCell>
                  <TableCell className="text-right font-mono">GH₵ {parseFloat(tx.amount_ghs).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[tx.status]} text-xs capitalize`}>{tx.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No transactions yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
export default function AdminTransactionsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminTransactionsContent />
    </RoleGuard>
  );
}
