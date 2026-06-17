import { Pool } from 'pg';

// Next.js Route Handlers run on the Node.js runtime by default, so the
// standard 'pg' driver (over Neon's pooled connection string) is simpler
// and more reliable here than the edge/websocket-based serverless driver.
let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

/** Run a parameterised SQL query against Neon. */
export async function query(text, params = []) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

/**
 * Run a callback inside a single transaction. The callback receives a
 * client with the same .query(text, params) signature; all statements
 * run on the same connection so BEGIN/COMMIT/ROLLBACK wrap correctly.
 */
export async function withTransaction(callback) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Build an ORDER BY clause from a Base44-style sort string.
 * '-created_date' → 'created_at DESC'   |   'display_order' → 'display_order ASC'
 */
export function buildSort(sortParam, defaultSort = 'created_at DESC') {
  if (!sortParam) return defaultSort;
  const desc = sortParam.startsWith('-');
  const field = desc ? sortParam.slice(1) : sortParam;
  const fieldMap = { created_date: 'created_at', updated_date: 'updated_at' };
  const sqlField = fieldMap[field] || field;
  // Whitelist to prevent SQL injection via sort param
  if (!/^[a-zA-Z_]+$/.test(sqlField)) return defaultSort;
  return `${sqlField} ${desc ? 'DESC' : 'ASC'}`;
}

/** Adds created_date / updated_date aliases so frontend code (originally
 * written against Base44's field names) keeps working unchanged. */
export const DATE_ALIASES = ', created_at AS created_date, updated_at AS updated_date';
