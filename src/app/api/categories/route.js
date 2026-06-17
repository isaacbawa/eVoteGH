import { NextResponse } from 'next/server';
import { query, buildSort, DATE_ALIASES } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const id = searchParams.get('id');
    const isActive = searchParams.get('is_active');
    const sort = searchParams.get('sort');
    const limit = parseInt(searchParams.get('limit')) || 200;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (eventId) { conditions.push(`event_id = $${idx++}`); values.push(eventId); }
    if (id)      { conditions.push(`id = $${idx++}`);       values.push(id); }
    if (isActive !== null) {
      conditions.push(`is_active = $${idx++}`);
      values.push(isActive === 'true');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = buildSort(sort, 'display_order ASC');

    const result = await query(
      `SELECT * ${DATE_ALIASES} FROM categories ${where} ORDER BY ${orderBy} LIMIT ${limit}`,
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
    const { event_id, name, slug, description, cover_image_url, display_order, is_active } = await request.json();
    const result = await query(
      `INSERT INTO categories (event_id, name, slug, description, cover_image_url, display_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *, created_at AS created_date, updated_at AS updated_date`,
      [event_id, name, slug, description || null, cover_image_url || null, display_order ?? 0, is_active ?? true]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/categories', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
