import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { requireAdmin } from '@/lib/auth-helpers';

export async function PATCH(request, { params }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { id } = await params;
    const { role } = await request.json();
    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'role must be "admin" or "user"' }, { status: 400 });
    }

    const client = await clerkClient();
    const updated = await client.users.updateUserMetadata(id, {
      publicMetadata: { role },
    });

    return NextResponse.json({
      id: updated.id,
      email: updated.emailAddresses?.[0]?.emailAddress || '',
      full_name: [updated.firstName, updated.lastName].filter(Boolean).join(' '),
      role: updated.publicMetadata?.role || 'user',
    });
  } catch (err) {
    console.error('PATCH /api/admin/users/[id]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
