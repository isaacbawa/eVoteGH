import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { requireAdmin } from '@/lib/auth-helpers';

export async function POST(request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { email, role } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const client = await clerkClient();

    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role: role || 'user' },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/register`,
      notify: false, // we send our own branded email from InvitePanel via /api/email
    });

    return NextResponse.json({ id: invitation.id, status: invitation.status });
  } catch (err) {
    // Clerk throws if an invitation/user already exists for this email —
    // surface that distinctly so the caller can fall back gracefully
    // (InvitePanel already does this: falls back to "isNewUser = false").
    console.warn('POST /api/admin/invite', err.message);
    return NextResponse.json({ error: err.message || 'Could not create invitation' }, { status: 409 });
  }
}
