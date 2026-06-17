'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/api-client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, UserPlus, CheckCircle2, ArrowLeft, Loader2, Camera, Trophy, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { slugify } from '@/lib/utils/slugify';
import { motion } from 'framer-motion';

export default function NominatePage() {
  const { eventSlug } = useParams();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    nominee_name: '',
    nominee_phone: '',
    nominee_email: '',
    bio: '',
    nomination_reason: '',
    category_id: '',
    nominator_name: '',
    nominator_phone: '',
  });

  const { data: events = [] } = useQuery({
    queryKey: ['event', eventSlug],
    queryFn: () => db.entities.Event.filter({ slug: eventSlug }),
    enabled: !!eventSlug,
  });
  const event = events[0];

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', event?.id],
    queryFn: () => db.entities.Category.filter({ event_id: event.id, is_active: true }, 'display_order'),
    enabled: !!event,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      let photo_url = null;
      if (photoFile) {
        setUploading(true);
        const res = await db.integrations.Core.UploadFile({ file: photoFile });
        photo_url = res.file_url;
        setUploading(false);
      }

      return db.entities.Nominee.create({
        event_id: event.id,
        category_id: form.category_id,
        name: form.nominee_name,
        slug: slugify(form.nominee_name) + '-' + Date.now(),
        bio: form.bio,
        phone: form.nominee_phone,
        email: form.nominee_email,
        nomination_reason: form.nomination_reason,
        nominated_by_name: form.nominator_name,
        nominated_by_phone: form.nominator_phone,
        photo_url,
        approval_status: 'pending',
        is_active: false,
        total_votes: 0,
        total_revenue: 0,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['nominees', event?.id] });
    },
    onError: () => {
      setUploading(false);
      toast.error('Failed to submit nomination. Please try again.');
    },
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nominee_name.trim()) return toast.error("Please enter the nominee's name");
    if (!form.nominee_phone.trim()) return toast.error("Nominee's phone number is required");
    if (!form.category_id) return toast.error('Please select a category');
    if (!form.nominator_name.trim()) return toast.error('Please enter your name');
    submitMutation.mutate();
  };

  const isNominationOpen = event?.status === 'nomination_open';

  if (!event && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (event && !isNominationOpen) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">Nominations Closed</h2>
        <p className="text-muted-foreground mb-6">
          The nomination period for <strong>{event.name}</strong> is not currently open.
        </p>
        <Link href={`/event/${eventSlug}`}>
          <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Event</Button>
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
        </motion.div>
        <h2 className="font-display text-2xl font-black mb-3">Nomination Submitted!</h2>
        <p className="text-muted-foreground mb-2">
          <strong>{form.nominee_name}</strong>'s nomination has been submitted and is pending admin review.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Once approved, they will appear in the voting leaderboard.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ nominee_name:'',nominee_phone:'',nominee_email:'',bio:'',nomination_reason:'',category_id:'',nominator_name:'',nominator_phone:'' }); setPhotoPreview(null); setPhotoFile(null); }}>
            Nominate Another
          </Button>
          <Link href={`/event/${eventSlug}`}>
            <Button className="gold-gradient text-white border-0">View Event</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/event/${eventSlug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to {event?.name}
        </Link>
        <Badge className="mb-3 capitalize">{event?.event_type}</Badge>
        <h1 className="font-display text-3xl font-black mb-1">Nominate Someone</h1>
        <p className="text-muted-foreground">Submit a nomination for <strong>{event?.name}</strong>. The admin will review and approve nominees before voting begins.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" /> Nominee Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground/40" />
                )}
              </div>
              <div>
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    <Upload className="w-4 h-4" /> Upload Photo
                  </div>
                </Label>
                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG up to 5MB. Recommended: square photo.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base">Nominee Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">
                Category <span className="text-destructive">*</span>
                <span className="ml-2 text-xs font-normal text-muted-foreground">Choose the category you're nominating for</span>
              </Label>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories available yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {categories.map(cat => {
                    const isSelected = form.category_id === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setForm({ ...form, category_id: cat.id })}
                        className={`
                          group flex items-center gap-3 p-3.5 rounded-xl border-2 text-left
                          transition-all duration-200 cursor-pointer w-full
                          ${isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border/60 bg-card hover:border-primary/40 hover:bg-muted/40'
                          }
                        `}
                      >
                        <div className={`
                          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                          ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}
                          transition-colors
                        `}>
                          <Trophy className="w-4 h-4" />
                        </div>
                        <span className={`
                          font-semibold text-sm flex-1
                          ${isSelected ? 'text-primary' : 'text-foreground'}
                        `}>
                          {cat.name}
                        </span>
                        <ChevronRight className={`
                          w-4 h-4 flex-shrink-0 transition-all
                          ${isSelected ? 'text-primary rotate-90' : 'text-muted-foreground/40 group-hover:text-primary/40'}
                        `} />
                      </button>
                    );
                  })}
                </div>
              )}
              {!form.category_id && (
                <p className="text-xs text-muted-foreground mt-2">Tap a category above to select it.</p>
              )}
            </div>
            <div>
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input value={form.nominee_name} onChange={e => setForm({ ...form, nominee_name: e.target.value })} placeholder="Nominee's full name" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone Number <span className="text-destructive">*</span></Label>
                <Input value={form.nominee_phone} onChange={e => setForm({ ...form, nominee_phone: e.target.value })} placeholder="0XX XXX XXXX" required />
                <p className="text-xs text-muted-foreground mt-1">Required — used to contact the nominee about this nomination.</p>
              </div>
              <div>
                <Label>Email Address</Label>
                <Input type="email" value={form.nominee_email} onChange={e => setForm({ ...form, nominee_email: e.target.value })} placeholder="email@example.com" />
              </div>
            </div>
            <div>
              <Label>Short Bio</Label>
              <Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell us a bit about this person..." rows={3} />
            </div>
            <div>
              <Label>Why are you nominating them? <span className="text-destructive">*</span></Label>
              <Textarea value={form.nomination_reason} onChange={e => setForm({ ...form, nomination_reason: e.target.value })} placeholder="Describe why this person deserves to be nominated..." rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base">Your Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Your Name <span className="text-destructive">*</span></Label>
                <Input value={form.nominator_name} onChange={e => setForm({ ...form, nominator_name: e.target.value })} placeholder="Your full name" />
              </div>
              <div>
                <Label>Your Phone</Label>
                <Input value={form.nominator_phone} onChange={e => setForm({ ...form, nominator_phone: e.target.value })} placeholder="0XX XXX XXXX" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={submitMutation.isPending || uploading}
          className="w-full h-12 gold-gradient text-white border-0 font-bold text-base shadow-lg"
        >
          {submitMutation.isPending || uploading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
          ) : (
            <><UserPlus className="w-4 h-4 mr-2" /> Submit Nomination</>
          )}
        </Button>
      </form>
    </div>
  );
}
