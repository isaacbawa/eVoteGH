import { NextResponse } from 'next/server';
import { query, DATE_ALIASES } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';

const ALLOWED_UPDATES = [
  'organizer_id', 'name', 'slug', 'description', 'event_type', 'region',
  'physical_event_date', 'nomination_start', 'nomination_end',
  'voting_start', 'voting_end', 'status', 'commission_rate',
  'banner_url', 'logo_url', 'is_public', 'base_vote_price',
  'total_revenue', 'total_votes',
];

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const result = await query(`SELECT * ${DATE_ALIASES} FROM events WHERE id = $1`, [id]);
    if (!result.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const updates = [];
    const values = [];
    let idx = 1;
    for (const field of ALLOWED_UPDATES) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        values.push(body[field]);
      }
    }
    if (!updates.length) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    updates.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE events SET ${updates.join(', ')} WHERE id = $${idx}
       RETURNING *, created_at AS created_date, updated_at AS updated_date`,
      values
    );
    if (!result.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /api/events/[id]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { id } = await params;
    await query('DELETE FROM events WHERE id = $1', [id]);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
