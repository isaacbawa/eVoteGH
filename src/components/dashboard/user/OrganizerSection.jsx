'use client';

import { db } from '@/lib/api-client';

import React, { useMemo } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Vote, CreditCard, Calendar, Users, Building2, Loader2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '@/components/dashboard/admin/StatsCard';
import { calculateOrganizerPayout } from '@/lib/utils/commission';
import { toast } from 'sonner';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export default function OrganizerSection({ organizer }) {
  const queryClient = useQueryClient();

  // Events scoped to this organizer's event_ids
  const { data: allEvents = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['organizer-events', organizer?.id],
    queryFn: async () => {
      const eventIds = organizer.event_ids || [];
      if (eventIds.length === 0) return [];
      const all = await db.entities.Event.list('-created_date', 100);
      return all.filter(e => eventIds.includes(e.id));
    },
    enabled: !!organizer?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['organizer-transactions', allEvents.map(e => e.id).join(',')],
    queryFn: async () => {
      const all = [];
      for (const ev of allEvents) {
        const txs = await db.entities.VoteTransaction.filter(
          { event_id: ev.id, status: 'confirmed' }, '-created_date', 100
        );
        all.push(...txs);
      }
      return all;
    },
    enabled: allEvents.length > 0,
  });

  const { data: payouts = [], isLoading: loadingPayouts } = useQuery({
    queryKey: ['organizer-payouts', organizer?.id],
    queryFn: () => db.entities.Payout.filter({ organizer_id: organizer.id }, '-created_date'),
    enabled: !!organizer?.id,
  });

  const totalVotes = allEvents.reduce((sum, e) => sum + (e.total_votes || 0), 0);
  const totalRevenue = allEvents.reduce((sum, e) => sum + (parseFloat(e.total_revenue) || 0), 0);

  // Events that have ended voting and don't have a payout request yet
  const payoutEligibleEvents = allEvents.filter(
    e => (e.status === 'voting_closed' || e.status === 'paid_out') &&
         !payouts.find(p => p.event_id === e.id)
  );

  const dailyActivity = useMemo(() => {
    const grouped = {};
    transactions.forEach(tx => {
      const day = format(new Date(tx.created_date), 'MMM d');
      if (!grouped[day]) grouped[day] = { date: day, votes: 0, revenue: 0 };
      grouped[day].votes += tx.votes_cast || 0;
      grouped[day].revenue += parseFloat(tx.amount_ghs) || 0;
    });
    return Object.values(grouped).slice(-14);
  }, [transactions]);

  const requestPayoutMutation = useMutation({
    mutationFn: async (eventId) => {
      const event = allEvents.find(e => e.id === eventId);
      const gross = parseFloat(event.total_revenue) || 0;
      const result = calculateOrganizerPayout(gross);

      return db.entities.Payout.create({
        event_id: eventId,
        organizer_id: organizer.id,
        gross_revenue: gross,
        commission_amount: result.commissionAmount,
        commission_rate: result.commissionRate,
        net_payout: result.netPayout,
        disbursement_method: organizer.disbursement_method,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-payouts', organizer?.id] });
      toast.success('Payout requested! Our team will process it shortly.');
    },
    onError: () => toast.error('Failed to request payout. Please try again.'),
  });

  if (!organizer) return null;

  const isLoading = loadingEvents || loadingPayouts;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border flex-shrink-0">
          <Building2 className="w-7 h-7 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-black truncate">
            {organizer.organization_name || organizer.contact_name}
          </h1>
          <p className="text-sm text-muted-foreground truncate">{organizer.contact_name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className="text-xs gold-gradient text-white border-0">
              {organizer.invite_status === 'accepted' ? 'Active Organizer' : 'Pending Activation'}
            </Badge>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : allEvents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">No events assigned to you yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Contact your admin if you were expecting access to an event.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatsCard title="Your Events" value={allEvents.length} icon={Calendar} color="primary" index={0} />
            <StatsCard title="Total Votes" value={totalVotes.toLocaleString()} icon={Vote} color="accent" index={1} />
            <StatsCard title="Total Revenue" value={`GH₵ ${totalRevenue.toLocaleString()}`} icon={TrendingUp} color="emerald" index={2} />
            <StatsCard title="Pending Payouts" value={payoutEligibleEvents.length} icon={CreditCard} color="accent" index={3} />
          </div>

          {/* Activity Trend */}
          {dailyActivity.length > 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base font-heading">Vote Activity (Last 14 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-52 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyActivity}>
                      <defs>
                        <linearGradient id="orgVoteGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="votes" stroke="#f59e0b" fillOpacity={1} fill="url(#orgVoteGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Events List */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Your Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allEvents.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{e.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{e.status?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold">{(e.total_votes || 0).toLocaleString()} votes</p>
                      <p className="text-xs text-muted-foreground">GH₵ {(parseFloat(e.total_revenue) || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available for Payout */}
          {payoutEligibleEvents.length > 0 && (
            <Card className="border-accent/30 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-base font-heading">Available for Payout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {payoutEligibleEvents.map(e => {
                  const gross = parseFloat(e.total_revenue) || 0;
                  const result = calculateOrganizerPayout(gross);
                  return (
                    <div key={e.id} className="flex items-center justify-between p-4 bg-card rounded-xl border gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{e.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Revenue: GH₵ {gross.toLocaleString()} → Payout: GH₵ {result.netPayout.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => requestPayoutMutation.mutate(e.id)}
                        disabled={requestPayoutMutation.isPending}
                        className="gold-gradient text-white border-0 gap-1 flex-shrink-0"
                      >
                        {requestPayoutMutation.isPending
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <CreditCard className="w-3 h-3" />}
                        Request
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Payout History */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-heading">Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payouts.map(p => {
                  const event = allEvents.find(e => e.id === p.event_id);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{event?.name || 'Event'}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(p.created_date), 'MMM d, yyyy')}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono font-bold">GH₵ {parseFloat(p.net_payout).toFixed(2)}</p>
                        <Badge className={`${STATUS_COLORS[p.status]} text-[10px] capitalize`}>{p.status}</Badge>
                      </div>
                    </div>
                  );
                })}
                {payouts.length === 0 && (
                  <p className="text-center text-muted-foreground py-6 text-sm">No payouts yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
