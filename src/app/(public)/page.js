'use client';

import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/api-client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Vote, ArrowRight, Shield, Zap, BarChart3, Trophy, Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import EventCard from '@/components/public/EventCard';

export default function Home() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['public-events'],
    queryFn: () => db.entities.Event.filter({ is_public: true }, '-created_date', 6),
  });

  const features = [
    { icon: Zap, title: 'Instant Results', desc: 'Votes counted in real-time with live leaderboards' },
    { icon: Shield, title: 'Secure Payments', desc: 'Mobile Money & Card via Paystack Ghana' },
    { icon: BarChart3, title: 'Analytics', desc: 'Full dashboards for organizers and nominees' },
    { icon: Trophy, title: 'Transparent', desc: 'Every vote counted, every cedi accounted for' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Badge className="mb-5 bg-white/10 text-white/80 border-white/10 backdrop-blur-sm px-3 py-1">
              <Star className="w-3 h-3 mr-1.5 text-gold" />
              Ghana's #1 E-Voting Platform
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] mb-6">
              Every Vote Counts.{' '}
              <span className="text-gold">Every Vote Matters.</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/70 mb-8 max-w-xl leading-relaxed">
              Power your church, university, or organization elections with real-time voting, secure payments, and transparent results.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/events">
                <Button size="lg" className="gold-gradient text-white border-0 font-bold text-base shadow-xl shadow-accent/30 hover:shadow-accent/50 transition-shadow h-12 px-6">
                  Browse Events
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="text-white border-white/20 hover:bg-white/10 h-12 px-6">
                  How It Works
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
          >
            {[
              { value: '50K+', label: 'Votes Cast' },
              { value: '200+', label: 'Events' },
              { value: '99.9%', label: 'Uptime' },
              { value: 'GH₵ 0', label: 'Setup Fee' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5">
                <div className="font-display text-2xl sm:text-3xl font-black text-gold">{stat.value}</div>
                <div className="text-sm text-white/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-black mb-3">Why eVoteGH?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Built for Ghana. Trusted by organizations across every region.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border/50 hover:shadow-lg transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Events */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl font-black mb-2">Live Events</h2>
              <p className="text-muted-foreground">Vote now in these active elections</p>
            </div>
            <Link href="/events">
              <Button variant="outline" className="gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="h-72 rounded-2xl bg-card animate-pulse border" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No active events right now. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, i) => (
                <EventCard key={event.id} event={event} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-black mb-4">
            Ready to host your next election?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join hundreds of organizations already using eVoteGH for transparent, hassle-free voting.
          </p>
          <Link href="/register">
            <Button size="lg" className="gold-gradient text-white border-0 font-bold text-base shadow-xl shadow-accent/30 h-12 px-8">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
