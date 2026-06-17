'use client';

import { db } from '@/lib/api-client';

import React, { useMemo } from 'react';
import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, Plus, ArrowRight, Vote, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '@/components/dashboard/admin/StatsCard';
import RoleGuard from '@/components/layout/RoleGuard';

function AdminDashboardContent() {
  const { data: events = [] } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => db.entities.Event.list('-created_date', 50),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: () => db.entities.VoteTransaction.filter({ status: 'confirmed' }, '-created_date', 100),
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: () => db.entities.Payout.list('-created_date', 50),
  });

  const totalRevenue = events.reduce((sum, e) => sum + (parseFloat(e.total_revenue) || 0), 0);
  const totalVotes = events.reduce((sum, e) => sum + (e.total_votes || 0), 0);
  const activeEvents = events.filter(e => e.status === 'active' || e.status === 'voting_open').length;
  const pendingPayouts = payouts.filter(p => p.status === 'pending').length;

  const chartData = useMemo(() => {
    const grouped = {};
    transactions.forEach(tx => {
      const day = format(new Date(tx.created_date), 'MMM d');
      grouped[day] = (grouped[day] || 0) + (parseFloat(tx.amount_ghs) || 0);
    });
    return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue })).slice(-14);
  }, [transactions]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform overview and management</p>
        </div>
        <Link href="/dashboard/admin/events/new">
          <Button className="gold-gradient text-white border-0 font-semibold gap-2">
            <Plus className="w-4 h-4" /> New Event
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Revenue" value={`GH₵ ${totalRevenue.toLocaleString()}`} icon={CreditCard} color="accent" index={0} />
        <StatsCard title="Total Votes" value={totalVotes.toLocaleString()} icon={Vote} color="primary" index={1} />
        <StatsCard title="Active Events" value={activeEvents} icon={Calendar} color="emerald" index={2} />
        <StatsCard title="Pending Payouts" value={pendingPayouts} icon={TrendingUp} color="destructive" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Revenue Trend (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(245 58% 51%)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(245 58% 51%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(245 58% 51%)" fillOpacity={1} fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-heading">Recent Events</CardTitle>
              <Link href="/dashboard/admin/events">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.slice(0, 5).map(event => (
                <Link key={event.id} href={`/dashboard/admin/events/${event.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.total_votes || 0} votes</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize flex-shrink-0">
                      {event.status}
                    </Badge>
                  </div>
                </Link>
              ))}
              {events.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No events yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminDashboardContent />
    </RoleGuard>
  );
}
