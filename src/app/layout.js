import React from 'react';
import Script from 'next/script';
import { ClerkProvider } from '@clerk/nextjs';
import Providers from './providers';
import './globals.css';

export const metadata = {
  title: 'eVoteGH — Secure Online Voting',
  description: "Ghana's e-voting platform for churches, universities, and organizations. Real-time voting, secure payments, transparent results.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/register"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="en">
        <body className="font-body antialiased">
          <Providers>{children}</Providers>
          {/* Paystack inline checkout — previously loaded via index.html in the Vite app */}
          <Script src="https://js.paystack.co/v2/inline.js" strategy="afterInteractive" />
        </body>
      </html>
    </ClerkProvider>
  );
}
