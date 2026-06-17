import { NextResponse } from 'next/server';
import { query, buildSort, DATE_ALIASES } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth-helpers';

export async function GET(request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      event_id: searchParams.get('event_id'),
      nominee_id: searchParams.get('nominee_id'),
      category_id: searchParams.get('category_id'),
      status: searchParams.get('status'),
    };
    const sort = searchParams.get('sort');
    const limit = parseInt(searchParams.get('limit')) || 100;

    const conditions = [];
    const values = [];
    let idx = 1;
    for (const [field, val] of Object.entries(filters)) {
      if (val === null) continue;
      conditions.push(`${field} = $${idx++}`);
      values.push(val);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = buildSort(sort);

    const result = await query(
      `SELECT * ${DATE_ALIASES} FROM vote_transactions ${where} ORDER BY ${orderBy} LIMIT ${limit}`,
      values
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Direct creation is admin-only (e.g. manual reconciliation). Normal votes
// are recorded exclusively through the server-verified /api/votes/confirm
// flow, which validates the Paystack payment before writing anything.
export async function POST(request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = await request.json();
    const {
      event_id, nominee_id, category_id, package_id, votes_cast, amount_ghs,
      gateway, gateway_reference, voter_name, voter_phone, voter_email, status,
    } = body;

    const result = await query(
      `INSERT INTO vote_transactions (
        event_id, nominee_id, category_id, package_id, votes_cast, amount_ghs,
        gateway, gateway_reference, voter_name, voter_phone, voter_email, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *, created_at AS created_date, updated_at AS updated_date`,
      [
        event_id, nominee_id, category_id, package_id || null, votes_cast, amount_ghs,
        gateway || 'paystack', gateway_reference || null,
        voter_name || null, voter_phone || null, voter_email || null,
        status || 'pending',
      ]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/vote-transactions', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
