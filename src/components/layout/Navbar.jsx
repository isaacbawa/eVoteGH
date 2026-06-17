'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Vote } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { label: 'Events', href: '/events' },
    { label: 'How It Works', href: '/how-it-works' },
  ];

  const isActive = (href) => pathname === href;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shadow-lg shadow-accent/20">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              eVote<span className="text-gold">GH</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`font-medium ${isActive(link.href) ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <SignedOut>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="gold-gradient text-white font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-shadow border-0">
                  Get Started
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="font-medium">
                  Dashboard
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 mt-8">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start font-medium">
                      {link.label}
                    </Button>
                  </Link>
                ))}
                <div className="border-t pt-4 mt-2 flex flex-col gap-2">
                  <SignedOut>
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)}>
                      <Button className="w-full gold-gradient text-white border-0">Get Started</Button>
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      <Button variant="outline" className="w-full">Dashboard</Button>
                    </Link>
                  </SignedIn>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}
