import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

type SqliteRow = Record<string, string | number | bigint | null>;
type SqliteStatement = {
  all(): SqliteRow[];
  columns(): Array<{ name: string }>;
  iterate(): Iterable<SqliteRow>;
};
type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
};

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (location: string) => SqliteDatabase;
};

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshotDirectory = resolve(projectRoot, '.local/analytics');
const sources = ['hakhoi', 'unopia'] as const;
const tables = ['anonymous_installations', 'installation_activity_days'] as const;
const maxBodyBytes = 24_000;
const maxRows = 500;

type Source = typeof sources[number];

function snapshotPath(source: Source) {
  return resolve(snapshotDirectory, `${source}.sql`);
}

async function withSnapshot<T>(source: Source, callback: (database: SqliteDatabase) => T): Promise<T> {
  const sql = await readFile(snapshotPath(source), 'utf8');
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(sql);
    database.exec('PRAGMA query_only = ON');
    return callback(database);
  } finally {
    database.close();
  }
}

function sendJson(response: ServerResponse, status: number, payload: unknown) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.end(JSON.stringify(payload));
}

function isLocalRequest(request: IncomingMessage): boolean {
  const address = request.socket.remoteAddress;
  const host = request.headers.host ?? request.headers[':authority'];
  if (!address || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address) || !host) return false;
  try {
    return ['localhost', '127.0.0.1'].includes(new URL(`http://${host}`).hostname);
  } catch {
    return false;
  }
}

function hasSameOrigin(request: IncomingMessage): boolean {
  const origin = request.headers.origin;
  const host = request.headers.host ?? request.headers[':authority'];
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  if (!request.headers['content-type']?.startsWith('application/json')) throw new Error('Yêu cầu phải là JSON.');
  let body = '';
  for await (const chunk of request) {
    body += chunk.toString();
    if (Buffer.byteLength(body, 'utf8') > maxBodyBytes) throw new Error('Câu SQL quá dài.');
  }
  return JSON.parse(body) as unknown;
}

function isSelectQuery(sql: string): boolean {
  let remaining = sql.trim();
  while (remaining.startsWith('--') || remaining.startsWith('/*')) {
    if (remaining.startsWith('--')) {
      const newline = remaining.indexOf('\n');
      if (newline < 0) return false;
      remaining = remaining.slice(newline + 1).trimStart();
    } else {
      const end = remaining.indexOf('*/');
      if (end < 0) return false;
      remaining = remaining.slice(end + 2).trimStart();
    }
  }
  return /^(SELECT|WITH)\b/i.test(remaining);
}

async function getMetadata() {
  const snapshots = await Promise.all(sources.map(async (source) => {
    try {
      const file = await stat(snapshotPath(source));
      const schema = await withSnapshot(source, (database) => tables.map((table) => ({
        name: table,
        columns: database.prepare(`PRAGMA table_info(${table})`).all().map((column) => ({
          name: String(column.name),
          type: String(column.type || 'TEXT'),
          required: Boolean(column.notnull),
          primaryKey: Boolean(column.pk),
        })),
        foreignKeys: database.prepare(`PRAGMA foreign_key_list(${table})`).all().map((key) => ({
          from: String(key.from),
          to: String(key.to),
          table: String(key.table),
        })),
      })));
      return { source, available: true, updatedAt: file.mtime.toISOString(), bytes: file.size, schema };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { source, available: false, updatedAt: null, bytes: 0, schema: [] };
      }
      throw error;
    }
  }));
  return { snapshots };
}

async function executeQuery(body: unknown) {
  if (!body || typeof body !== 'object') throw new Error('Thiếu câu SQL.');
  const { sql, source } = body as { sql?: unknown; source?: unknown };
  if (typeof sql !== 'string' || !sql.trim()) throw new Error('Nhập câu SQL trước khi chạy.');
  if (Buffer.byteLength(sql, 'utf8') > maxBodyBytes) throw new Error('Câu SQL quá dài.');
  if (!isSelectQuery(sql)) throw new Error('Chỉ hỗ trợ truy vấn SELECT hoặc WITH đọc dữ liệu.');
  if (source !== 'both' && !sources.includes(source as Source)) throw new Error('Nguồn dữ liệu không hợp lệ.');

  const selected = source === 'both' ? sources : [source as Source];
  const results = [];
  for (const current of selected) {
    let result;
    try {
      result = await withSnapshot(current, (database) => {
        const startedAt = performance.now();
        const statement = database.prepare(sql);
        const columns = statement.columns().map((column) => column.name);
        const rows: SqliteRow[] = [];
        for (const row of statement.iterate()) {
          rows.push(row);
          if (rows.length > maxRows) break;
        }
        const truncated = rows.length > maxRows;
        if (truncated) rows.pop();
        return { source: current, columns, rows, truncated, elapsedMs: Math.round(performance.now() - startedAt) };
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Chưa có snapshot ${current}. Chạy pnpm run analytics:snapshot trước.`);
      }
      throw error;
    }
    results.push(result);
  }
  return { results };
}

export function createAnalyticsWorkspaceMiddleware() {
  return async (request: IncomingMessage, response: ServerResponse) => {
    if (!isLocalRequest(request) || (request.method === 'POST' && !hasSameOrigin(request))) {
      sendJson(response, 403, { error: 'Chỉ truy cập từ trình duyệt trên máy này.' });
      return;
    }

    try {
      const path = new URL(request.url || '/', 'http://localhost').pathname;
      if (request.method === 'GET' && (path === '/' || path === '/meta')) {
        sendJson(response, 200, await getMetadata());
        return;
      }
      if (request.method === 'POST' && path === '/query') {
        sendJson(response, 200, await executeQuery(await readJsonBody(request)));
        return;
      }
      sendJson(response, 404, { error: 'Đường dẫn không tồn tại.' });
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : 'Không thể chạy truy vấn.' });
    }
  };
}
