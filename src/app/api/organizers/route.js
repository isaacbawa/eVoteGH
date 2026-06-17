import { NextResponse } from 'next/server';
import { query, buildSort, DATE_ALIASES } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth-helpers';

// Organizer records hold bank/MoMo disbursement details, so reads require
// a signed-in user (every place this is called from is already inside
// /dashboard, which Clerk middleware already protects).
export async function GET(request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      user_id: searchParams.get('user_id'),
      email: searchParams.get('email'),
      id: searchParams.get('id'),
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
      `SELECT * ${DATE_ALIASES} FROM organizers ${where} ORDER BY ${orderBy} LIMIT ${limit}`,
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
    const body = await request.json();
    const {
      user_id, event_ids, organization_name, contact_name, phone, email,
      disbursement_method, momo_network, momo_number,
      bank_name, bank_account_number, bank_account_name,
      invite_status, is_active,
    } = body;

    const result = await query(
      `INSERT INTO organizers (
        user_id, event_ids, organization_name, contact_name, phone, email,
        disbursement_method, momo_network, momo_number,
        bank_name, bank_account_number, bank_account_name,
        invite_status, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *, created_at AS created_date, updated_at AS updated_date`,
      [
        user_id || null, event_ids || [], organization_name, contact_name, phone, email || null,
        disbursement_method || null, momo_network || null, momo_number || null,
        bank_name || null, bank_account_number || null, bank_account_name || null,
        invite_status || 'pending', is_active ?? true,
      ]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/organizers', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
