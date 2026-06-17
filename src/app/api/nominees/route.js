import { NextResponse } from 'next/server';
import { query, buildSort, DATE_ALIASES } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      event_id: searchParams.get('event_id'),
      category_id: searchParams.get('category_id'),
      user_id: searchParams.get('user_id'),
      id: searchParams.get('id'),
      approval_status: searchParams.get('approval_status'),
    };
    const isActive = searchParams.get('is_active');
    const sort = searchParams.get('sort');
    const limit = parseInt(searchParams.get('limit')) || 500;

    const conditions = [];
    const values = [];
    let idx = 1;

    for (const [field, val] of Object.entries(filters)) {
      if (val === null) continue;
      conditions.push(`${field} = $${idx++}`);
      values.push(val);
    }
    if (isActive !== null) {
      conditions.push(`is_active = $${idx++}`);
      values.push(isActive === 'true');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = buildSort(sort);

    const result = await query(
      `SELECT * ${DATE_ALIASES} FROM nominees ${where} ORDER BY ${orderBy} LIMIT ${limit}`,
      values
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Public — anyone can submit a nomination, no sign-in required
// (matches the original NominatePage flow, which had no auth check).
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      category_id, event_id, user_id, name, slug, bio, photo_url,
      phone, email, nominated_by_name, nominated_by_phone,
      nomination_reason, approval_status, is_claimed, is_active,
      total_votes, total_revenue,
    } = body;

    if (!category_id || !event_id || !name || !slug) {
      return NextResponse.json({ error: 'Missing required nomination fields' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO nominees (
        category_id, event_id, user_id, name, slug, bio, photo_url,
        phone, email, nominated_by_name, nominated_by_phone,
        nomination_reason, approval_status, is_claimed, is_active,
        total_votes, total_revenue
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *, created_at AS created_date, updated_at AS updated_date`,
      [
        category_id, event_id, user_id || null, name, slug,
        bio || null, photo_url || null, phone || null, email || null,
        nominated_by_name || null, nominated_by_phone || null,
        nomination_reason || null,
        approval_status || 'pending',
        is_claimed ?? false,
        is_active ?? false,
        total_votes ?? 0,
        total_revenue ?? 0,
      ]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/nominees', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
