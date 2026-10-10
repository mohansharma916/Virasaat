const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Client } = require('pg');
require('dotenv').config({ path: resolve(__dirname, '../.env'), quiet: true });
async function main() {
  for (const key of [
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_DATABASE',
  ]) {
    if (!process.env[key]) throw new Error(`Missing ${key}`);
  }
  const sql = readFileSync(
    resolve(__dirname, '../migrations/20261010-auth-security.sql'),
    'utf8',
  );
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
    await client.query(sql);
    console.log(
      'Authentication security migration completed. Existing clients must sign in again.',
    );
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error(
    `Migration failed${error.code ? ` (${error.code})` : ''}: ${error.message}`,
  );
  process.exitCode = 1;
});
