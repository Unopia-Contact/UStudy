import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, CircleAlert, Clock3, Code2, Database, Lightbulb, Play, RefreshCw, Table2 } from 'lucide-react';
import { AppSelect } from '../../../components/ui/form/app-select';
import '../workspace-analytics.css';

type Source = 'both' | 'hakhoi' | 'unopia';
type Column = { name: string; type: string; required: boolean; primaryKey: boolean };
type Table = { name: string; columns: Column[]; foreignKeys: Array<{ from: string; to: string; table: string }> };
type Snapshot = { source: Exclude<Source, 'both'>; available: boolean; updatedAt: string | null; bytes: number; schema: Table[] };
type QueryRow = Record<string, string | number | null>;
type QueryResult = { source: Exclude<Source, 'both'>; columns: string[]; rows: QueryRow[]; truncated: boolean; elapsedMs: number };
type Completion = { label: string; kind: 'table' | 'column' | 'keyword'; detail?: string };

const draftKey = 'ustudy_workspace_analytics_sql_draft_v1';
const defaultSql = `SELECT
  origin,
  COUNT(*) AS total_installations,
  SUM(deleted_day IS NULL) AS active_installations,
  SUM(deleted_day IS NOT NULL) AS deactivated_installations
FROM anonymous_installations
GROUP BY origin;`;

const examples = [
  {
    name: 'Tổng quan',
    description: 'Tổng số installation và trạng thái',
    sql: defaultSql,
  },
  {
    name: 'DAU theo ngày',
    description: 'Số installation hoạt động mỗi ngày',
    sql: `SELECT
  a.active_day,
  COUNT(*) AS dau,
  SUM(i.first_seen_day = a.active_day) AS new_installations,
  SUM(i.first_seen_day < a.active_day) AS returning_installations
FROM installation_activity_days AS a
JOIN anonymous_installations AS i
  ON i.installation_hash = a.installation_hash
GROUP BY a.active_day
ORDER BY a.active_day DESC;`,
  },
  {
    name: 'Phiên bản',
    description: 'Phân bố installation theo app version',
    sql: `SELECT
  app_version,
  COUNT(*) AS installations
FROM anonymous_installations
WHERE deleted_day IS NULL
GROUP BY app_version
ORDER BY installations DESC;`,
  },
  {
    name: 'Quay lại',
    description: 'Số installation có ít nhất hai ngày hoạt động',
    sql: `SELECT
  COUNT(*) AS returning_installations
FROM (
  SELECT installation_hash
  FROM installation_activity_days
  GROUP BY installation_hash
  HAVING COUNT(*) >= 2
);`,
  },
  {
    name: 'Retention D1',
    description: 'Tỉ lệ quay lại ngày hôm sau theo cohort',
    sql: `SELECT
  i.first_seen_day AS cohort_day,
  COUNT(*) AS cohort_size,
  SUM(a.installation_hash IS NOT NULL) AS returned_d1,
  ROUND(100.0 * SUM(a.installation_hash IS NOT NULL) / COUNT(*), 1) AS retention_d1_percent
FROM anonymous_installations AS i
LEFT JOIN installation_activity_days AS a
  ON a.installation_hash = i.installation_hash
  AND a.active_day = DATE(i.first_seen_day, '+1 day')
WHERE i.first_seen_day < DATE('now', '+7 hours')
GROUP BY i.first_seen_day
ORDER BY i.first_seen_day DESC;`,
  },
];

const keywords = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'ON', 'GROUP BY', 'ORDER BY',
  'HAVING', 'LIMIT', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'MIN', 'MAX', 'ROUND',
  'DATE', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IS NULL', 'IS NOT NULL',
  'AND', 'OR', 'IN', 'BETWEEN', 'DESC', 'ASC', 'WITH',
];

