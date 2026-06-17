import { NextResponse } from 'next/server';
import { query, DATE_ALIASES } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';

const ALLOWED_UPDATES = ['votes', 'price_ghs', 'is_highlighted', 'display_order'];

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const result = await query(`SELECT * ${DATE_ALIASES} FROM vote_packages WHERE id = $1`, [id]);
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
    for (const f of ALLOWED_UPDATES) {
      if (body[f] !== undefined) { updates.push(`${f} = $${idx++}`); values.push(body[f]); }
    }
    if (!updates.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    updates.push('updated_at = NOW()');
    values.push(id);
    const result = await query(
      `UPDATE vote_packages SET ${updates.join(', ')} WHERE id = $${idx}
       RETURNING *, created_at AS created_date, updated_at AS updated_date`,
      values
    );
    if (!result.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { id } = await params;
    await query('DELETE FROM vote_packages WHERE id = $1', [id]);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
