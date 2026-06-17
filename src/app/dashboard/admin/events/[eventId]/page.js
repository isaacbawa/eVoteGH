'use client';

import { db } from '@/lib/api-client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft, Vote, CreditCard, Users, ExternalLink, Trophy,
  CheckCircle2, XCircle, Clock, UserCircle, Phone, Mail,
  Eye, RefreshCw, UserPlus, Percent, Save, Pencil
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import StatsCard from '@/components/dashboard/admin/StatsCard';
import EditNomineeModal from '@/components/dashboard/admin/EditNomineeModal';
import EditEventModal from '@/components/dashboard/admin/EditEventModal';
import InvitePanel from '@/components/dashboard/admin/InvitePanel';
import RoleGuard from '@/components/layout/RoleGuard';

const STATUS_OPTS = [
  { value: 'draft', label: 'Draft' },
  { value: 'nomination_open', label: 'Nominations Open' },
  { value: 'nomination_closed', label: 'Nominations Closed' },
  { value: 'voting_open', label: 'Voting Open' },
  { value: 'voting_closed', label: 'Voting Closed' },
  { value: 'paid_out', label: 'Paid Out' },
];

const STATUS_COLORS = {
  draft: 'bg-muted text-muted-foreground',
  nomination_open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  nomination_closed: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  voting_open: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  voting_closed: 'bg-muted text-muted-foreground',
  paid_out: 'bg-purple-100 text-purple-800',
};

