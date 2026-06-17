import { NextResponse } from 'next/server';
import { query, buildSort, DATE_ALIASES } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const { searchParams } = new URL(request.url);
    const organizerId = searchParams.get('organizer_id');
    const eventId = searchParams.get('event_id');
    const sort = searchParams.get('sort');
    const limit = parseInt(searchParams.get('limit')) || 100;

    const conditions = [];
    const values = [];
    let idx = 1;
    if (organizerId) { conditions.push(`organizer_id = $${idx++}`); values.push(organizerId); }
    if (eventId)     { conditions.push(`event_id = $${idx++}`);     values.push(eventId); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = buildSort(sort);

    const result = await query(
      `SELECT * ${DATE_ALIASES} FROM payouts ${where} ORDER BY ${orderBy} LIMIT ${limit}`,
      values
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Organizers request payouts for their own events (see OrganizerSection.jsx).
// Any signed-in user may call this — matches the original app's behaviour,
// where payout requests were not server-verified against event ownership.
export async function POST(request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await request.json();
    const {
      event_id, organizer_id, gross_revenue, commission_amount,
      commission_rate, net_payout, disbursement_method, status,
    } = body;

    const result = await query(
      `INSERT INTO payouts (
        event_id, organizer_id, gross_revenue, commission_amount,
        commission_rate, net_payout, disbursement_method, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *, created_at AS created_date, updated_at AS updated_date`,
      [
        event_id, organizer_id, gross_revenue, commission_amount,
        commission_rate, net_payout, disbursement_method || null, status || 'pending',
      ]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/payouts', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
