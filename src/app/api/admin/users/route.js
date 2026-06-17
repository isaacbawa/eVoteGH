import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { requireAdmin } from '@/lib/auth-helpers';

function toUserShape(clerkUser) {
  return {
    id: clerkUser.id,
    email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
    full_name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' '),
    role: clerkUser.publicMetadata?.role || 'user',
  };
}

export async function GET(request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const client = await clerkClient();

    if (email) {
      const { data } = await client.users.getUserList({ emailAddress: [email] });
      return NextResponse.json(data.map(toUserShape));
    }

    const { data } = await client.users.getUserList({ limit: 100 });
    return NextResponse.json(data.map(toUserShape));
  } catch (err) {
    console.error('GET /api/admin/users', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
