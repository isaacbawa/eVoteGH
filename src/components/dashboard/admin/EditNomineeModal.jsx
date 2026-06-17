'use client';

import { db } from '@/lib/api-client';

import React, { useState, useEffect } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EditNomineeModal({ nominee, categories, eventId, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (nominee) {
      setForm({
        name: nominee.name || '',
        bio: nominee.bio || '',
        phone: nominee.phone || '',
        email: nominee.email || '',
        category_id: nominee.category_id || '',
        approval_status: nominee.approval_status || 'pending',
        is_active: nominee.is_active ?? true,
        nomination_reason: nominee.nomination_reason || '',
        nominated_by_name: nominee.nominated_by_name || '',
        nominated_by_phone: nominee.nominated_by_phone || '',
      });
    }
  }, [nominee]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const saveMutation = useMutation({
    mutationFn: () => db.entities.Nominee.update(nominee.id, {
      ...form,
      is_active: form.approval_status === 'approved',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event-nominees', eventId] });
      toast.success('Nominee updated successfully');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update nominee'),
  });

  if (!nominee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Edit Nominee — {nominee.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={form.name || ''} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={form.category_id || ''} onValueChange={v => set('category_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="024XXXXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea value={form.bio || ''} onChange={e => set('bio', e.target.value)} rows={3} placeholder="Short biography..." />
          </div>

          <div className="space-y-1.5">
            <Label>Nomination Reason</Label>
            <Textarea value={form.nomination_reason || ''} onChange={e => set('nomination_reason', e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nominated By (Name)</Label>
              <Input value={form.nominated_by_name || ''} onChange={e => set('nominated_by_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nominated By (Phone)</Label>
              <Input value={form.nominated_by_phone || ''} onChange={e => set('nominated_by_phone', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Approval Status</Label>
            <Select value={form.approval_status || 'pending'} onValueChange={v => set('approval_status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.name?.trim()}
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