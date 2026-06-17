import { NextResponse } from 'next/server';
import { query, buildSort, DATE_ALIASES } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const id = searchParams.get('id');
    const sort = searchParams.get('sort');
    const limit = parseInt(searchParams.get('limit')) || 50;

    const conditions = [];
    const values = [];
    let idx = 1;
    if (eventId) { conditions.push(`event_id = $${idx++}`); values.push(eventId); }
    if (id)      { conditions.push(`id = $${idx++}`);       values.push(id); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = buildSort(sort, 'display_order ASC');

    const result = await query(
      `SELECT * ${DATE_ALIASES} FROM vote_packages ${where} ORDER BY ${orderBy} LIMIT ${limit}`,
      values
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { event_id, votes, price_ghs, is_highlighted, display_order } = await request.json();
    const result = await query(
      `INSERT INTO vote_packages (event_id, votes, price_ghs, is_highlighted, display_order)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *, created_at AS created_date, updated_at AS updated_date`,
      [event_id, votes, price_ghs, is_highlighted ?? false, display_order ?? 0]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/vote-packages', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
