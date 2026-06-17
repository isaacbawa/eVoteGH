import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Returns the current Clerk userId, or null if not signed in.
 * Route handlers read the session straight from request cookies —
 * no manual token parsing needed (clerkMiddleware already attached it).
 */
export async function getUserId() {
  const { userId } = await auth();
  return userId || null;
}

/**
 * Returns true if the current user's publicMetadata.role === 'admin'.
 */
export async function isAdmin(userId) {
  if (!userId) return false;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.publicMetadata?.role === 'admin';
  } catch {
    return false;
  }
}

/** Returns a 401 JSON response. */
export function unauthorized() {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}

/** Returns a 403 JSON response. */
export function forbidden() {
  return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
}

/**
 * Guard helper for route handlers: ensures the caller is signed in.
 * Returns { userId } on success, or a NextResponse to return immediately.
 */
export async function requireAuth() {
  const userId = await getUserId();
  if (!userId) return { error: unauthorized() };
  return { userId };
}

/**
 * Guard helper for route handlers: ensures the caller is a signed-in admin.
 * Returns { userId } on success, or a NextResponse to return immediately.
 */
export async function requireAdmin() {
  const userId = await getUserId();
  if (!userId) return { error: unauthorized() };
  const admin = await isAdmin(userId);
  if (!admin) return { error: forbidden() };
  return { userId };
}
