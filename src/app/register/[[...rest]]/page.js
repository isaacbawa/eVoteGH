import React from 'react';
import { SignUp } from '@clerk/nextjs';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <SignUp
        path="/register"
        routing="path"
        signInUrl="/login"
        appearance={{
          elements: {
            card: 'shadow-sm border border-border rounded-2xl',
            headerTitle: 'font-display',
            formButtonPrimary: 'gold-gradient text-white border-0 hover:opacity-90',
          },
        }}
      />
    </div>
  );
}
