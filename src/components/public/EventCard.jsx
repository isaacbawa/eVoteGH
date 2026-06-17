'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isPast, differenceInDays } from 'date-fns';

const typeColors = {
  church: 'bg-purple-100 text-purple-700',
  university: 'bg-blue-100 text-blue-700',
  corporate: 'bg-emerald-100 text-emerald-700',
  community: 'bg-orange-100 text-orange-700',
  entertainment: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
};

const statusBadge = {
  nomination_open: { label: 'Nominations Open', cls: 'bg-blue-500 text-white' },
  nomination_closed: { label: 'Nominations Closed', cls: 'bg-orange-500 text-white' },
  voting_open: { label: 'LIVE', cls: 'bg-emerald-500 text-white', pulse: true },
  voting_closed: { label: 'Voting Ended', cls: 'bg-muted text-muted-foreground' },
  paid_out: { label: 'Completed', cls: 'bg-muted text-muted-foreground' },
  active: { label: 'LIVE', cls: 'bg-emerald-500 text-white', pulse: true },
  closed: { label: 'Closed', cls: 'bg-muted text-muted-foreground' },
};

export default function EventCard({ event, index = 0 }) {
  const isVotingActive = event.status === 'voting_open' || (event.status === 'active' && new Date() >= new Date(event.voting_start) && new Date() <= new Date(event.voting_end));
  const isNominationOpen = event.status === 'nomination_open';
  const daysLeft = differenceInDays(new Date(event.voting_end), new Date());
  const votingEnded = event.status === 'voting_closed' || event.status === 'paid_out' || isPast(new Date(event.voting_end));
  const sb = statusBadge[event.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Link href={`/event/${event.slug}`}>
        <Card className="group overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 border-border/50 cursor-pointer">
          <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
            {event.banner_url ? (
              <img src={event.banner_url} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users className="w-12 h-12 text-primary/20" />
              </div>
            )}
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className={typeColors[event.event_type] || typeColors.other}>
                {event.event_type?.replace(/_/g, ' ')}
              </Badge>
              {sb && (
                <Badge className={`${sb.cls}`}>
                  {sb.pulse && <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 inline-block animate-pulse" />}
                  {sb.label}
                </Badge>
              )}
            </div>
          </div>
          <CardContent className="p-5">
            <h3 className="font-heading font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
              {event.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {event.region && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {event.region}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(event.voting_end), 'MMM d, yyyy')}
              </span>
            </div>
            {isVotingActive && !votingEnded && (
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-accent" />
                  {daysLeft > 0 ? `${daysLeft} days left` : 'Ends today'}
                </span>
                <span className="text-xs text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                  Vote Now <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            )}
            {isNominationOpen && (
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Nominations open
                </span>
                <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                  Nominate <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            )}
            {votingEnded && (
              <div className="mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">Voting ended</span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
