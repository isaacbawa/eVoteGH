'use client';

import { db } from '@/lib/api-client';

import React, { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Vote, TrendingUp, Trophy, Target, Share2, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '@/components/dashboard/admin/StatsCard';
import { toast } from 'sonner';

export default function NomineeSection({ nominee }) {
  const { data: categoryArr = [] } = useQuery({
    queryKey: ['nominee-category', nominee?.category_id],
    queryFn: () => db.entities.Category.filter({ id: nominee.category_id }),
    enabled: !!nominee?.category_id,
  });
  const category = categoryArr[0];

  const { data: eventArr = [] } = useQuery({
    queryKey: ['nominee-event', nominee?.event_id],
    queryFn: () => db.entities.Event.filter({ id: nominee.event_id }),
    enabled: !!nominee?.event_id,
  });
  const event = eventArr[0];

  const { data: categoryNominees = [] } = useQuery({
    queryKey: ['category-nominees', nominee?.category_id],
    queryFn: () => db.entities.Nominee.filter({
      category_id: nominee.category_id,
      approval_status: 'approved',
      is_active: true,
    }),
    enabled: !!nominee?.category_id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['nominee-transactions', nominee?.id],
    queryFn: () => db.entities.VoteTransaction.filter(
      { nominee_id: nominee.id, status: 'confirmed' }, '-created_date', 100
    ),
    enabled: !!nominee?.id,
  });

  const sorted = [...categoryNominees].sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0));
  const position = sorted.findIndex(n => n.id === nominee?.id) + 1;
  const leader = sorted[0];
  const gapToLeader = leader && nominee ? (leader.total_votes || 0) - (nominee.total_votes || 0) : 0;

  const dailyVotes = useMemo(() => {
    const grouped = {};
    transactions.forEach(tx => {
      const day = format(new Date(tx.created_date), 'MMM d');
      grouped[day] = (grouped[day] || 0) + tx.votes_cast;
    });
    return Object.entries(grouped).map(([date, votes]) => ({ date, votes })).slice(-14);
  }, [transactions]);

  const voteUrl = event ? `${window.location.origin}/event/${event.slug}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(voteUrl);
    toast.success('Campaign link copied!');
  };

  const shareMessages = event && nominee ? [
    `Hi! I'm nominated for ${event.name}. Please vote for me: ${voteUrl}`,
    `Every vote matters! Support ${nominee.name} in ${event.name}: ${voteUrl}`,
    `Help me win! Vote for ${nominee.name} 🏆 ${voteUrl}`,
  ] : [];

  if (!nominee) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        {nominee.photo_url ? (
          <img src={nominee.photo_url} alt={nominee.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-accent flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center ring-2 ring-border flex-shrink-0">
            <span className="text-xl sm:text-2xl font-bold text-muted-foreground">{nominee.name?.[0]}</span>
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-black truncate">{nominee.name}</h1>
          <p className="text-sm text-muted-foreground truncate">
            {category?.name && <span className="font-medium text-foreground">{category.name}</span>}
            {event?.name && <span className="hidden sm:inline"> · {event.name}</span>}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className="text-xs gold-gradient text-white border-0">
              {nominee.approval_status === 'approved' ? 'Approved' : 'Pending Approval'}
            </Badge>
            {nominee.approval_status === 'pending' && (
              <span className="text-xs text-muted-foreground">Waiting for admin approval</span>
            )}
          </div>
        </div>
      </div>

      {nominee.approval_status === 'approved' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatsCard title="Your Votes" value={(nominee.total_votes || 0).toLocaleString()} icon={Vote} color="accent" index={0} />
            <StatsCard title="Position" value={`#${position}`} subtitle={`of ${categoryNominees.length} nominees`} icon={Trophy} color="primary" index={1} />
            <StatsCard title="Gap to Leader" value={gapToLeader > 0 ? gapToLeader.toLocaleString() : '—'} subtitle={gapToLeader === 0 ? "You're leading!" : undefined} icon={Target} color="emerald" index={2} />
            <StatsCard title="Revenue" value={`GH₵ ${(nominee.total_revenue || 0).toLocaleString()}`} icon={TrendingUp} color="accent" index={3} />
          </div>

          {/* Vote Trend */}
          {dailyVotes.length > 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base font-heading">Vote Trend (Last 14 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-52 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyVotes}>
                      <defs>
                        <linearGradient id="nomVoteGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="votes" stroke="#f59e0b" fillOpacity={1} fill="url(#nomVoteGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Leaderboard */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-heading">
                {category?.name} — Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sorted.map((n, i) => (
                  <div
                    key={n.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${n.id === nominee.id ? 'bg-accent/10 border border-accent/20' : 'hover:bg-muted'}`}
                  >
                    <span className="font-mono text-sm text-muted-foreground w-6 font-bold flex-shrink-0">#{i + 1}</span>
                    {n.photo_url ? (
                      <img src={n.photo_url} alt={n.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                        {n.name?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {n.name}
                        {n.id === nominee.id && (
                          <Badge className="ml-2 text-[10px] gold-gradient text-white border-0">You</Badge>
                        )}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold flex-shrink-0">{(n.total_votes || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Share Tools */}
          {voteUrl && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share Your Campaign
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono truncate text-muted-foreground">
                    {voteUrl}
                  </div>
                  <Button size="sm" variant="outline" onClick={copyLink} className="gap-1 flex-shrink-0">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pre-written messages — tap to copy</p>
                  {shareMessages.map((msg, i) => (
                    <div
                      key={i}
                      className="p-3 bg-muted rounded-xl text-sm cursor-pointer hover:bg-muted/70 active:scale-[0.99] transition-all"
                      onClick={() => {
                        navigator.clipboard.writeText(msg);
                        toast.success('Message copied!');
                      }}
                    >
                      {msg}
                      <p className="text-[10px] text-muted-foreground mt-1">Tap to copy</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Vote for ${nominee.name} in ${event?.name}! ${voteUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white border-0 font-semibold gap-2 text-sm">
                      Share on WhatsApp
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}