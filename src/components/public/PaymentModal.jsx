'use client';

import React, { useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard, Phone, Mail, Loader2, Lock, UserCircle,
  Smartphone, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import VotePackageSelector from './VotePackageSelector';
import { toast } from 'sonner';

const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

const PAYMENT_METHODS = [
  {
    id: 'momo_mtn',
    label: 'MTN MoMo',
    icon: '📱',
    desc: 'MTN Mobile Money',
    channels: ['mobile_money'],
    momoProvider: 'mtn',
    isMomo: true,
  },
  {
    id: 'momo_telecel',
    label: 'Telecel Cash',
    icon: '📱',
    desc: 'Telecel Mobile Money',
    channels: ['mobile_money'],
    momoProvider: 'vod',
    isMomo: true,
  },
  {
    id: 'momo_airtel',
    label: 'AirtelTigo',
    icon: '📱',
    desc: 'AirtelTigo Money',
    channels: ['mobile_money'],
    momoProvider: 'tgo',
    isMomo: true,
  },
  {
    id: 'card',
    label: 'Card',
    icon: '💳',
    desc: 'Visa / Mastercard / Verve',
    channels: ['card'],
    isMomo: false,
  },
];

function generateRef() {
  return `EVGH-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
}

export default function PaymentModal({
  open,
  onOpenChange,
  nominee,
  packages,
  onSubmitVote,
  isProcessing,
  basePricePerVote,
}) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethodId, setPaymentMethodId] = useState('momo_mtn');
  const [voterName, setVoterName] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [step, setStep] = useState('package'); // 'package' | 'details' | 'processing'
  const [launching, setLaunching] = useState(false);

  const method = PAYMENT_METHODS.find(m => m.id === paymentMethodId);

  const reset = useCallback(() => {
    setStep('package');
    setSelectedPackage(null);
    setVoterName('');
    setVoterEmail('');
    setVoterPhone('');
    setLaunching(false);
    setPaymentMethodId('momo_mtn');
  }, []);

  const handleOpenChange = (v) => {
    if (!v && !isProcessing && !launching) reset();
    if (!v) onOpenChange(false);
  };

  // Validate fields
  const validate = () => {
    if (!voterName.trim()) { toast.error('Please enter your full name.'); return false; }
    if (!voterEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(voterEmail.trim())) {
      toast.error('Please enter a valid email address.'); return false;
    }
    if (method.isMomo) {
      const clean = voterPhone.replace(/\s+/g, '');
      if (!clean || !/^\d{10}$/.test(clean)) {
        toast.error(`Enter a valid 10-digit ${method.label} number (e.g. 0241234567).`);
        return false;
      }
    }
    return true;
  };

  const handlePay = () => {
    if (!validate()) return;
    if (!PAYSTACK_KEY) {
      toast.error('Payment configuration error. Please contact support.');
      return;
    }

    // Paystack InlineJS v2 — must be loaded via CDN script
    if (!window.PaystackPop) {
      toast.error('Payment system failed to load. Please refresh the page and try again.');
      return;
    }

    const amountPesewas = Math.round(selectedPackage.price_ghs * 100);
    const ref = generateRef();
    const cleanPhone = voterPhone.replace(/\s+/g, '');

    setLaunching(true);
    setStep('processing');

    try {
      const popup = new window.PaystackPop();

      popup.newTransaction({
        key: PAYSTACK_KEY,
        email: voterEmail.trim(),
        amount: amountPesewas,
        currency: 'GHS',
        ref,
        firstName: voterName.trim().split(' ')[0] || voterName.trim(),
        lastName: voterName.trim().split(' ').slice(1).join(' ') || '',
        phone: method.isMomo ? cleanPhone : undefined,
        channels: method.channels,
        // For MoMo: pre-select provider so Paystack opens on the right network
        ...(method.isMomo && {
          metadata: {
            custom_fields: [
              { display_name: 'Voter Name', variable_name: 'voter_name', value: voterName.trim() },
              { display_name: 'Nominee', variable_name: 'nominee_name', value: nominee?.name || '' },
              { display_name: 'Votes', variable_name: 'votes_count', value: String(selectedPackage.votes) },
              { display_name: 'MoMo Network', variable_name: 'momo_network', value: method.label },
            ],
            momo_phone: cleanPhone,
            momo_provider: method.momoProvider,
          },
        }),
        ...(!method.isMomo && {
          metadata: {
            custom_fields: [
              { display_name: 'Voter Name', variable_name: 'voter_name', value: voterName.trim() },
              { display_name: 'Nominee', variable_name: 'nominee_name', value: nominee?.name || '' },
              { display_name: 'Votes', variable_name: 'votes_count', value: String(selectedPackage.votes) },
            ],
          },
        }),

        onSuccess: (transaction) => {
          // transaction.reference is the Paystack reference
          setLaunching(false);
          onSubmitVote({
            package: selectedPackage,
            voterName: voterName.trim(),
            voterEmail: voterEmail.trim(),
            voterPhone: method.isMomo ? cleanPhone : '',
            paymentMethod: paymentMethodId,
            gatewayReference: transaction.reference || ref,
          });
        },

        onCancel: () => {
          setLaunching(false);
          setStep('details');
          toast('Payment cancelled. You can try again when ready.');
        },

        onError: (error) => {
          setLaunching(false);
          setStep('details');
          console.error('Paystack error:', error);
          toast.error(`Payment error: ${error?.message || 'Something went wrong. Please try again.'}`);
        },
      });
    } catch (err) {
      setLaunching(false);
      setStep('details');
      console.error('PaystackPop init error:', err);
      toast.error('Could not launch payment. Please refresh and try again.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[95vh] overflow-y-auto rounded-t-3xl sm:max-w-lg sm:mx-auto sm:rounded-2xl p-0"
      >
        <div className="p-5 pb-8 space-y-0">
          {/* Nominee strip */}
          {nominee && (
            <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-muted/60 border border-border/40">
              {nominee.photo_url ? (
                <img src={nominee.photo_url} alt={nominee.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-accent/30" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Voting for</p>
                <p className="font-heading font-bold text-sm leading-tight">{nominee.name}</p>
              </div>
            </div>
          )}

          {/* ── STEP 1: Package Selection ── */}
          {step === 'package' && (
            <div className="space-y-4">
              <SheetHeader className="text-left p-0 mb-1">
                <SheetTitle className="font-heading text-xl">Choose Vote Package</SheetTitle>
                <p className="text-sm text-muted-foreground">Select how many votes you want to cast</p>
              </SheetHeader>
              <VotePackageSelector
                packages={packages}
                selectedPackage={selectedPackage}
                onSelect={setSelectedPackage}
                basePricePerVote={basePricePerVote}
              />
              <Button
                onClick={() => setStep('details')}
                disabled={!selectedPackage || selectedPackage.votes < 1}
                className="w-full h-12 gold-gradient text-white border-0 font-bold text-base mt-2"
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* ── STEP 2: Voter Details + Payment Method ── */}
          {step === 'details' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => setStep('package')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
                <SheetTitle className="font-heading text-xl ml-1">Pay & Vote</SheetTitle>
              </div>

              {/* Payment Method */}
              <div>
                <Label className="text-sm font-semibold mb-2.5 block">Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethodId(m.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                        paymentMethodId === m.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/40 bg-card'
                      }`}
                    >
                      <span className="text-xl leading-none">{m.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight truncate">{m.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{m.desc}</p>
                      </div>
                      {paymentMethodId === m.id && (
                        <CheckCircle2 className="w-4 h-4 text-primary ml-auto flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Voter Details */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold block">Your Details</Label>

                {/* Name */}
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Full name *"
                    value={voterName}
                    onChange={e => setVoterName(e.target.value)}
                    className="pl-9"
                    autoComplete="name"
                  />
                </div>

                {/* Email — always required (Paystack mandates it) */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address * (for receipt)"
                    value={voterEmail}
                    onChange={e => setVoterEmail(e.target.value)}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>

                {/* Phone — only for MoMo */}
                {method.isMomo && (
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder={`${method.label} number * (e.g. 0241234567)`}
                      value={voterPhone}
                      onChange={e => setVoterPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                      className="pl-9"
                      maxLength={14}
                      autoComplete="tel"
                    />
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-muted/60 rounded-xl p-4 space-y-2 border border-border/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nominee</span>
                  <span className="font-medium truncate max-w-[180px]">{nominee?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Votes</span>
                  <span className="font-semibold">{selectedPackage?.votes} vote{selectedPackage?.votes !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-semibold">{method?.label}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-sm">Total</span>
                  <span className="font-display text-2xl font-black">GH₵ {selectedPackage?.price_ghs?.toFixed(2)}</span>
                </div>
              </div>

              {method.isMomo && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    After clicking Pay, you'll receive a mobile money prompt on <strong>{voterPhone || 'your phone'}</strong>. Approve it to complete your vote.
                  </p>
                </div>
              )}

              <Button
                onClick={handlePay}
                disabled={isProcessing || launching}
                className="w-full h-12 gold-gradient text-white border-0 font-bold text-base shadow-lg shadow-accent/20"
              >
                {(isProcessing || launching) ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Launching payment...</>
                ) : method.isMomo ? (
                  <><Phone className="w-4 h-4 mr-2" /> Pay GH₵ {selectedPackage?.price_ghs?.toFixed(2)} via {method.label}</>
                ) : (
                  <><CreditCard className="w-4 h-4 mr-2" /> Pay GH₵ {selectedPackage?.price_ghs?.toFixed(2)} by Card</>
                )}
              </Button>

              <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1.5 pb-1">
                <Lock className="w-3 h-3" />
                Secured by Paystack · Votes only recorded after payment confirmation
              </p>
            </div>
          )}

          {/* ── STEP 3: Processing ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center shadow-lg">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-heading font-bold text-lg">Payment in Progress</p>
                <p className="text-sm text-muted-foreground">
                  {method?.isMomo
                    ? 'Check your phone for the MoMo approval prompt.'
                    : 'Complete your payment in the Paystack popup.'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Do not close this page.</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}