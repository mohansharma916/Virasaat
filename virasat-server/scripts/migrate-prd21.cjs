const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Client } = require('pg');

require('dotenv').config({ path: resolve(__dirname, '../.env'), quiet: true });

async function main() {
  for (const key of ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE']) {
    if (!process.env[key]) throw new Error(`Missing ${key}`);
  }
  const sql = readFileSync(resolve(__dirname, '../migrations/20260925-prd21.sql'), 'utf8');
  const boundary = sql.indexOf('BEGIN;');
  if (boundary < 0) throw new Error('Migration transaction boundary is missing.');
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    lock_timeout: 5000,
  });
  try {
    await client.connect();
    // Separate queries are essential: a multi-statement query can put the enum
    // addition and its first use in the same transaction, causing PostgreSQL 55P04.
    await client.query(sql.slice(0, boundary));
    console.log('Recipient enum committed.');
    await client.query(sql.slice(boundary));
    console.log('PRD 2.1 schema migration completed; existing rows preserved.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Migration failed${error.code ? ` (${error.code})` : ''}: ${error.message}`);
  process.exitCode = 1;
});
