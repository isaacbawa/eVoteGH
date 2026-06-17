import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { Vote, Heart } from 'lucide-react';

export default function PublicGroupLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/50 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                  <Vote className="w-4 h-4 text-white" />
                </div>
                <span className="font-display text-lg font-bold">eVote<span className="text-gold">GH</span></span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Ghana's premier e-voting platform. Powering transparent, real-time elections for churches, universities, and organizations across the country.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-3 text-sm">Platform</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span>How It Works</span>
                <span>Pricing</span>
                <span>For Organizers</span>
              </div>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-3 text-sm">Support</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span>Contact Us</span>
                <span>FAQ</span>
                <span>Terms of Service</span>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2025 eVoteGH. All rights reserved.</span>
            <span className="flex items-center gap-1">Made with <Heart className="w-3 h-3 text-destructive" /> in Ghana</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
