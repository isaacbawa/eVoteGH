import { NextResponse } from 'next/server';
import { query, buildSort, DATE_ALIASES } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const sort = searchParams.get('sort');
    const limit = parseInt(searchParams.get('limit')) || 100;

    const conditions = [];
    const values = [];
    let idx = 1;
    if (entityType) { conditions.push(`entity_type = $${idx++}`); values.push(entityType); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = buildSort(sort);

    const result = await query(
      `SELECT * ${DATE_ALIASES} FROM audit_logs ${where} ORDER BY ${orderBy} LIMIT ${limit}`,
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
    const { action, entity_type, entity_id, details } = await request.json();
    const result = await query(
      `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id, details)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *, created_at AS created_date`,
      [guard.userId, action, entity_type, entity_id || null, details || null]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/audit-logs', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