function AdminEventDetailContent() {
  const { eventId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [commissionInput, setCommissionInput] = useState('');
  const [editingNominee, setEditingNominee] = useState(null);
  const [editEventOpen, setEditEventOpen] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ['admin-event-detail', eventId],
    queryFn: () => db.entities.Event.filter({ id: eventId }),
    enabled: !!eventId,
  });
  const event = events[0];

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-event-categories', eventId],
    queryFn: () => db.entities.Category.filter({ event_id: eventId }, 'display_order'),
    enabled: !!eventId,
  });

  const { data: nominees = [] } = useQuery({
    queryKey: ['admin-event-nominees', eventId],
    queryFn: () => db.entities.Nominee.filter({ event_id: eventId }),
    enabled: !!eventId,
    refetchInterval: 15000,
  });

  const statusMutation = useMutation({
    mutationFn: (status) => db.entities.Event.update(eventId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event-detail', eventId] });
      toast.success('Event status updated');
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }) =>
      db.entities.Nominee.update(id, {
        approval_status: approved ? 'approved' : 'rejected',
        is_active: approved,
      }),
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-event-nominees', eventId] });
      toast.success(approved ? 'Nominee approved ✓' : 'Nominee rejected');
    },
  });

  const commissionMutation = useMutation({
    mutationFn: (rate) => db.entities.Event.update(eventId, { commission_rate: rate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event-detail', eventId] });
      toast.success('Commission rate updated');
      setCommissionInput('');
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async () => {
      const pending = nominees.filter(n => n.approval_status === 'pending');
      await Promise.all(pending.map(n =>
        db.entities.Nominee.update(n.id, { approval_status: 'approved', is_active: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event-nominees', eventId] });
      toast.success('All pending nominees approved!');
    },
  });

  useEffect(() => {
    if (event && commissionInput === '') {
      setCommissionInput(String(Math.round((event.commission_rate || 0.15) * 100)));
    }
  }, [event, commissionInput]);

  if (!event) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const pending = nominees.filter(n => n.approval_status === 'pending');
  const approved = nominees.filter(n => n.approval_status === 'approved');
  const rejected = nominees.filter(n => n.approval_status === 'rejected');

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-black truncate">{event.name}</h1>
          <p className="text-sm text-muted-foreground">{event.region} · {event.event_type}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={event.status} onValueChange={v => statusMutation.mutate(v)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <a href={`/event/${event.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1">
              <ExternalLink className="w-3 h-3" /> Public Page
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Total Votes" value={(event.total_votes || 0).toLocaleString()} icon={Vote} color="primary" index={0} />
        <StatsCard title="Revenue" value={`GH₵ ${(parseFloat(event.total_revenue) || 0).toLocaleString()}`} icon={CreditCard} color="accent" index={1} />
        <StatsCard title="Categories" value={categories.length} icon={Trophy} color="emerald" index={2} />
        <StatsCard title="Total Nominees" value={nominees.length} icon={Users} color="primary" index={3} />
      </div>

      {pending.length > 0 && (
        <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
              {pending.length} nomination{pending.length > 1 ? 's' : ''} pending review
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setActiveTab('nominations')}>
              <Eye className="w-3 h-3 mr-1" /> Review
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => bulkApproveMutation.mutate()} disabled={bulkApproveMutation.isPending}>
              <CheckCircle2 className="w-3 h-3 mr-1" /> Approve All
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nominations" className="relative">
            Nominations
            {pending.length > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {event.banner_url && (
            <div className="w-full h-48 rounded-2xl overflow-hidden border border-border/50">
              <img src={event.banner_url} alt={event.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-heading">Event Details</CardTitle>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setEditEventOpen(true)}>
                  <Pencil className="w-3 h-3" /> Edit
                </Button>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                {[
                  ['Status', <Badge key="s" className={STATUS_COLORS[event.status]}>{event.status?.replace(/_/g, ' ')}</Badge>],
                  ['Nomination Start', event.nomination_start ? format(new Date(event.nomination_start), 'MMM d, yyyy h:mm a') : '—'],
                  ['Nomination End', event.nomination_end ? format(new Date(event.nomination_end), 'MMM d, yyyy h:mm a') : '—'],
                  ['Voting Start', event.voting_start ? format(new Date(event.voting_start), 'MMM d, yyyy h:mm a') : '—'],
                  ['Voting End', event.voting_end ? format(new Date(event.voting_end), 'MMM d, yyyy h:mm a') : '—'],
                  ['Base Vote Price', `GH₵ ${event.base_vote_price}`],
                  ['Commission Rate', `${Math.round((event.commission_rate || 0) * 100)}%`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-right">{v}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base font-heading">Categories ({categories.length})</CardTitle></CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No categories yet.</p>
                ) : (
                  <div className="space-y-2">
                    {categories.map(cat => {
                      const catNoms = nominees.filter(n => n.category_id === cat.id);
                      const catApproved = catNoms.filter(n => n.approval_status === 'approved');
                      return (
                        <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <span className="font-medium text-sm">{cat.name}</span>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>{catApproved.length} approved</span>
                            <span>·</span>
                            <span>{catNoms.filter(n => n.approval_status === 'pending').length} pending</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nominations" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 text-sm">
              <span className="font-semibold">{nominees.length} total</span>
              <span className="text-orange-600">· {pending.length} pending</span>
              <span className="text-emerald-600">· {approved.length} approved</span>
              {rejected.length > 0 && <span className="text-destructive">· {rejected.length} rejected</span>}
            </div>
            <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-event-nominees', eventId] })}>
              <RefreshCw className="w-3 h-3 mr-1" /> Refresh
            </Button>
          </div>

          {nominees.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-dashed">
              <UserPlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">No nominations yet</p>
              <p className="text-sm text-muted-foreground mt-1">Set status to "Nominations Open" so the public can submit nominations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...pending, ...approved, ...rejected].map(nominee => {
                const cat = categories.find(c => c.id === nominee.category_id);
                const isPending = nominee.approval_status === 'pending';
                const isApproved = nominee.approval_status === 'approved';
                return (
                  <Card key={nominee.id} className={`border-border/50 ${isPending ? 'border-orange-200 dark:border-orange-800' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {nominee.photo_url ? (
                          <img src={nominee.photo_url} alt={nominee.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <UserCircle className="w-7 h-7 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <p className="font-heading font-bold">{nominee.name}</p>
                            <Badge variant="outline" className="text-xs capitalize">{cat?.name || '—'}</Badge>
                            <Badge className={
                              isPending ? 'bg-orange-100 text-orange-800' :
                              isApproved ? 'bg-emerald-100 text-emerald-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {nominee.approval_status}
                            </Badge>
                          </div>
                          {nominee.bio && <p className="text-sm text-muted-foreground line-clamp-1">{nominee.bio}</p>}
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                            {nominee.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{nominee.phone}</span>}
                            {nominee.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{nominee.email}</span>}
                            {nominee.nominated_by_name && (
                              <span>Nominated by: <strong>{nominee.nominated_by_name}</strong></span>
                            )}
                          </div>
                          {nominee.nomination_reason && (
                            <p className="text-xs text-muted-foreground mt-1 italic">"{nominee.nomination_reason}"</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs"
                            onClick={() => setEditingNominee(nominee)}
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </Button>
                          {isPending ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
                                onClick={() => approveMutation.mutate({ id: nominee.id, approved: true })}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive gap-1 text-xs"
                                onClick={() => approveMutation.mutate({ id: nominee.id, approved: false })}
                                disabled={approveMutation.isPending}
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => approveMutation.mutate({ id: nominee.id, approved: !isApproved })}
                            >
                              {isApproved ? 'Revoke' : 'Re-approve'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-heading text-base">Live Leaderboard — All Categories</CardTitle></CardHeader>
            <CardContent>
              {approved.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No approved nominees yet.</p>
              ) : (
                <div className="space-y-2">
                  {[...approved].sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0)).map((nom, i) => {
                    const cat = categories.find(c => c.id === nom.category_id);
                    const maxV = approved.reduce((m, n) => Math.max(m, n.total_votes || 0), 0);
                    const pct = maxV > 0 ? ((nom.total_votes || 0) / maxV) * 100 : 0;
                    return (
                      <div key={nom.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors">
                        <span className="font-mono text-sm text-muted-foreground w-6 font-bold">#{i + 1}</span>
                        {nom.photo_url ? (
                          <img src={nom.photo_url} alt={nom.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <UserCircle className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-semibold truncate">{nom.name}</span>
                            <span className="font-mono text-sm font-bold flex-shrink-0">{(nom.total_votes || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div
                                className={`h-full rounded-full transition-all ${i === 0 ? 'gold-gradient' : 'bg-primary/60'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{cat?.name}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-heading text-base">Event Status & Lifecycle</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Current status: <Badge className={STATUS_COLORS[event.status]}>{event.status?.replace(/_/g, ' ')}</Badge>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STATUS_OPTS.map(opt => (
                  <Button
                    key={opt.value}
                    variant={event.status === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => statusMutation.mutate(opt.value)}
                    className={event.status === opt.value ? 'gold-gradient text-white border-0' : ''}
                    disabled={statusMutation.isPending}
                  >
                    {event.status === opt.value && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {opt.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-primary" /> Event Details & Dates
              </CardTitle>
              <Button size="sm" className="gold-gradient text-white border-0 gap-1" onClick={() => setEditEventOpen(true)}>
                <Pencil className="w-3 h-3" /> Edit Event
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ['Nomination Start', event.nomination_start ? format(new Date(event.nomination_start), 'MMM d, yyyy h:mm a') : '—'],
                ['Nomination End', event.nomination_end ? format(new Date(event.nomination_end), 'MMM d, yyyy h:mm a') : '—'],
                ['Voting Start', event.voting_start ? format(new Date(event.voting_start), 'MMM d, yyyy h:mm a') : '—'],
                ['Voting End', event.voting_end ? format(new Date(event.voting_end), 'MMM d, yyyy h:mm a') : '—'],
                ['Base Vote Price', `GH₵ ${event.base_vote_price}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Percent className="w-4 h-4 text-primary" /> Commission Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Current rate: <strong>{Math.round((event.commission_rate || 0) * 100)}%</strong>
                {' '}(organizer receives <strong>{Math.round((1 - (event.commission_rate || 0)) * 100)}%</strong>)
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <Input
                    type="number" min="0" max="100" step="0.5"
                    value={commissionInput}
                    onChange={e => setCommissionInput(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <Button
                  size="sm"
                  className="gold-gradient text-white border-0 gap-1"
                  onClick={() => {
                    const val = parseFloat(commissionInput);
                    if (isNaN(val) || val < 0 || val > 100) return toast.error('Enter a valid rate between 0–100');
                    commissionMutation.mutate(val / 100);
                  }}
                  disabled={commissionMutation.isPending}
                >
                  <Save className="w-3 h-3" /> Save Rate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-heading text-base">Public Links</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <span className="text-muted-foreground">Event Page</span>
                <a href={`/event/${event.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  /event/{event.slug} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <span className="text-muted-foreground">Nominate Link</span>
                <a href={`/event/${event.slug}/nominate`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  /event/{event.slug}/nominate <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          <InvitePanel event={event} />
        </TabsContent>
      </Tabs>

      <EditNomineeModal
        nominee={editingNominee}
        categories={categories}
        eventId={eventId}
        open={!!editingNominee}
        onOpenChange={(v) => { if (!v) setEditingNominee(null); }}
      />

      <EditEventModal
        event={event}
        open={editEventOpen}
        onOpenChange={setEditEventOpen}
      />
    </div>
  );
}

export default function AdminEventDetailPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminEventDetailContent />
    </RoleGuard>
  );
}
