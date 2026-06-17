// Run once to create all tables in your Neon database:
//   node scripts/migrate.mjs
// Reads DATABASE_URL from .env.local automatically.

import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Pool } from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Copy .env.example to .env.local and fill it in.');
    process.exit(1);
  }

  const sql = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Running schema.sql against Neon...');
  try {
    await pool.query(sql);
    console.log('✅ Database schema created successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
