'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, UserCircle, Vote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const rankBadges = {
  1: { icon: '🥇', bg: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  2: { icon: '🥈', bg: 'bg-gray-100 text-gray-700 border-gray-300' },
  3: { icon: '🥉', bg: 'bg-orange-100 text-orange-800 border-orange-300' },
};

export default function NomineeCard({ nominee, rank, maxVotes, eventSlug, onVote }) {
  const percentage = maxVotes > 0 ? (nominee.total_votes / maxVotes) * 100 : 0;
  const badge = rankBadges[rank];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${rank <= 3 ? 'border-accent/30' : 'border-border/50'}`}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {nominee.photo_url ? (
                <img src={nominee.photo_url} alt={nominee.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-border" />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center ring-2 ring-border">
                  <UserCircle className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              {badge && (
                <span className="absolute -top-1 -right-1 text-lg">{badge.icon}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {rank && (
                  <span className="text-xs font-bold text-muted-foreground">#{rank}</span>
                )}
                <h4 className="font-heading font-bold text-base truncate">{nominee.name}</h4>
              </div>
              {nominee.bio && (
                <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">{nominee.bio}</p>
              )}
              <div className="flex items-center gap-3 mb-2">
                <motion.span
                  key={nominee.total_votes}
                  initial={{ scale: 1.3, color: 'hsl(43 96% 56%)' }}
                  animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                  className="font-display text-xl font-bold"
                >
                  {(nominee.total_votes || 0).toLocaleString()}
                </motion.span>
                <span className="text-xs text-muted-foreground">votes</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${rank === 1 ? 'gold-gradient' : rank <= 3 ? 'bg-primary' : 'bg-primary/60'}`}
                />
              </div>
            </div>

            {onVote && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onVote(nominee);
                }}
                className="gold-gradient text-white border-0 font-semibold shadow-lg shadow-accent/20 hover:shadow-accent/40 flex-shrink-0"
              >
                <Vote className="w-4 h-4 mr-1" />
                Vote
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}