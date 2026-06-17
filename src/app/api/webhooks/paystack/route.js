import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paystack";

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const { reference } = event.data;

    const existing = await query(
      `SELECT status FROM vote_transactions WHERE reference = $1`,
      [reference]
    );

    if (!existing.rows[0]) {
      console.error(`Paystack webhook for unknown reference: ${reference}`);
      return NextResponse.json({ received: true });
    }

    if (existing.rows[0].status === "success") {
      return NextResponse.json({ received: true }); // already processed, webhook retry
    }

    await query(
      `UPDATE vote_transactions SET status = 'success', updated_at = now() WHERE reference = $1`,
      [reference]
    );

    await query(
      `UPDATE nominees SET vote_count = vote_count + (
         SELECT vote_count FROM vote_transactions WHERE reference = $1
       ) WHERE id = (SELECT nominee_id FROM vote_transactions WHERE reference = $1)`,
      [reference]
    );
  }

  return NextResponse.json({ received: true });
}


// aystack dashboard → Settings → API Keys & Webhooks → set the webhook URL to https://yourapp.com/api/webhooks/paystack