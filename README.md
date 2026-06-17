# eVoteGH — Next.js Edition

This is the full migration of your eVoteGH project off Base44, rebuilt entirely on **Next.js** (App Router, frontend + backend in one codebase), **Neon** (PostgreSQL) for the database, and **Clerk** for authentication and session management.

Every page, dashboard, and flow from the original app has been preserved and reconnected to the new stack. Two source files in the original Base44 export were found to be genuinely incomplete (cut off mid-file) — `OrganizerSection.jsx` and the event-creation wizard (`AdminEventCreate.jsx`). Both have been fully reconstructed based on their surrounding code, naming conventions, and the rest of the app's patterns, and are now complete and working.

## What changed

| | Before (Base44) | Now |
|---|---|---|
| Frontend | Vite + React Router (SPA) | Next.js App Router |
| Backend | Base44 managed backend | Next.js Route Handlers (`/src/app/api/*`) |
| Database | Base44 managed DB | Neon (PostgreSQL) — schema in `db/schema.sql` |
| Auth | Base44 built-in auth | Clerk (`@clerk/nextjs`) |
| File uploads | Base44 `UploadFile` | Cloudinary |
| Emails | Base44 `SendEmail` | Resend |
| Payments | Paystack (unchanged) | Paystack — now **server-verified** before votes are recorded |

The app's look, flows, routes, and behavior are otherwise unchanged — same pages, same dashboards, same voting/nomination/payout logic.

## One security improvement worth knowing about

In the original app, a successful Paystack payment on the client directly wrote the vote transaction and updated totals — nothing on the server checked that the payment had actually succeeded. That's been tightened: votes now go through `/api/votes/confirm`, which re-verifies the payment with Paystack's API before writing anything, and wraps the transaction + nominee/event total updates in a single atomic database transaction. The user experience is identical; this only closes a trust gap.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env.local` and fill in each value:

- **DATABASE_URL** — from your [Neon](https://neon.tech) project dashboard (use the pooled connection string).
- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** / **CLERK_SECRET_KEY** — from your [Clerk](https://clerk.com) dashboard (API Keys page).
- **CLERK_WEBHOOK_SECRET** — create a webhook in Clerk's dashboard pointing to `https://yourdomain.com/api/webhooks/clerk`, subscribed to the `user.created` event. Copy the signing secret it gives you.
- **CLOUDINARY_*** — from your [Cloudinary](https://cloudinary.com) dashboard (free tier is enough to start).
- **RESEND_API_KEY** / **RESEND_FROM_EMAIL** — from [Resend](https://resend.com). You'll need to verify a sending domain there before `RESEND_FROM_EMAIL` will deliver.
- **NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY** / **PAYSTACK_SECRET_KEY** — from your Paystack dashboard.

### 3. Create the database tables
```bash
npm run db:migrate
```
This runs `db/schema.sql` against your Neon database once. Safe to re-run (uses `CREATE TABLE IF NOT EXISTS`).

### 4. Create your first admin
Clerk has no concept of "admin" out of the box — every new sign-up gets `role: "user"` automatically (set by the `/api/webhooks/clerk` webhook). To make someone an admin:

1. Register a normal account for yourself first.
2. In the [Clerk dashboard](https://dashboard.clerk.com) → **Users** → select your user → **Metadata** → set **Public metadata** to:
   ```json
   { "role": "admin" }
   ```
3. Sign out and back in (or just refresh) — you'll now land on the Admin Dashboard.

From then on, you can invite organizers directly from the Admin Dashboard's event settings (Invite Panel) — no manual Clerk dashboard work needed for them.

### 5. Run locally
```bash
npm run dev
```
Visit `http://localhost:3000`.

### 6. Deploy
This is a standard Next.js app — deploy it anywhere that runs Next.js (Vercel, Railway, Render, your own Node server, etc.). Make sure all the environment variables above are set in your hosting provider, and that `NEXT_PUBLIC_APP_URL` matches your real production URL (used for invite/redirect links).

## Project structure

```
src/
  app/
    (public)/            → Home, Events, Event page, Nominate page, How It Works
    dashboard/            → Admin + user dashboards (Clerk-protected via middleware.js)
    login, register/      → Clerk's SignIn/SignUp components
    api/                  → All backend routes (Neon-backed)
  components/             → UI components, dashboard widgets, layout
  lib/
    db.js                 → Postgres query helpers (Neon)
    api-client.js          → Client-side fetch wrapper (`db.entities.X...`) that every
                             page calls — this is what made porting ~30 pages painless;
                             only this one file needed to know about the new backend.
    auth-helpers.js         → Server-side Clerk auth guards for API routes
db/
  schema.sql              → Full Postgres schema — run once via `npm run db:migrate`
```

## Notes on a few things intentionally left out

A handful of files in the original export were dead code — never imported or routed anywhere (`AdminGuard.jsx`, `ScrollToTop.jsx`, `UserNotRegisteredError.jsx`, `LiveVoteCount.jsx`, the orphaned `OrganizerPayouts.jsx` and `NomineeShare.jsx` pages, and a custom `ProtectedRoute.jsx` superseded by Clerk + Next.js middleware). These were not ported since they had zero effect on the running app, but if anything in there looks important to you, let me know and I'll wire it in.
