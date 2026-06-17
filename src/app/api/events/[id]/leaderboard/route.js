import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEventRole } from "@/lib/auth-helpers";

export async function GET(request, { params }) {
  const eventId = params.id;

  const access = await getEventRole(eventId);
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await query(
    `SELECT c.id AS category_id, c.name AS category_name,
            n.id AS nominee_id, n.name AS nominee_name, n.vote_count
     FROM categories c
     JOIN nominees n ON n.category_id = c.id
     WHERE c.event_id = $1
     ORDER BY c.name ASC, n.vote_count DESC`,
    [eventId]
  );

  const leaderboard = [];
  const categoryMap = new Map();

  for (const row of result.rows) {
    if (!categoryMap.has(row.category_id)) {
      const entry = { categoryId: row.category_id, categoryName: row.category_name, nominees: [] };
      categoryMap.set(row.category_id, entry);
      leaderboard.push(entry);
    }
    categoryMap.get(row.category_id).nominees.push({
      nomineeId: row.nominee_id,
      name: row.nominee_name,
      voteCount: row.vote_count,
      isYou: access.role === "nominee" && access.nomineeId === row.nominee_id,
    });
  }

  return NextResponse.json({ leaderboard, viewerRole: access.role });
}