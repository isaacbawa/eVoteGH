import { NextResponse } from 'next/server';
import { query, withTransaction, DATE_ALIASES } from '@/lib/db';

async function verifyPaystackTransaction(reference) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Payments are not configured on the server yet.');
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await res.json();

  if (!res.ok || !data.status) {
    throw new Error(data.message || 'Could not verify payment with Paystack');
  }
  return data.data; // { status, amount (in pesewas), currency, reference, ... }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      event_id, nominee_id, category_id, package_id,
      votes_cast, amount_ghs, voter_name, voter_email, voter_phone,
      gateway_reference,
    } = body;

    if (!event_id || !nominee_id || !category_id || !votes_cast || !amount_ghs || !gateway_reference) {
      return NextResponse.json({ error: 'Missing required vote fields' }, { status: 400 });
    }

    // Idempotency: if this Paystack reference was already recorded, return
    // the existing transaction instead of double-counting the vote.
    const existing = await query(
      `SELECT * ${DATE_ALIASES} FROM vote_transactions WHERE gateway_reference = $1`,
      [gateway_reference]
    );
    if (existing.rows[0]) {
      return NextResponse.json(existing.rows[0]);
    }

    // Verify the payment actually succeeded on Paystack's side before
    // writing anything — this is the key trust boundary the original
    // Base44 version skipped (it wrote straight from the client).
    const verified = await verifyPaystackTransaction(gateway_reference);

    if (verified.status !== 'success') {
      return NextResponse.json({ error: 'Payment was not successful' }, { status: 402 });
    }

    const expectedPesewas = Math.round(parseFloat(amount_ghs) * 100);
    if (Math.abs(verified.amount - expectedPesewas) > 1) {
      return NextResponse.json({ error: 'Payment amount does not match the selected package' }, { status: 402 });
    }

    const result = await withTransaction(async (client) => {
      const txRes = await client.query(
        `INSERT INTO vote_transactions (
          event_id, nominee_id, category_id, package_id, votes_cast, amount_ghs,
          gateway, gateway_reference, voter_name, voter_phone, voter_email,
          status, confirmed_at
        ) VALUES ($1,$2,$3,$4,$5,$6,'paystack',$7,$8,$9,$10,'confirmed',NOW())
        RETURNING *, created_at AS created_date, updated_at AS updated_date`,
        [
          event_id, nominee_id, category_id, package_id || null, votes_cast, amount_ghs,
          gateway_reference, voter_name || null, voter_phone || null, voter_email || null,
        ]
      );

      await client.query(
        `UPDATE nominees SET total_votes = total_votes + $1, total_revenue = total_revenue + $2, updated_at = NOW() WHERE id = $3`,
        [votes_cast, amount_ghs, nominee_id]
      );

      await client.query(
        `UPDATE events SET total_votes = total_votes + $1, total_revenue = total_revenue + $2, updated_at = NOW() WHERE id = $3`,
        [votes_cast, amount_ghs, event_id]
      );

      return txRes.rows[0];
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('POST /api/votes/confirm', err);
    return NextResponse.json({ error: err.message || 'Failed to confirm vote' }, { status: 500 });
  }
}
