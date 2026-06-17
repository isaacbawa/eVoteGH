'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, MessageCircle, Facebook, Twitter } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareBlock({ url, nomineeName, message }) {
  const [copied, setCopied] = useState(false);

  const shareText = message || `Vote for ${nomineeName}! 🗳️`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={url} readOnly className="text-sm bg-muted" />
        <Button variant="outline" size="icon" onClick={copyLink} className="flex-shrink-0">
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
      <div className="flex gap-2">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button variant="outline" className="w-full gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
        </a>
        <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button variant="outline" className="w-full gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
            <Facebook className="w-4 h-4" />
            Facebook
          </Button>
        </a>
        <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button variant="outline" className="w-full gap-2 text-sky-500 border-sky-200 hover:bg-sky-50">
            <Twitter className="w-4 h-4" />
            Twitter
          </Button>
        </a>
      </div>
    </div>
  );
}