import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { query } from "@/lib/db";
import { initializeTransaction } from "@/lib/paystack";

export async function POST(request) {
  try {
    const { nomineeId, votePackageId, voterEmail, voterName } = await request.json();

    if (!nomineeId || !votePackageId || !voterEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const nomineeResult = await query(
      `SELECT id, event_id, category_id, name FROM nominees WHERE id = $1`,
      [nomineeId]
    );
    const nominee = nomineeResult.rows[0];
    if (!nominee) {
      return NextResponse.json({ error: "Nominee not found" }, { status: 404 });
    }

    const packageResult = await query(
      `SELECT id, event_id, vote_count, amount FROM vote_packages WHERE id = $1`,
      [votePackageId]
    );
    const votePackage = packageResult.rows[0];
    if (!votePackage || votePackage.event_id !== nominee.event_id) {
      return NextResponse.json({ error: "Invalid vote package for this nominee" }, { status: 400 });
    }

    const reference = `EVG-${randomUUID()}`;

    await query(
      `INSERT INTO vote_transactions
        (reference, event_id, category_id, nominee_id, vote_package_id, voter_email, voter_name, vote_count, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')`,
      [
        reference,
        nominee.event_id,
        nominee.category_id,
        nominee.id,
        votePackage.id,
        voterEmail,
        voterName || null,
        votePackage.vote_count,
        votePackage.amount,
      ]
    );

    const amountInPesewas = Math.round(Number(votePackage.amount) * 100);
    const paystackData = await initializeTransaction({
      email: voterEmail,
      amountInPesewas,
      reference,
      metadata: {
        eventId: nominee.event_id,
        categoryId: nominee.category_id,
        nomineeId: nominee.id,
        votePackageId: votePackage.id,
        voteCount: votePackage.vote_count,
      },
    });

    return NextResponse.json({ authorizationUrl: paystackData.authorization_url, reference });
  } catch (error) {
    console.error("Initialize transaction error:", error);
    return NextResponse.json({ error: "Failed to start payment" }, { status: 500 });
  }
}