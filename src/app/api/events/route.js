import { NextResponse } from 'next/server';
import { query, buildSort, DATE_ALIASES } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';

const ALLOWED_FILTERS = ['id', 'slug', 'is_public', 'organizer_id', 'status', 'event_type'];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort');
    const limit = parseInt(searchParams.get('limit')) || 100;
    const idIn = searchParams.get('id_in');

    const conditions = [];
    const values = [];
    let idx = 1;

    if (idIn) {
      conditions.push(`id = ANY($${idx++})`);
      values.push(idIn.split(',').filter(Boolean));
    }

    for (const field of ALLOWED_FILTERS) {
      const raw = searchParams.get(field);
      if (raw === null) continue;
      let val = raw;
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      conditions.push(`${field} = $${idx++}`);
      values.push(val);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = buildSort(sort);

    const result = await query(
      `SELECT * ${DATE_ALIASES} FROM events ${where} ORDER BY ${orderBy} LIMIT ${limit}`,
      values
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('GET /api/events', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = await request.json();
    const {
      organizer_id, name, slug, description, event_type, region,
      physical_event_date, nomination_start, nomination_end,
      voting_start, voting_end, status, commission_rate,
      banner_url, logo_url, is_public, base_vote_price,
      total_revenue, total_votes,
    } = body;

    const result = await query(
      `INSERT INTO events (
        organizer_id, name, slug, description, event_type, region,
        physical_event_date, nomination_start, nomination_end,
        voting_start, voting_end, status, commission_rate,
        banner_url, logo_url, is_public, base_vote_price,
        total_revenue, total_votes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *, created_at AS created_date, updated_at AS updated_date`,
      [
        organizer_id || null, name, slug, description || null, event_type, region || null,
        physical_event_date || null, nomination_start || null, nomination_end || null,
        voting_start, voting_end,
        status || 'draft', commission_rate ?? 0.15,
        banner_url || null, logo_url || null,
        is_public ?? true, base_vote_price,
        total_revenue ?? 0, total_votes ?? 0,
      ]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/events', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
