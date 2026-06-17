'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClientInstance}>
      {children}
      <Toaster />
      <SonnerToaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
