'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/api-client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, ArrowRight, Trophy, UserPlus, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import CountdownTimer from '@/components/public/CountdownTimer';
import NomineeCard from '@/components/public/NomineeCard';
import PaymentModal from '@/components/public/PaymentModal';
import { toast } from 'sonner';

export default function EventPage() {
  const { eventSlug } = useParams();
  const queryClient = useQueryClient();
  const [selectedNominee, setSelectedNominee] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const { data: events = [], isLoading: loadingEvent } = useQuery({
    queryKey: ['event', eventSlug],
    queryFn: () => db.entities.Event.filter({ slug: eventSlug }),
    enabled: !!eventSlug,
  });
  const event = events[0];

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', event?.id],
    queryFn: () => db.entities.Category.filter({ event_id: event.id }, 'display_order'),
    enabled: !!event,
  });

  const { data: nominees = [] } = useQuery({
    queryKey: ['nominees', event?.id],
    queryFn: () => db.entities.Nominee.filter({ event_id: event.id, is_active: true, approval_status: 'approved' }),
    enabled: !!event,
  });

  const { data: packages = [] } = useQuery({
    queryKey: ['packages', event?.id],
    queryFn: () => db.entities.VotePackage.filter({ event_id: event.id }, 'display_order'),
    enabled: !!event,
  });

  // Vote recording happens server-side now: our /api/votes/confirm route
  // re-verifies the Paystack reference before writing anything, then
  // atomically updates the transaction + nominee + event totals and sends
  // the confirmation email. This replaces the original client-trusted
  // sequence of 3 separate entity writes.
  const voteMutation = useMutation({
    mutationFn: async (voteData) => {
      return db.votes.confirm({
        event_id: event.id,
        nominee_id: voteData.nominee.id,
        category_id: voteData.nominee.category_id,
        package_id: voteData.package.id !== 'custom' ? voteData.package.id : null,
        votes_cast: voteData.package.votes,
        amount_ghs: voteData.package.price_ghs,
        voter_name: voteData.voterName,
        voter_email: voteData.voterEmail,
        voter_phone: voteData.voterPhone,
        gateway_reference: voteData.gatewayReference,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominees', event?.id] });
      queryClient.invalidateQueries({ queryKey: ['event', eventSlug] });
      setPaymentOpen(false);
      toast.success('Your vote has been cast! 🎉');
    },
    onError: (err) => {
      toast.error(err.message || 'Could not record your vote. Please contact support with your payment reference.');
    },
  });

  const handleVote = (nominee) => {
    setSelectedNominee(nominee);
    setPaymentOpen(true);
  };

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <h2 className="font-heading text-2xl font-bold mb-2">Event Not Found</h2>
        <p className="text-muted-foreground mb-4">This event doesn't exist or has been removed.</p>
        <Link href="/events"><Button>Browse Events</Button></Link>
      </div>
    );
  }

  const now = new Date();
  const votingEndPassed = event.voting_end && new Date(event.voting_end) < now;
  const votingStarted = event.voting_start && new Date(event.voting_start) <= now;
  const isVotingOpen = event.status === 'voting_open' && votingStarted && !votingEndPassed;
  const isNominationOpen = event.status === 'nomination_open' && !(event.nomination_end && new Date(event.nomination_end) < now);
  const isVotingEnded = event.status === 'voting_closed' || event.status === 'paid_out' || votingEndPassed;

  const statusConfig = {
    draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
    nomination_open: { label: 'Nominations Open', color: 'bg-blue-500 text-white' },
    nomination_closed: { label: 'Nominations Closed', color: 'bg-orange-500 text-white' },
    voting_open: { label: 'LIVE · Voting Open', color: 'bg-emerald-500 text-white' },
    voting_closed: { label: 'Voting Closed', color: 'bg-muted text-muted-foreground' },
    paid_out: { label: 'Completed', color: 'bg-muted text-muted-foreground' },
  };
  const sc = statusConfig[event.status] || statusConfig.draft;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Event Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        {event.banner_url && (
          <div className="h-48 sm:h-64 rounded-2xl overflow-hidden mb-6">
            <img src={event.banner_url} alt={event.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className="capitalize">{event.event_type}</Badge>
              <Badge className={sc.color}>
                {isVotingOpen && <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 inline-block animate-pulse" />}
                {sc.label}
              </Badge>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black mb-2">{event.name}</h1>
            <p className="text-muted-foreground max-w-2xl">{event.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              {event.region && (
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.region}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Voting: {format(new Date(event.voting_start), 'MMM d')} – {format(new Date(event.voting_end), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {(event.total_votes || 0).toLocaleString()} votes cast
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {isNominationOpen && (
              <Link href={`/event/${eventSlug}/nominate`}>
                <Button className="w-full gold-gradient text-white border-0 font-bold gap-2">
                  <UserPlus className="w-4 h-4" /> Nominate Someone
                </Button>
              </Link>
            )}
            {isVotingOpen && (
              <div className="text-sm text-center text-muted-foreground">
                Scroll down to vote for your favourite!
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {isNominationOpen && (
        <Card className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="py-5">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-blue-900 dark:text-blue-100">Nominations are open!</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Submit nominations for your favourite people. Nominations close on{' '}
                  {event.nomination_end ? format(new Date(event.nomination_end), 'MMM d, yyyy') : 'a date set by the admin'}.
                </p>
              </div>
              <Link href={`/event/${eventSlug}/nominate`}>
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  Nominate <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {isVotingOpen && (
        <Card className="mb-8 border-accent/20 bg-gradient-to-r from-card to-accent/5">
          <CardContent className="py-6">
            <p className="text-center text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wide">Voting ends in</p>
            <CountdownTimer endDate={event.voting_end} />
          </CardContent>
        </Card>
      )}

      {isVotingEnded && (
        <Card className="mb-8 border-muted bg-muted/40">
          <CardContent className="py-5 flex items-center gap-4">
            <Trophy className="w-6 h-6 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="font-semibold">Voting has ended</p>
              <p className="text-sm text-muted-foreground">This event is closed. No more votes can be cast.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isVotingEnded && !isVotingOpen && !isNominationOpen && event.voting_start && (
        <Card className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardContent className="py-5 flex items-center gap-4">
            <Clock className="w-6 h-6 text-orange-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-900 dark:text-orange-100">Voting hasn't started yet</p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Voting opens on {format(new Date(event.voting_start), 'MMMM d, yyyy · h:mm a')}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {categories.length > 0 ? (
        <Tabs defaultValue={categories[0]?.id}>
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
              Browse Categories
            </p>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
              <TabsList className="h-auto bg-transparent p-0 flex flex-nowrap gap-2 w-max sm:w-auto sm:flex-wrap">
                {categories.map(cat => {
                  const count = nominees.filter(n => n.category_id === cat.id).length;
                  return (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="
                        group h-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-border/60
                        bg-card text-foreground font-semibold text-sm whitespace-nowrap
                        data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                        data-[state=active]:border-primary data-[state=active]:shadow-md
                        hover:border-primary/50 hover:bg-muted/60
                        transition-all duration-200 gap-1.5 flex-shrink-0
                      "
                    >
                      <Trophy className="w-3.5 h-3.5 opacity-60 group-data-[state=active]:opacity-100 flex-shrink-0" />
                      <span>{cat.name}</span>
                      <span className="
                        text-[10px] px-1.5 py-0.5 rounded-full font-bold
                        bg-muted text-muted-foreground
                        group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white
                      ">
                        {count}
                      </span>
                      <ChevronRight className="w-3 h-3 opacity-40 group-data-[state=active]:opacity-80 -mr-0.5 flex-shrink-0" />
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          {categories.map(cat => {
            const catNominees = nominees
              .filter(n => n.category_id === cat.id)
              .sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0));
            const maxVotes = catNominees[0]?.total_votes || 0;

            return (
              <TabsContent key={cat.id} value={cat.id}>
                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-heading text-xl font-bold leading-tight">{cat.name}</h2>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground truncate">{cat.description}</p>
                    )}
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold">
                    {catNominees.length} {catNominees.length === 1 ? 'nominee' : 'nominees'}
                  </Badge>
                </div>
                {catNominees.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
                    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No approved nominees in this category yet.</p>
                    {isNominationOpen && (
                      <Link href={`/event/${eventSlug}/nominate`}>
                        <Button variant="link" className="mt-1 gap-1"><UserPlus className="w-4 h-4" /> Be the first to nominate</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {catNominees.map((nominee, i) => (
                      <NomineeCard
                        key={nominee.id}
                        nominee={nominee}
                        rank={i + 1}
                        maxVotes={maxVotes}
                        onVote={isVotingOpen ? handleVote : undefined}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      ) : (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed">
          <Trophy className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="font-heading font-bold mb-1">Categories coming soon</p>
          <p className="text-sm text-muted-foreground">The organiser is still setting up this event.</p>
        </div>
      )}

      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        nominee={selectedNominee}
        packages={packages}
        onSubmitVote={(data) => voteMutation.mutate({ ...data, nominee: selectedNominee })}
        isProcessing={voteMutation.isPending}
        basePricePerVote={event.base_vote_price || 1}
      />
    </div>
  );
}
