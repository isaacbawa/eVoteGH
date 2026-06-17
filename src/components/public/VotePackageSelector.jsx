'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, Star, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VotePackageSelector({ packages, selectedPackage, onSelect, basePricePerVote }) {
  const isCustomSelected = selectedPackage?.isCustom;

  const handleCustomVotes = (e) => {
    const votes = parseInt(e.target.value) || 0;
    if (votes < 1) {
      onSelect(null);
      return;
    }
    const price = parseFloat((votes * basePricePerVote).toFixed(2));
    onSelect({ id: 'custom', votes, price_ghs: price, isCustom: true });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {packages.map((pkg, i) => {
          const isSelected = !isCustomSelected && selectedPackage?.id === pkg.id;
          const isHighlighted = pkg.is_highlighted;
          const pricePerVote = (pkg.price_ghs / pkg.votes).toFixed(2);

          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-200 relative ${
                  isSelected
                    ? 'ring-2 ring-accent shadow-lg shadow-accent/20 border-accent'
                    : isHighlighted
                    ? 'border-accent/50 shadow-md'
                    : 'border-border/50 hover:border-primary/30'
                }`}
                onClick={() => onSelect(pkg)}
              >
                {isHighlighted && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge className="gold-gradient text-white text-[10px] px-2 py-0.5 border-0 shadow-sm">
                      <Star className="w-2.5 h-2.5 mr-1" />
                      POPULAR
                    </Badge>
                  </div>
                )}
                <CardContent className={`p-4 text-center ${isHighlighted ? 'pt-5' : ''}`}>
                  <div className="font-display text-3xl font-black mb-0.5">{pkg.votes}</div>
                  <div className="text-xs text-muted-foreground mb-3">
                    {pkg.votes === 1 ? 'vote' : 'votes'}
                  </div>
                  <div className="font-heading font-bold text-lg">GH₵ {pkg.price_ghs.toFixed(2)}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">GH₵ {pricePerVote}/vote</div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Custom amount */}
      <div className={`rounded-xl border-2 p-4 transition-all ${isCustomSelected ? 'border-accent bg-accent/5' : 'border-border/50'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Pencil className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Custom Amount</span>
          {isCustomSelected && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="w-4 h-4 rounded-full bg-accent flex items-center justify-center ml-auto"
            >
              <Check className="w-2.5 h-2.5 text-white" />
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              type="number"
              min="1"
              placeholder="Enter number of votes"
              value={isCustomSelected ? selectedPackage.votes : ''}
              onChange={handleCustomVotes}
              className="text-center font-bold"
            />
          </div>
          {isCustomSelected && (
            <div className="text-right flex-shrink-0">
              <div className="font-heading font-bold text-base">GH₵ {selectedPackage.price_ghs.toFixed(2)}</div>
              <div className="text-[10px] text-muted-foreground">GH₵ {basePricePerVote?.toFixed(2)}/vote</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}