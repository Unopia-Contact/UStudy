import { parentPort, workerData } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const MAX_ROWS = 500;
const MAX_CELL_CHARS = 20_000;
const sourceNames = ['hakhoi', 'unopia'];
const tables = [
  { name: 'anonymous_installations', key: ['installation_hash'] },
  { name: 'installation_activity_days', key: ['installation_hash', 'active_day'] },
];

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function columnType(value) {
  return /^(TEXT|INTEGER|REAL|BLOB|NUMERIC)(?:\([0-9, ]+\))?$/i.test(value) ? value : 'TEXT';
}

function safeValue(value) {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Uint8Array) return `[BLOB: ${value.byteLength} bytes]`;
  const text = String(value);
  return text.length > MAX_CELL_CHARS ? `${text.slice(0, MAX_CELL_CHARS)}… [đã cắt ngắn]` : text;
}

async function main() {
  const { snapshotDirectory, source, sql } = workerData;
  const database = new DatabaseSync(':memory:');
  const inputs = [];
  try {
    for (const current of source === 'both' ? sourceNames : [source]) {
      let snapshot;
      try {
        snapshot = await readFile(resolve(snapshotDirectory, `${current}.sql`), 'utf8');
      } catch (error) {
        if (error?.code === 'ENOENT') throw new Error(`Chưa có snapshot ${current}. Chạy pnpm run analytics:snapshot trước.`);
        throw error;
      }
      const input = new DatabaseSync(':memory:');
      inputs.push({ source: current, database: input });
      input.exec(snapshot);
    }
    for (const table of tables) {
      const columns = new Map();
      for (const input of inputs) {
        for (const column of input.database.prepare(`PRAGMA table_info(${quoteIdentifier(table.name)})`).all()) {
          if (column.name !== 'source' && !columns.has(column.name)) columns.set(column.name, columnType(column.type || 'TEXT'));
        }
      }
      for (const key of table.key) {
        if (!columns.has(key)) throw new Error(`Snapshot thiếu cột ${table.name}.${key}.`);
      }
      const fields = [...columns].map(([name, type]) => `${quoteIdentifier(name)} ${type}`);
      const primaryKey = ['source', ...table.key].map(quoteIdentifier).join(', ');
      const foreignKey = table.name === 'installation_activity_days'
        ? ', FOREIGN KEY (source, installation_hash) REFERENCES anonymous_installations(source, installation_hash)'
        : '';
      database.exec(`CREATE TABLE ${quoteIdentifier(table.name)} (source TEXT NOT NULL, ${fields.join(', ')}, PRIMARY KEY (${primaryKey})${foreignKey})`);
      table.columns = [...columns.keys()];
    }
    database.exec('BEGIN');
    for (const table of tables) {
      const names = ['source', ...table.columns];
      const insert = database.prepare(`INSERT INTO ${quoteIdentifier(table.name)} (${names.map(quoteIdentifier).join(', ')}) VALUES (${names.map(() => '?').join(', ')})`);
      for (const input of inputs) {
        for (const row of input.database.prepare(`SELECT * FROM ${quoteIdentifier(table.name)}`).iterate()) {
          insert.run(input.source, ...table.columns.map((column) => row[column] ?? null));
        }
      }
    }
    database.exec('COMMIT');
    database.exec('PRAGMA query_only = ON');
    const startedAt = performance.now();
    const statement = database.prepare(sql);
    const columns = statement.columns().map((column) => column.name);
    const rows = [];
    for (const rawRow of statement.iterate()) {
      rows.push(Object.fromEntries(Object.entries(rawRow).map(([key, value]) => [key, safeValue(value)])));
      if (rows.length > MAX_ROWS) break;
    }
    const truncated = rows.length > MAX_ROWS;
    if (truncated) rows.pop();
    parentPort.postMessage({ source, columns, rows, truncated, elapsedMs: Math.round(performance.now() - startedAt) });
  } finally {
    for (const input of inputs) input.database.close();
    database.close();
  }
}

main().catch((error) => parentPort.postMessage({
  source: workerData.source,
  error: error instanceof Error ? error.message : 'Không thể chạy truy vấn.',
}));
