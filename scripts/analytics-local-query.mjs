import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshotDirectory = resolve(projectRoot, '.local/analytics');
const args = process.argv.slice(2);

function readOption(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Expected a value after ${name}.`);
  return value;
}

const queryFile = resolve(projectRoot, readOption('--file', 'scripts/sql/analytics-report.sql'));
const source = readOption('--source', 'both');
const selectedSources = source === 'both' ? ['hakhoi', 'unopia'] : [source];
const validOptions = new Set(['--file', '--source']);

for (let index = 0; index < args.length; index += 1) {
  if (!validOptions.has(args[index])) throw new Error('Usage: pnpm run analytics:query -- [--file <query.sql>] [--source both|hakhoi|unopia]');
  index += 1;
}

if (!['both', 'hakhoi', 'unopia'].includes(source)) {
  throw new Error(`Unknown source "${source}". Choose both, hakhoi, or unopia.`);
}

let DatabaseSync;
try {
  ({ DatabaseSync } = await import('node:sqlite'));
} catch {
  throw new Error('The built-in node:sqlite module requires Node.js 22.13 or later. No SQLite installation is needed.');
}

const query = (await readFile(queryFile, 'utf8')).trim().replace(/;\s*$/, '');
if (!query) throw new Error(`Query file is empty: ${queryFile}`);

for (const name of selectedSources) {
  const snapshotFile = resolve(snapshotDirectory, `${name}.sql`);
  let snapshot;
  try {
    snapshot = await readFile(snapshotFile, 'utf8');
  } catch {
    throw new Error(`Missing ${name} snapshot. Run "pnpm run analytics:snapshot" first.`);
  }

  const database = new DatabaseSync(':memory:');
  try {
    database.exec(snapshot);
    database.exec('PRAGMA query_only = ON');
    const statement = database.prepare(query);
    const rows = statement.all();
    console.log(`\n${name.toUpperCase()} — ${rows.length} row(s)`);
    if (rows.length) console.table(rows);
    else console.log('(no rows)');
  } finally {
    database.close();
  }
}
