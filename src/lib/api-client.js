'use client';

/**
 * Drop-in replacement for the old `globalThis.__B44_DB__` / Base44 SDK client.
 * Every page in this app was written against `db.entities.X.list/filter/get/
 * create/update/delete(...)`, so this shim keeps that exact surface area but
 * routes everything to our own Next.js API routes (Neon-backed).
 *
 * Because our Next.js API routes read the Clerk session straight from the
 * request cookies (via `auth()` in each route handler), plain same-origin
 * `fetch()` calls already carry the right credentials — no manual token
 * handling needed here.
 */

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'same-origin',
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

function buildQuery(filters = {}, sort, limit) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  if (sort) params.set('sort', sort);
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function makeEntityClient(resource) {
  const base = `/api/${resource}`;
  return {
    list: (sort, limit) => apiFetch(`${base}${buildQuery({}, sort, limit)}`),
    filter: (filters = {}, sort, limit) => apiFetch(`${base}${buildQuery(filters, sort, limit)}`),
    get: (id) => apiFetch(`${base}/${id}`),
    create: (payload) => apiFetch(base, { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => apiFetch(`${base}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    delete: (id) => apiFetch(`${base}/${id}`, { method: 'DELETE' }),
  };
}

// Users are managed by Clerk, not our own table — special-cased to proxy
// to Clerk's admin API via our own /api/admin/users route.
const UserEntityClient = {
  filter: (filters = {}) => apiFetch(`/api/admin/users${buildQuery(filters)}`),
  update: (id, payload) => apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
};

export const db = {
  entities: {
    Event: makeEntityClient('events'),
    Category: makeEntityClient('categories'),
    Nominee: makeEntityClient('nominees'),
    Organizer: makeEntityClient('organizers'),
    VotePackage: makeEntityClient('vote-packages'),
    VoteTransaction: makeEntityClient('vote-transactions'),
    Payout: makeEntityClient('payouts'),
    AuditLog: makeEntityClient('audit-logs'),
    User: UserEntityClient,
  },
  // Server-verified vote recording: verifies the Paystack reference, then
  // atomically writes the transaction + updates nominee/event totals.
  // (Base44 version wrote these 3 records straight from the client; we
  // moved that logic server-side for correctness and to close a trust gap,
  // without changing the calling convention components use.)
  votes: {
    confirm: (payload) => apiFetch('/api/votes/confirm', { method: 'POST', body: JSON.stringify(payload) }),
  },
  integrations: {
    Core: {
      // Replaces Base44's UploadFile — uploads to Cloudinary via our API route.
      UploadFile: async ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'same-origin' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Upload failed');
        return data; // { file_url }
      },
      // Replaces Base44's SendEmail — sends via Resend through our API route.
      SendEmail: (payload) => apiFetch('/api/email', { method: 'POST', body: JSON.stringify(payload) }),
    },
  },
  // Replaces Base44's db.users.inviteUser(email, role) — creates a Clerk invitation.
  users: {
    inviteUser: (email, role) =>
      apiFetch('/api/admin/invite', { method: 'POST', body: JSON.stringify({ email, role }) }),
  },
};

export default db;
