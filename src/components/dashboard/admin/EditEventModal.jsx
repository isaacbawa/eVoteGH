'use client';

import { db } from '@/lib/api-client';

import React, { useState, useEffect } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const REGIONS = [
  'Greater Accra','Ashanti','Western','Eastern','Central','Volta',
  'Northern','Upper East','Upper West','Brong-Ahafo','Oti','Savannah',
  'North East','Bono East','Western North','Ahafo',
];

const EVENT_TYPES = ['church','university','corporate','community','entertainment','other'];

// Convert datetime-local string to ISO for storage
const toISO = (val) => val ? new Date(val).toISOString() : null;
// Convert ISO to datetime-local input format
const toLocal = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  } catch { return ''; }
};

export default function EditEventModal({ event, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (event) {
      setForm({
        name: event.name || '',
        description: event.description || '',
        region: event.region || '',
        event_type: event.event_type || 'other',
        base_vote_price: event.base_vote_price || '',
        nomination_start: toLocal(event.nomination_start),
        nomination_end: toLocal(event.nomination_end),
        voting_start: toLocal(event.voting_start),
        voting_end: toLocal(event.voting_end),
        physical_event_date: toLocal(event.physical_event_date),
      });
    }
  }, [event]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const saveMutation = useMutation({
    mutationFn: () => db.entities.Event.update(event.id, {
      name: form.name,
      description: form.description,
      region: form.region,
      event_type: form.event_type,
      base_vote_price: parseFloat(form.base_vote_price) || event.base_vote_price,
      nomination_start: toISO(form.nomination_start),
      nomination_end: toISO(form.nomination_end),
      voting_start: toISO(form.voting_start),
      voting_end: toISO(form.voting_end),
      physical_event_date: toISO(form.physical_event_date),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event-detail', event.id] });
      toast.success('Event details updated successfully');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update event details'),
  });

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Edit Event Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Event Name *</Label>
            <Input value={form.name || ''} onChange={e => set('name', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Event Type</Label>
              <Select value={form.event_type || 'other'} onValueChange={v => set('event_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Region</Label>
              <Select value={form.region || ''} onValueChange={v => set('region', v)}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>
                  {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Base Vote Price (GH₵)</Label>
            <Input type="number" min="0.01" step="0.01" value={form.base_vote_price || ''} onChange={e => set('base_vote_price', e.target.value)} />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Nomination Window</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nominations Open</Label>
                <Input type="datetime-local" value={form.nomination_start || ''} onChange={e => set('nomination_start', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Nominations Close</Label>
                <Input type="datetime-local" value={form.nomination_end || ''} onChange={e => set('nomination_end', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Voting Window</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Voting Opens *</Label>
                <Input type="datetime-local" value={form.voting_start || ''} onChange={e => set('voting_start', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Voting Closes *</Label>
                <Input type="datetime-local" value={form.voting_end || ''} onChange={e => set('voting_end', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Physical Event</p>
            <div className="space-y-1.5">
              <Label>Physical Event Date (optional)</Label>
              <Input type="datetime-local" value={form.physical_event_date || ''} onChange={e => set('physical_event_date', e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.name?.trim() || !form.voting_start || !form.voting_end}
            className="gold-gradient text-white border-0 gap-1"
          >
            {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}