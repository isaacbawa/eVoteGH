'use client';

import { db } from '@/lib/api-client';

import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus, Loader2, Mail, CheckCircle2, Clock, Trash2,
  Building2, Send, AlertCircle, Users, BookOpen,
  ChevronDown, ChevronUp, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ROLE_STEPS = [
  {
    step: '1',
    title: 'Invite via the form below',
    body: 'Use the "Invite New Organizer" form for organizers. For nominees, share the event nomination link — they self-nominate, then you approve them in the Nominations tab.',
  },
  {
    step: '2',
    title: 'They register on eVoteGH',
    body: 'The invited person clicks the email link and creates their account using the exact email address you invited.',
  },
  {
    step: '3',
    title: 'Role is automatically applied',
    body: 'The invite flow sets their role to Organizer and creates an organizer record linked to this event — all in one step.',
  },
  {
    step: '4',
    title: 'They access their scoped dashboard',
    body: 'After logging in, they go to /dashboard and are redirected to the Organizer or Nominee dashboard, scoped only to their assigned events.',
  },
];

const ROLE_TABLE = [
  { role: 'admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', perms: 'Full access to all events, nominations, payouts, commissions, and every dashboard.' },
  { role: 'organizer', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', perms: 'Event performance, live leaderboard, revenue analytics, and payout settings for assigned events.' },
  { role: 'nominee', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', perms: 'Personal vote count, ranking, revenue share, and shareable nominee profile.' },
];

export default function InvitePanel({ event }) {
  const queryClient = useQueryClient();
  const [guideOpen, setGuideOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteOrgName, setInviteOrgName] = useState('');
  const [inviteContactName, setInviteContactName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState(null);

  const { data: organizers = [], isLoading } = useQuery({
    queryKey: ['event-organizers', event?.id],
    queryFn: async () => {
      const all = await db.entities.Organizer.list('-created_date', 100);
      return all.filter(o => o.event_ids && o.event_ids.includes(event.id));
    },
    enabled: !!event?.id,
    refetchInterval: 30000,
  });

  const removeMutation = useMutation({
    mutationFn: async (organizer) => {
      const newEventIds = (organizer.event_ids || []).filter(id => id !== event.id);
      await db.entities.Organizer.update(organizer.id, {
        event_ids: newEventIds,
        ...(newEventIds.length === 0 ? { is_active: false } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-organizers', event?.id] });
      toast.success('Organizer removed from this event');
    },
  });

  const sendInviteEmail = async ({ email, contactName, orgName, appUrl, isNewUser }) => {
    await db.integrations.Core.SendEmail({
      to: email,
      from_name: 'eVoteGH',
      subject: `🎉 You've been invited as Organizer — ${event?.name}`,
      body: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
  <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center">
    <h1 style="color:#fbbf24;font-size:24px;margin:0 0 4px">eVoteGH</h1>
    <p style="color:#c7d2fe;margin:0;font-size:14px">Secure Online Voting Platform</p>
  </div>
  <div style="background:#fff;padding:32px 24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
    <h2 style="color:#1e1b4b;font-size:20px;margin:0 0 8px">Hi ${contactName || 'there'}, you've been invited!</h2>
    <p style="color:#374151;margin:0 0 16px">
      You have been assigned as <strong>Organizer</strong> for the following event on eVoteGH:
    </p>
    <div style="background:#f5f3ff;border-left:4px solid #6d28d9;padding:14px 18px;border-radius:0 8px 8px 0;margin:0 0 24px">
      <p style="margin:0 0 4px;font-weight:700;color:#4c1d95;font-size:17px">${event?.name}</p>
      ${event?.region ? `<p style="margin:0;color:#7c3aed;font-size:13px">${event.region}</p>` : ''}
    </div>
    <p style="color:#374151;margin:0 0 8px;font-size:14px">As an Organizer, you'll have access to:</p>
    <ul style="margin:0 0 24px;padding-left:20px;color:#6b7280;font-size:14px;line-height:1.8">
      <li>Real-time vote counts and rankings</li>
      <li>Live revenue dashboard and analytics</li>
      <li>Payout tracking and disbursement management</li>
    </ul>
    <p style="color:#374151;margin:0 0 16px;font-size:14px;font-weight:500">
      ${isNewUser ? '👉 Register with this email to get started:' : '👉 Log in to your account to access your dashboard:'}
    </p>
    <div style="margin-bottom:28px">
      ${isNewUser ? `<a href="${appUrl}/register" style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1a1a2e;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;font-size:15px;margin-right:12px">Register Now →</a>` : ''}
      <a href="${appUrl}/login" style="display:inline-block;background:${isNewUser ? '#f3f4f6' : 'linear-gradient(135deg,#6d28d9,#4f46e5)'};color:${isNewUser ? '#374151' : '#fff'};font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;font-size:15px;border:${isNewUser ? '1px solid #d1d5db' : 'none'}">Log In ${isNewUser ? '' : '→'}</a>
    </div>
    <div style="background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:13px;color:#6b7280">
      <strong style="color:#374151">Important:</strong> Use the email <strong style="color:#4f46e5">${email}</strong> when registering to ensure your Organizer role is applied correctly.
    </div>
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">
      Sent by <strong>eVoteGH</strong> · If you did not expect this, you can safely ignore it.
    </p>
  </div>
</div>`,
    });
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return toast.error('Enter an email address');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Enter a valid email address');
    if (!inviteContactName.trim()) return toast.error('Enter the contact person name');

    setInviting(true);
    const appUrl = window.location.origin;
    let isNewUser = true;
    let assignedUserId = null;

    try {
      try {
        await db.users.inviteUser(email, 'user');
        isNewUser = true;
      } catch {
        isNewUser = false;
      }

      try {
        const users = await db.entities.User.filter({ email });
        if (users?.length > 0) {
          assignedUserId = users[0].id;
          // Ensure they have 'user' role (the unified non-admin role)
          if (users[0].role !== 'user' && users[0].role !== 'admin') {
            await db.entities.User.update(users[0].id, { role: 'user' });
          }
        }
      } catch (e) {
        console.warn('Role assignment:', e?.message);
      }

      try {
        const existing = await db.entities.Organizer.filter({ email });
        if (existing?.length > 0) {
          const org = existing[0];
          const updatedEventIds = Array.from(new Set([...(org.event_ids || []), event.id]));
          await db.entities.Organizer.update(org.id, {
            event_ids: updatedEventIds,
            is_active: true,
            invite_status: 'pending',
            ...(assignedUserId && !org.user_id ? { user_id: assignedUserId } : {}),
            ...(inviteContactName.trim() ? { contact_name: inviteContactName.trim() } : {}),
            ...(inviteOrgName.trim() ? { organization_name: inviteOrgName.trim() } : {}),
            ...(invitePhone.trim() ? { phone: invitePhone.trim() } : {}),
          });
        } else {
          await db.entities.Organizer.create({
            user_id: assignedUserId || '',
            email,
            contact_name: inviteContactName.trim(),
            organization_name: inviteOrgName.trim() || inviteContactName.trim(),
            phone: invitePhone.trim() || '',
            disbursement_method: 'momo',
            event_ids: [event.id],
            invite_status: 'pending',
            is_active: true,
          });
        }
      } catch (e) {
        console.warn('Organizer record:', e?.message);
      }

      await sendInviteEmail({ email, contactName: inviteContactName.trim(), orgName: inviteOrgName.trim(), appUrl, isNewUser });

      queryClient.invalidateQueries({ queryKey: ['event-organizers', event?.id] });
      toast.success(`✅ Invitation sent to ${email}${!isNewUser ? ' — role updated' : ''}`);
      setInviteEmail('');
      setInviteOrgName('');
      setInviteContactName('');
      setInvitePhone('');
    } catch (err) {
      console.error('Invite error:', err);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const handleResend = async (org) => {
    setResendingId(org.id);
    try {
      await sendInviteEmail({
        email: org.email,
        contactName: org.contact_name,
        orgName: org.organization_name,
        appUrl: window.location.origin,
        isNewUser: org.invite_status === 'pending',
      });
      toast.success(`Invite resent to ${org.email}`);
    } catch {
      toast.error('Failed to resend. Try again.');
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Admin Role Assignment Guide ── */}
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader className="pb-0 cursor-pointer select-none" onClick={() => setGuideOpen(g => !g)}>
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-base flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <BookOpen className="w-4 h-4 text-amber-600" />
              How Role Assignment Works
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                Admin Guide
              </span>
            </CardTitle>
            {guideOpen
              ? <ChevronUp className="w-4 h-4 text-amber-600 flex-shrink-0" />
              : <ChevronDown className="w-4 h-4 text-amber-600 flex-shrink-0" />
            }
          </div>
          {!guideOpen && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1.5">
              Click to learn how to assign Organizer &amp; Nominee roles — this is one of eVoteGH's core superpowers.
            </p>
          )}
        </CardHeader>

        {guideOpen && (
          <CardContent className="pt-4 space-y-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              eVoteGH uses a <strong>role-based access system</strong>. You (the admin) control exactly
              who can access which dashboard. Here's the complete flow:
            </p>

            <div className="space-y-3">
              {ROLE_STEPS.map(({ step, title, body }) => (
                <div key={step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center flex-shrink-0 font-bold text-sm text-amber-800 dark:text-amber-200 mt-0.5">
                    {step}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">{title}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mt-0.5">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl overflow-hidden border border-amber-200 dark:border-amber-700">
              <div className="bg-amber-100/70 dark:bg-amber-900/40 px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                  Role Permissions at a Glance
                </p>
              </div>
              {ROLE_TABLE.map(({ role, color, perms }, i) => (
                <div
                  key={role}
                  className={`flex items-start gap-3 px-3 py-2.5 bg-white/40 dark:bg-amber-950/10 ${i > 0 ? 'border-t border-amber-100 dark:border-amber-800' : ''}`}
                >
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 capitalize ${color}`}>
                    {role}
                  </span>
                  <p className="text-xs text-amber-800 dark:text-amber-300">{perms}</p>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-white/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700">
              <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Admin superpower:</strong> Admin users can view the Organizer and Nominee dashboards
                directly — no extra role needed. Use this to monitor what your organizers and nominees see.
                The invite form below handles organizer setup automatically in one step.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Organizers Card ── */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Event Organizers
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {organizers.length} assigned
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Assign organizers who can monitor this event's dashboard, revenue, and payouts.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading organizers...
            </div>
          ) : organizers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 bg-muted/30 rounded-xl border border-dashed text-center">
              <Building2 className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No organizers assigned yet</p>
              <p className="text-xs text-muted-foreground mt-1">Use the form below to invite someone.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {organizers.map(org => (
                <div
                  key={org.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <p className="text-sm font-semibold truncate">{org.contact_name || org.organization_name}</p>
                      <Badge
                        className={org.invite_status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] px-1.5'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 text-[10px] px-1.5'
                        }
                      >
                        {org.invite_status === 'accepted'
                          ? <><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Active</>
                          : <><Clock className="w-2.5 h-2.5 mr-0.5" />Pending</>
                        }
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {org.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />{org.email}
                        </span>
                      )}
                      <span>Invited {org.created_date ? format(new Date(org.created_date), 'MMM d') : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {org.invite_status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 px-2"
                        disabled={resendingId === org.id}
                        onClick={() => handleResend(org)}
                      >
                        {resendingId === org.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Send className="w-3 h-3" />
                        }
                        Resend
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Remove ${org.contact_name || org.email} from this event?`)) {
                          removeMutation.mutate(org);
                        }
                      }}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border/50 pt-4">
            <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-primary" />
              Invite New Organizer
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Contact Name *</Label>
                  <Input
                    placeholder="Full name"
                    value={inviteContactName}
                    onChange={e => setInviteContactName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Organization / Company</Label>
                  <Input
                    placeholder="Organization name (optional)"
                    value={inviteOrgName}
                    onChange={e => setInviteOrgName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="organizer@example.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="e.g. 0241234567"
                    value={invitePhone}
                    onChange={e => setInvitePhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  The organizer will receive an invitation email with login instructions.
                  Their role will be automatically set to <strong>Organizer</strong>, giving them access
                  to the event's performance dashboard and payout details.
                </p>
              </div>

              <Button
                onClick={handleInvite}
                disabled={inviting}
                className="w-full gap-2 gold-gradient text-white border-0 font-semibold"
              >
                {inviting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending invitation...</>
                  : <><Send className="w-4 h-4" /> Send Organizer Invitation</>
                }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}