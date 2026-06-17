import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAdmin } from '@/lib/auth-helpers';

export async function POST(request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email sending is not configured on the server yet.' }, { status: 503 });
    }

    const { to, subject, body, from_name } = await request.json();
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing to, subject, or body' }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'eVoteGH <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: from_name ? `${from_name} <${fromAddress.split('<')[1]?.replace('>', '') || fromAddress}>` : fromAddress,
      to,
      subject,
      html: body,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ sent: true, id: data?.id });
  } catch (err) {
    console.error('POST /api/email', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
