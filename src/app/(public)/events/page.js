'use client';

import React, { useState } from 'react';
import { db } from '@/lib/api-client';

import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import EventCard from '@/components/public/EventCard';

const eventTypes = ['all', 'church', 'university', 'corporate', 'community', 'entertainment'];

export default function Events() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events-list'],
    queryFn: () => db.entities.Event.filter({ is_public: true }, '-created_date', 50),
  });

  const filtered = events.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || e.event_type === typeFilter;
    return matchSearch && matchType;
  });

  const active = filtered.filter(e => ['voting_open', 'nomination_open', 'nomination_closed', 'active'].includes(e.status));
  const closed = filtered.filter(e => ['voting_closed', 'closed', 'paid_out'].includes(e.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black mb-2">All Events</h1>
        <p className="text-muted-foreground">Browse and vote in active elections across Ghana</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="overflow-x-auto">
          <Tabs value={typeFilter} onValueChange={setTypeFilter}>
            <TabsList className="bg-muted">
              {eventTypes.map(t => (
                <TabsTrigger key={t} value={t} className="text-xs capitalize">
                  {t === 'all' ? 'All' : t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-72 rounded-2xl bg-card animate-pulse border" />
          ))}
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="mb-12">
              <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Events ({active.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {active.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} />
                ))}
              </div>
            </div>
          )}

          {closed.length > 0 && (
            <div>
              <h2 className="font-heading font-bold text-lg mb-4 text-muted-foreground">
                Past Events
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {closed.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No events found matching your search.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
