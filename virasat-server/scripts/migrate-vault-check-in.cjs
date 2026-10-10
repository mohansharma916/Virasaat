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
    await client.query(
      readFileSync(
        resolve(__dirname, '../migrations/20261010-vault-check-in.sql'),
        'utf8',
      ),
    );
    console.log(
      'Vault representation and check-in timestamp migration completed.',
    );
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
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