const columnHelp: Record<string, string> = {
  installation_hash: 'Hash của ID ngẫu nhiên; khóa nối hai bảng, không phải mã sinh viên.',
  origin: 'Domain nơi installation sử dụng UStudy.',
  first_seen_day: 'Ngày đầu tiên xuất hiện trong thống kê.',
  last_seen_day: 'Ngày gửi heartbeat gần nhất.',
  app_version: 'Phiên bản UStudy ghi nhận gần nhất.',
  client_kind: 'Loại client được ghi nhận.',
  deleted_day: 'Ngày tắt/xóa ID thống kê; NULL nghĩa là còn hoạt động.',
  active_day: 'Ngày có heartbeat của installation.',
};

const sourceOptions = [
  { id: 'both', name: 'Cả hai snapshot' },
  { id: 'hakhoi', name: 'Hakhoi' },
  { id: 'unopia', name: 'Unopia' },
];

function displayValue(value: QueryRow[string]): string {
  return value === null ? 'NULL' : String(value);
}

function readDraft(): string {
  try {
    return sessionStorage.getItem(draftKey) || defaultSql;
  } catch {
    return defaultSql;
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  let payload: { error?: string } & Partial<T>;
  try {
    payload = await response.json() as typeof payload;
  } catch {
    throw new Error('Chỉ dùng được trên UStudy đang chạy bằng pnpm dev ở máy này.');
  }
  if (!response.ok) throw new Error(payload.error || 'Không thể đọc snapshot local.');
  return payload as T;
}

function sourceLabel(source: Source) {
  return source === 'hakhoi' ? 'Hakhoi' : source === 'unopia' ? 'Unopia' : 'Cả hai';
}

function ResultTable({ result }: { result: QueryResult }) {
  return (
    <section className="workspace-analytics-result" aria-label={`Kết quả ${sourceLabel(result.source)}`}>
      <div className="workspace-analytics-result-heading">
        <div className="flex min-w-0 items-center gap-2">
          <Table2 className="h-4 w-4 shrink-0 text-[#004A98]" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-gray-900">{sourceLabel(result.source)}</h3>
          <span className="text-xs text-gray-500">{result.rows.length}{result.truncated ? '+' : ''} dòng</span>
        </div>
        <span className="text-xs tabular-nums text-gray-500">{result.elapsedMs} ms</span>
      </div>
      {result.rows.length > 0 ? (
        <div className="workspace-analytics-table-scroll">
          <table className="workspace-analytics-table">
            <thead>
              <tr>{result.columns.map((column, index) => <th key={`${column}-${index}`} scope="col">{column}</th>)}</tr>
            </thead>
            <tbody>
              {result.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {result.columns.map((column, index) => (
                    <td key={`${column}-${index}`} title={displayValue(row[column])}>{displayValue(row[column])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="px-4 py-6 text-center text-sm text-gray-500">Truy vấn chạy thành công nhưng không có dòng dữ liệu.</p>}
      {result.truncated && <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-900">Đang hiện 500 dòng đầu. Thêm LIMIT hoặc điều kiện WHERE để xem phần cần tìm.</p>}
    </section>
  );
}

export function WorkspaceAnalyticsFeature() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [source, setSource] = useState<Source>('both');
  const [sql, setSql] = useState(readDraft);
  const [cursor, setCursor] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [results, setResults] = useState<QueryResult[] | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [queryLoading, setQueryLoading] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const loadMetadata = useCallback(async () => {
    setMetadataLoading(true);
    setMetadataError(null);
    try {
      const response = await fetch('/api/workspace/analytics/meta', { cache: 'no-store', credentials: 'same-origin' });
      const data = await readResponse<{ snapshots: Snapshot[] }>(response);
      setSnapshots(data.snapshots);
    } catch (error) {
      setMetadataError(error instanceof Error ? error.message : 'Không thể đọc snapshot.');
    } finally {
      setMetadataLoading(false);
    }
  }, []);

  useEffect(() => { void loadMetadata(); }, [loadMetadata]);
  useEffect(() => {
    try { sessionStorage.setItem(draftKey, sql); } catch { /* storage may be unavailable */ }
  }, [sql]);

  const selectedSnapshot = snapshots.find((snapshot) => snapshot.source === (source === 'both' ? 'hakhoi' : source) && snapshot.available)
    ?? snapshots.find((snapshot) => snapshot.available);
  const schema = selectedSnapshot?.schema ?? [];
  const ready = source === 'both'
    ? snapshots.length === 2 && snapshots.every((snapshot) => snapshot.available)
    : snapshots.some((snapshot) => snapshot.source === source && snapshot.available);

  const completions = useMemo(() => {
    if (!showSuggestions) return [];
    const beforeCursor = sql.slice(0, cursor);
    const token = beforeCursor.match(/[A-Za-z_][A-Za-z0-9_]*$/)?.[0] ?? '';
    const afterDot = /\.[A-Za-z_0-9]*$/.test(beforeCursor);
    const items: Completion[] = [
      ...schema.map((table) => ({ label: table.name, kind: 'table' as const })),
      ...schema.flatMap((table) => table.columns.map((column) => ({ label: column.name, kind: 'column' as const, detail: table.name }))),
      ...keywords.map((keyword) => ({ label: keyword, kind: 'keyword' as const })),
    ];
    if (token.length < 2) return [];
    const matching = items.filter((item) => (!afterDot || item.kind === 'column') && item.label.toLowerCase().startsWith(token.toLowerCase()));
    const unique = new Set<string>();
    return matching.filter((item) => {
      if (unique.has(item.label)) return false;
      unique.add(item.label);
      return true;
    }).slice(0, 8);
  }, [cursor, schema, showSuggestions, sql]);

  const insertText = useCallback((text: string, replaceToken = false) => {
    const editor = editorRef.current;
    if (!editor) return;
    const start = replaceToken
      ? editor.selectionStart - (sql.slice(0, editor.selectionStart).match(/[A-Za-z_][A-Za-z0-9_]*$/)?.[0].length ?? 0)
      : editor.selectionStart;
    const end = editor.selectionEnd;
    const next = `${sql.slice(0, start)}${text}${sql.slice(end)}`;
    setSql(next);
    setResults(null);
    setQueryError(null);
    setShowSuggestions(false);
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(start + text.length, start + text.length);
      setCursor(start + text.length);
    });
  }, [sql]);

  const runQuery = useCallback(async () => {
    if (!sql.trim() || !ready || queryLoading) return;
    setQueryLoading(true);
    setQueryError(null);
    setResults(null);
    try {
      const response = await fetch('/api/workspace/analytics/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, source }),
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await readResponse<{ results: QueryResult[] }>(response);
      setResults(data.results);
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : 'Không thể chạy truy vấn.');
    } finally {
      setQueryLoading(false);
    }
  }, [queryLoading, ready, source, sql]);

  return (
    <section className="workspace-analytics" aria-label="SQL analytics local">
      <div className="workspace-analytics-heading">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-950"><Code2 className="h-5 w-5 text-[#004A98]" aria-hidden="true" /> SQL analytics</h2>
          <p className="mt-1 text-sm text-gray-600">Viết truy vấn trên snapshot tại máy. Dữ liệu được nạp vào RAM khi chạy.</p>
        </div>
        <button type="button" className="ustudy-button-outline min-h-10" onClick={() => { void loadMetadata(); }} disabled={metadataLoading}>
          <RefreshCw className={`h-4 w-4 ${metadataLoading ? 'animate-spin' : ''}`} aria-hidden="true" /> Kiểm tra snapshot
        </button>
      </div>

      <div className="workspace-analytics-status" aria-live="polite">
        {metadataLoading ? <p className="text-sm text-gray-500">Đang đọc snapshot trên máy…</p> : metadataError ? (
          <p className="flex items-center gap-2 text-sm text-red-700"><CircleAlert className="h-4 w-4" aria-hidden="true" />{metadataError}</p>
        ) : snapshots.map((snapshot) => (
          <div key={snapshot.source} className="workspace-analytics-source-status">
            <span className={`h-2 w-2 rounded-full ${snapshot.available ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
            <span className="font-medium text-gray-800">{sourceLabel(snapshot.source)}</span>
            <span className="text-gray-500">{snapshot.available && snapshot.updatedAt
              ? `Snapshot ${new Date(snapshot.updatedAt).toLocaleString('vi-VN')}`
              : 'Chưa có snapshot'}</span>
          </div>
        ))}
      </div>

      {!metadataLoading && !ready && !metadataError && (
        <div className="workspace-analytics-notice" role="status">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Chưa có đủ snapshot cho nguồn đang chọn. Mở terminal ở thư mục UStudy, chạy <code>pnpm run analytics:snapshot</code>, rồi bấm “Kiểm tra snapshot”.</p>
        </div>
      )}

      <div className="workspace-analytics-layout">
        <div className="min-w-0 space-y-5">
          <div className="workspace-analytics-surface">
            <div className="workspace-analytics-toolbar">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">Câu truy vấn</h3>
                <p className="mt-0.5 text-xs text-gray-500">Chỉ đọc dữ liệu · Ctrl + Enter để chạy · Ctrl + Space để xem gợi ý</p>
              </div>
              <AppSelect
                ariaLabel="Chọn snapshot để truy vấn"
                value={source}
                options={sourceOptions}
                onChange={(next) => { setSource(next as Source); setResults(null); setQueryError(null); }}
                className="w-full sm:w-48"
                triggerClassName="min-h-10 bg-white"
              />
            </div>
            <div className="workspace-analytics-example-list" aria-label="Truy vấn mẫu">
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500"><Lightbulb className="h-3.5 w-3.5" aria-hidden="true" /> Mẫu:</span>
              {examples.map((example) => (
                <button
                  key={example.name}
                  type="button"
                  title={example.description}
                  className="workspace-analytics-example"
                  onClick={() => { setSql(example.sql); setResults(null); setQueryError(null); setShowSuggestions(false); }}
                >
                  {example.name}
                </button>
              ))}
            </div>
            <div className="workspace-analytics-editor-wrap">
              <label htmlFor="workspace-analytics-sql" className="sr-only">Nhập truy vấn SQL</label>
              <textarea
                id="workspace-analytics-sql"
                ref={editorRef}
                value={sql}
                onChange={(event) => {
                  setSql(event.target.value);
                  setCursor(event.target.selectionStart);
                  setShowSuggestions(true);
                  setActiveSuggestion(0);
                  setResults(null);
                  setQueryError(null);
                }}
                onClick={(event) => setCursor(event.currentTarget.selectionStart)}
                onKeyUp={(event) => setCursor(event.currentTarget.selectionStart)}
                onKeyDown={(event) => {
                  if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); void runQuery(); return; }
                  if (event.ctrlKey && event.code === 'Space') { event.preventDefault(); setShowSuggestions(true); setActiveSuggestion(0); return; }
                  if (event.key === 'Escape') setShowSuggestions(false);
                  if (showSuggestions && completions.length) {
                    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveSuggestion((index) => (index + 1) % completions.length); }
                    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveSuggestion((index) => (index - 1 + completions.length) % completions.length); }
                    if (event.key === 'Tab') { event.preventDefault(); insertText(completions[activeSuggestion]?.label ?? completions[0].label, true); }
                  }
                }}
                onBlur={() => { window.setTimeout(() => setShowSuggestions(false), 100); }}
                aria-controls="workspace-analytics-suggestions"
                aria-expanded={showSuggestions && completions.length > 0}
                aria-autocomplete="list"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="workspace-analytics-editor"
              />
              {showSuggestions && completions.length > 0 && (
                <div id="workspace-analytics-suggestions" className="workspace-analytics-suggestions" role="listbox" aria-label="Gợi ý SQL">
                  {completions.map((completion, index) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeSuggestion}
                      key={`${completion.kind}-${completion.label}`}
                      className={`workspace-analytics-suggestion ${index === activeSuggestion ? 'workspace-analytics-suggestion-active' : ''}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => insertText(completion.label, true)}
                    >
                      <span className="font-mono text-xs font-medium">{completion.label}</span>
                      <span className="text-[11px] opacity-70">{completion.detail ?? completion.kind}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="workspace-analytics-editor-footer">
              <p className="text-xs text-gray-500">Gõ tên bảng/cột để hiện gợi ý. Truy vấn chạy riêng trên mỗi nguồn được chọn.</p>
              <button type="button" className="ustudy-button-primary min-h-10 shrink-0" onClick={() => { void runQuery(); }} disabled={!ready || !sql.trim() || queryLoading}>
                {queryLoading ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                {queryLoading ? 'Đang chạy…' : 'Chạy SQL'}
              </button>
            </div>
          </div>

          {queryError && <p className="workspace-analytics-error" role="alert"><CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />{queryError}</p>}
          {results ? (
            <div className="space-y-4" aria-live="polite">{results.map((result) => <ResultTable key={result.source} result={result} />)}</div>
          ) : !queryError && (
            <div className="ustudy-empty-state flex-col gap-2">
              <Database className="h-6 w-6 text-gray-400" aria-hidden="true" />
              <p>Chọn câu SQL mẫu hoặc tự viết truy vấn, rồi bấm “Chạy SQL”.</p>
            </div>
          )}
        </div>

        <aside className="workspace-analytics-schema" aria-label="Schema gợi ý">
          <div className="workspace-analytics-schema-heading">
            <div className="flex items-center gap-2"><Database className="h-4 w-4 text-[#004A98]" aria-hidden="true" /><h3 className="text-sm font-semibold text-gray-900">Schema snapshot</h3></div>
            <p className="mt-1 text-xs text-gray-500">Nhấn tên bảng hoặc cột để chèn vào SQL.</p>
          </div>
          {schema.length ? schema.map((table) => (
            <div key={table.name} className="workspace-analytics-schema-table">
              <button type="button" className="workspace-analytics-schema-name" onClick={() => insertText(table.name)} title={`Chèn ${table.name}`}>
                <Table2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate font-mono text-xs font-semibold">{table.name}</span>
              </button>
              <ul className="workspace-analytics-schema-columns">
                {table.columns.map((column) => {
                  const foreignKey = table.foreignKeys.find((key) => key.from === column.name);
                  return (
                    <li key={column.name}>
                      <button type="button" className="workspace-analytics-column" onClick={() => insertText(column.name)} title={`Chèn ${column.name}`}>
                        <span className="min-w-0 flex-1 truncate font-mono text-xs">{column.name}</span>
                        <span className="shrink-0 text-[10px] text-gray-500">{column.type}{column.primaryKey ? ' · PK' : foreignKey ? ' · FK' : ''}</span>
                      </button>
                      {columnHelp[column.name] && <p className="workspace-analytics-column-help">{columnHelp[column.name]}</p>}
                      {foreignKey && <p className="workspace-analytics-fk">→ {foreignKey.table}.{foreignKey.to}</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )) : <p className="px-4 py-6 text-sm text-gray-500">{metadataLoading ? 'Đang đọc schema…' : 'Chưa có schema. Tải snapshot rồi làm mới.'}</p>}
          <div className="workspace-analytics-schema-tip">
            <p className="flex items-center gap-1.5 font-semibold text-gray-700"><Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> Ghi nhớ</p>
            <p><code>installation_hash</code> nối hai bảng. <code>deleted_day IS NULL</code> là installation đang hoạt động. Ngày có dạng <code>YYYY-MM-DD</code>.</p>
            <p className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Snapshot chỉ cập nhật khi chạy lệnh export.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
