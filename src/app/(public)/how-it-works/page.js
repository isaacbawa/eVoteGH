'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Search, CreditCard, BarChart3, Trophy, Users, Phone, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    icon: Search,
    title: 'Find Your Event',
    desc: 'Browse active elections or use the link shared by nominees and organizers.',
  },
  {
    num: '02',
    icon: Trophy,
    title: 'Pick Your Nominee',
    desc: 'View all nominees in each category, see live vote counts and leaderboard positions.',
  },
  {
    num: '03',
    icon: CreditCard,
    title: 'Choose & Pay',
    desc: 'Select a vote package and pay securely via Mobile Money (MTN, Telecel, AirtelTigo) or Card.',
  },
  {
    num: '04',
    icon: BarChart3,
    title: 'Watch Results Live',
    desc: 'Your votes are counted instantly. Share to rally more support for your nominee!',
  },
];

const forOrganizers = [
  { icon: Users, title: 'Create Events', desc: 'Set up categories, nominees, and pricing in minutes.' },
  { icon: BarChart3, title: 'Track Revenue', desc: 'Real-time dashboards with vote trends and revenue breakdowns.' },
  { icon: Phone, title: 'SMS Alerts', desc: 'Automated milestone alerts and daily summaries via SMS.' },
  { icon: Shield, title: 'Secure Payouts', desc: 'Automated payouts to your Mobile Money or bank account.' },
];

export default function HowItWorks() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl sm:text-5xl font-black mb-4">
              How eVoteGH Works
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              From finding an event to casting your vote — it's fast, secure, and transparent.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex gap-4">
                  <div>
                    <span className="font-display text-3xl font-black text-primary/10">{step.num}</span>
                  </div>
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* For Organizers */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black mb-3">For Organizers</h2>
            <p className="text-muted-foreground">Everything you need to run a professional election</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {forOrganizers.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-4 p-5 bg-card rounded-xl border border-border/50"
              >
                <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-black mb-3">Transparent Pricing</h2>
          <p className="text-muted-foreground mb-8">No setup fees. No hidden charges. We take a small commission on votes.</p>
          <Card className="overflow-hidden">
            <div className="gold-gradient p-6 text-white">
              <div className="font-display text-5xl font-black">15%</div>
              <div className="text-white/80 mt-1">Commission on revenue</div>
            </div>
            <CardContent className="p-6 space-y-3 text-left">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-accent" />
                <span>15% on first GH₵ 5,000</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-accent" />
                <span>12% on revenue above GH₵ 5,000</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-accent" />
                <span>Payouts to Mobile Money or Bank</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-accent" />
                <span>No setup or monthly fees</span>
              </div>
            </CardContent>
          </Card>
          <div className="mt-10">
            <Link href="/register">
              <Button size="lg" className="gold-gradient text-white border-0 font-bold h-12 px-8">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}