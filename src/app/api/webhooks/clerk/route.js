import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { clerkClient } from '@clerk/nextjs/server';
import { headers } from 'next/headers';

export async function POST(request) {
  try {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      console.warn('CLERK_WEBHOOK_SECRET is not set — skipping webhook verification.');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }

    const headerPayload = await headers();
    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
    }

    const body = await request.text();
    const wh = new Webhook(secret);

    let event;
    try {
      event = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'user.created') {
      const user = event.data;
      // Don't clobber a role that was already set (e.g. via an admin invitation
      // that pre-set publicMetadata.role before the user finished registering).
      if (!user.public_metadata?.role) {
        const client = await clerkClient();
        await client.users.updateUserMetadata(user.id, {
          publicMetadata: { role: 'user' },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('POST /api/webhooks/clerk', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
