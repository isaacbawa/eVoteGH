'use client';

import { db } from '@/lib/api-client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Loader2, CheckCircle2,
  ImageIcon, Upload, Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { slugify, generateVotePackages } from '@/lib/utils/slugify';
import RoleGuard from '@/components/layout/RoleGuard';

const STEPS = ['Event Details', 'Voting Packages', 'Categories', 'Review'];

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong-Ahafo',
  'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North',
];

const EVENT_TYPES = ['church', 'university', 'corporate', 'community', 'entertainment', 'other'];

function AdminEventCreateContent() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [details, setDetails] = useState({
    name: '',
    description: '',
    event_type: 'other',
    region: '',
    base_vote_price: '1',
    nomination_start: '',
    nomination_end: '',
    voting_start: '',
    voting_end: '',
    physical_event_date: '',
    banner_url: '',
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [packages, setPackages] = useState([]);
  const [packagesInitialised, setPackagesInitialised] = useState(false);

  const [categories, setCategories] = useState(['']);

  const setDetail = (key, val) => setDetails(d => ({ ...d, [key]: val }));

  // Auto-generate vote packages from base price the first time step 1 is reached
  const ensurePackagesInitialised = () => {
    if (!packagesInitialised) {
      const base = parseFloat(details.base_vote_price) || 1;
      setPackages(generateVotePackages(base));
      setPackagesInitialised(true);
    }
  };

  const updatePackage = (index, key, val) => {
    setPackages(pkgs => pkgs.map((p, i) => i === index ? { ...p, [key]: val } : p));
  };

  const addPackage = () => {
    setPackages(pkgs => [
      ...pkgs,
      { votes: 1, price_ghs: parseFloat(details.base_vote_price) || 1, is_highlighted: false, display_order: pkgs.length },
    ]);
  };

  const removePackage = (index) => {
    setPackages(pkgs => pkgs.filter((_, i) => i !== index));
  };

  const updateCategory = (index, val) => {
    setCategories(cats => cats.map((c, i) => i === index ? val : c));
  };

  const addCategory = () => setCategories(cats => [...cats, '']);
  const removeCategory = (index) => setCategories(cats => cats.filter((_, i) => i !== index));

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBannerPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      let banner_url = '';
      if (bannerFile) {
        setUploadingBanner(true);
        const res = await db.integrations.Core.UploadFile({ file: bannerFile });
        banner_url = res.file_url;
        setUploadingBanner(false);
      }

      const slug = slugify(details.name) + '-' + Date.now().toString(36);

      const event = await db.entities.Event.create({
        name: details.name,
        slug,
        description: details.description,
        event_type: details.event_type,
        region: details.region,
        base_vote_price: parseFloat(details.base_vote_price) || 1,
        nomination_start: details.nomination_start ? new Date(details.nomination_start).toISOString() : null,
        nomination_end: details.nomination_end ? new Date(details.nomination_end).toISOString() : null,
        voting_start: new Date(details.voting_start).toISOString(),
        voting_end: new Date(details.voting_end).toISOString(),
        physical_event_date: details.physical_event_date ? new Date(details.physical_event_date).toISOString() : null,
        banner_url,
        status: 'draft',
        is_public: true,
        commission_rate: 0.15,
        total_revenue: 0,
        total_votes: 0,
      });

      const validCategories = categories.map(c => c.trim()).filter(Boolean);
      await Promise.all(validCategories.map((name, i) =>
        db.entities.Category.create({
          event_id: event.id,
          name,
          slug: slugify(name),
          display_order: i,
          is_active: true,
        })
      ));

      await Promise.all(packages.map((pkg, i) =>
        db.entities.VotePackage.create({
          event_id: event.id,
          votes: parseInt(pkg.votes) || 1,
          price_ghs: parseFloat(pkg.price_ghs) || 0,
          is_highlighted: !!pkg.is_highlighted,
          display_order: i,
        })
      ));

      return event;
    },
    onSuccess: (event) => {
      toast.success('Event created successfully! 🎉');
      router.push(`/dashboard/admin/events/${event.id}`);
    },
    onError: (err) => {
      setUploadingBanner(false);
      console.error('Create event error:', err);
      toast.error('Failed to create event. Please check all fields and try again.');
    },
  });

  const canProceedStep0 = details.name.trim() && details.region && details.voting_start && details.voting_end && parseFloat(details.base_vote_price) > 0;
  const canProceedStep1 = packages.length > 0 && packages.every(p => p.votes > 0 && p.price_ghs > 0);
  const canProceedStep2 = categories.some(c => c.trim());

  const goNext = () => {
    if (step === 0) {
      if (!canProceedStep0) return toast.error('Please fill in all required event details.');
      ensurePackagesInitialised();
    }
    if (step === 1 && !canProceedStep1) return toast.error('Every package needs a vote count and price.');
    if (step === 2 && !canProceedStep2) return toast.error('Add at least one category.');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/dashboard/admin/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl font-black mb-1">Create New Event</h1>
        <p className="text-muted-foreground">Set up a new election in a few simple steps</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'gold-gradient text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border mx-2 sm:mx-3" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Event Details */}
      {step === 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Event Name *</Label>
              <Input value={details.name} onChange={e => setDetail('name', e.target.value)} placeholder="e.g. Mr & Miss University 2026" />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={details.description} onChange={e => setDetail('description', e.target.value)} rows={3} placeholder="Tell voters what this event is about..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Event Type</Label>
                <Select value={details.event_type} onValueChange={v => setDetail('event_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Region *</Label>
                <Select value={details.region} onValueChange={v => setDetail('region', v)}>
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Base Vote Price (GH₵) *</Label>
              <Input type="number" min="0.01" step="0.01" value={details.base_vote_price} onChange={e => setDetail('base_vote_price', e.target.value)} />
              <p className="text-xs text-muted-foreground">Used to auto-generate vote packages in the next step.</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Nomination Window (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nominations Open</Label>
                  <Input type="datetime-local" value={details.nomination_start} onChange={e => setDetail('nomination_start', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nominations Close</Label>
                  <Input type="datetime-local" value={details.nomination_end} onChange={e => setDetail('nomination_end', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Voting Window *</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Voting Opens *</Label>
                  <Input type="datetime-local" value={details.voting_start} onChange={e => setDetail('voting_start', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Voting Closes *</Label>
                  <Input type="datetime-local" value={details.voting_end} onChange={e => setDetail('voting_end', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Physical Event (optional)</p>
              <div className="space-y-1.5">
                <Label>Physical Event Date</Label>
                <Input type="datetime-local" value={details.physical_event_date} onChange={e => setDetail('physical_event_date', e.target.value)} />
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Banner Image (optional)</p>
              <div className="flex items-center gap-4">
                <div className="w-28 h-20 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-muted-foreground/40" />
                  )}
                </div>
                <div>
                  <Label htmlFor="banner-upload" className="cursor-pointer">
                    <div className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                      <Upload className="w-4 h-4" /> Upload Banner
                    </div>
                  </Label>
                  <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                  <p className="text-xs text-muted-foreground mt-1.5">Recommended: 1200×400px landscape image.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Voting Packages */}
      {step === 1 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Voting Packages</CardTitle>
            <p className="text-sm text-muted-foreground">Auto-generated from your base vote price — adjust as needed.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {packages.map((pkg, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Votes</Label>
                    <Input
                      type="number" min="1"
                      value={pkg.votes}
                      onChange={e => updatePackage(i, 'votes', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Price (GH₵)</Label>
                    <Input
                      type="number" min="0.01" step="0.01"
                      value={pkg.price_ghs}
                      onChange={e => updatePackage(i, 'price_ghs', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant={pkg.is_highlighted ? 'default' : 'outline'}
                  size="sm"
                  className={pkg.is_highlighted ? 'gold-gradient text-white border-0 gap-1' : 'gap-1'}
                  onClick={() => updatePackage(i, 'is_highlighted', !pkg.is_highlighted)}
                  title="Mark as most popular"
                >
                  <Star className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive flex-shrink-0"
                  onClick={() => removePackage(i)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full gap-2" onClick={addPackage}>
              <Plus className="w-4 h-4" /> Add Package
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Categories */}
      {step === 2 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Categories</CardTitle>
            <p className="text-sm text-muted-foreground">What categories will nominees compete in? (e.g. "Best Dressed", "Most Influential")</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={cat}
                  onChange={e => updateCategory(i, e.target.value)}
                  placeholder={`Category ${i + 1} name`}
                />
                {categories.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => removeCategory(i)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full gap-2" onClick={addCategory}>
              <Plus className="w-4 h-4" /> Add Category
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Review & Create</CardTitle>
            <p className="text-sm text-muted-foreground">Double-check everything before publishing.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Event</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{details.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{details.event_type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Region</span><span className="font-medium">{details.region}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Base Vote Price</span><span className="font-medium">GH₵ {details.base_vote_price}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Voting Window</span><span className="font-medium text-right">{details.voting_start && new Date(details.voting_start).toLocaleString()} – {details.voting_end && new Date(details.voting_end).toLocaleString()}</span></div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Voting Packages ({packages.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {packages.map((p, i) => (
                  <Badge key={i} variant={p.is_highlighted ? 'default' : 'secondary'} className={p.is_highlighted ? 'gold-gradient text-white border-0' : ''}>
                    {p.votes} votes — GH₵ {p.price_ghs}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Categories ({categories.filter(c => c.trim()).length})
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.filter(c => c.trim()).map((c, i) => (
                  <Badge key={i} variant="outline">{c}</Badge>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              The event will be created with status <strong>Draft</strong>. You can switch it to "Nominations Open" or "Voting Open" from the event's Settings tab whenever you're ready to launch.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={goBack} disabled={step === 0} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={goNext} className="gold-gradient text-white border-0 font-semibold gap-2">
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || uploadingBanner}
            className="gold-gradient text-white border-0 font-semibold gap-2"
          >
            {(createMutation.isPending || uploadingBanner) ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Create Event</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AdminEventCreatePage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminEventCreateContent />
    </RoleGuard>
  );
}
