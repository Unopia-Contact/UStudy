import { mkdir, readFile, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wranglerEntrypoint = resolve(projectRoot, 'node_modules/wrangler/bin/wrangler.js');
const snapshotDirectory = resolve(projectRoot, '.local/analytics');
const wranglerConfig = JSON.parse(await readFile(resolve(projectRoot, 'wrangler.jsonc'), 'utf8'));
const databases = [
  {
    name: 'hakhoi',
    accountId: wranglerConfig.account_id,
    environment: null,
  },
  {
    name: 'unopia',
    accountId: wranglerConfig.env.unopia.account_id,
    environment: 'unopia',
  },
];

await mkdir(snapshotDirectory, { recursive: true });

for (const database of databases) {
  const destination = resolve(snapshotDirectory, `${database.name}.sql`);
  const temporaryDestination = resolve(snapshotDirectory, `.${database.name}.sql.tmp`);
  const args = [
    wranglerEntrypoint,
    'd1',
    'export',
    'ustudy-analytics',
    '--remote',
    '--skip-confirmation',
    '--output',
    temporaryDestination,
  ];

  if (database.environment) args.push('--env', database.environment);

  console.log(`Exporting ${database.name} snapshot...`);
  const result = spawnSync(process.execPath, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: database.accountId },
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Wrangler export failed for ${database.name} (exit ${result.status}).`);
  }

  await rename(temporaryDestination, destination);
  console.log(`Saved ${database.name} snapshot to ${destination}`);
}

console.log('Both local snapshots are ready. Refresh them by running this command again.');
