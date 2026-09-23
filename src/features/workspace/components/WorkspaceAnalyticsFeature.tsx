import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, Code2, Copy, Database, Download, Lightbulb, Play, RefreshCw, Square, Table2 } from 'lucide-react';
import { AppSelect } from '../../../components/ui/form/app-select';
import '../workspace-analytics.css';

type Source = 'both' | 'hakhoi' | 'unopia';
type Column = { name: string; type: string; required: boolean; primaryKey: boolean };
type Table = { name: string; columns: Column[]; foreignKeys: Array<{ from: string; to: string; table: string }> };
type Snapshot = { source: Exclude<Source, 'both'>; available: boolean; updatedAt: string | null; bytes: number; schema: Table[]; error?: string };
type QueryRow = Record<string, string | number | null>;
type QueryResult = { source: Source; columns?: string[]; rows?: QueryRow[]; truncated?: boolean; elapsedMs?: number; error?: string };
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
    description: 'Số installation hoạt động mỗi ngày trên cả hai nguồn',
    sql: `SELECT
  a.active_day,
  COUNT(*) AS dau,
  SUM(i.first_seen_day = a.active_day) AS new_installations,
  SUM(i.first_seen_day < a.active_day) AS returning_installations
FROM installation_activity_days AS a
JOIN anonymous_installations AS i
  ON i.source = a.source AND i.installation_hash = a.installation_hash
GROUP BY a.active_day
ORDER BY a.active_day DESC;`,
  },
  {
    name: 'Theo nguồn',
    description: 'So sánh Hakhoi và Unopia trong một bảng',
    sql: `SELECT source, COUNT(*) AS installations
FROM anonymous_installations
GROUP BY source
ORDER BY source;`,
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
  SELECT source, installation_hash
  FROM installation_activity_days
  GROUP BY source, installation_hash
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
  ON a.source = i.source AND a.installation_hash = i.installation_hash
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

const sourceOptions = [
  { id: 'both', name: 'Gộp hai nguồn' },
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
  return source === 'hakhoi' ? 'Hakhoi' : source === 'unopia' ? 'Unopia' : 'Hợp nhất';
}

function csvCell(value: QueryRow[string] | string): string {
  const text = value === null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function resultCsv(result: QueryResult): string {
  const columns = result.columns ?? [];
  const rows = result.rows ?? [];
  return [columns.map(csvCell).join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column] ?? null)).join(','))].join('\r\n');
}

function downloadCsv(result: QueryResult) {
  const blob = new Blob(['\uFEFF', resultCsv(result)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ustudy-analytics-${result.source}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function completionContext(sql: string, cursor: number, schema: Table[]) {
  const before = sql.slice(0, cursor);
  const dot = before.match(/([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_0-9]*)$/);
  const token = dot?.[2] ?? before.match(/[A-Za-z_][A-Za-z0-9_]*$/)?.[0] ?? '';
  if (!dot) return { token, tables: schema };
  const alias = dot[1].toLowerCase();
  const matched = schema.filter((table) => {
    if (table.name.toLowerCase() === alias) return true;
    const pattern = new RegExp(`\\b(?:FROM|JOIN)\\s+${table.name}\\s+(?:AS\\s+)?${alias}\\b`, 'i');
    return pattern.test(sql);
  });
  return { token, tables: matched.length ? matched : schema, afterDot: true };
}

function caretPosition(editor: HTMLTextAreaElement, cursor: number) {
  const style = window.getComputedStyle(editor);
  const mirror = document.createElement('div');
  mirror.style.cssText = 'position:absolute;visibility:hidden;white-space:pre-wrap;overflow-wrap:break-word;top:0;left:-9999px;';
  for (const property of ['boxSizing', 'width', 'padding', 'border', 'font', 'lineHeight', 'letterSpacing', 'tabSize'] as const) {
    mirror.style[property] = style[property];
  }
  mirror.textContent = editor.value.slice(0, cursor);
  const marker = document.createElement('span');
  marker.textContent = '|';
  mirror.append(marker);
  document.body.append(mirror);
  const position = marker.getBoundingClientRect();
  const origin = mirror.getBoundingClientRect();
  mirror.remove();
  return { left: position.left - origin.left - editor.scrollLeft, top: position.top - origin.top - editor.scrollTop };
}

function ResultTable({ result }: { result: QueryResult }) {
  const [copyStatus, setCopyStatus] = useState('');
  const rows = result.rows ?? [];
  const columns = result.columns ?? [];
  const copyTable = async () => {
    try {
      await navigator.clipboard.writeText([columns.join('\t'), ...rows.map((row) => columns.map((column) => displayValue(row[column] ?? null)).join('\t'))].join('\n'));
      setCopyStatus('Đã sao chép bảng');
    } catch {
      setCopyStatus('Không thể sao chép. Hãy thử tải CSV.');
    }
  };
  return (
    <section className="workspace-analytics-result" aria-label={`Kết quả ${sourceLabel(result.source)}`}>
      <div className="workspace-analytics-result-heading">
        <div className="flex min-w-0 items-center gap-2">
          <Table2 className="h-4 w-4 shrink-0 text-[#004A98]" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-gray-900">{sourceLabel(result.source)}</h3>
          {!result.error && <span className="text-xs text-gray-500">{rows.length}{result.truncated ? '+' : ''} dòng</span>}
        </div>
        {!result.error && <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-gray-500">{result.elapsedMs} ms</span>
          <button type="button" className="workspace-analytics-result-action" onClick={() => { void copyTable(); }} title="Sao chép bảng" aria-label={`Sao chép bảng ${sourceLabel(result.source)}`}><Copy className="h-4 w-4" /></button>
          <button type="button" className="workspace-analytics-result-action" onClick={() => downloadCsv(result)} title="Tải CSV" aria-label={`Tải CSV ${sourceLabel(result.source)}`}><Download className="h-4 w-4" /></button>
        </div>}
      </div>
      {result.error ? <p className="workspace-analytics-result-error" role="alert"><CircleAlert className="h-4 w-4 shrink-0" />{result.error}</p> : rows.length > 0 ? (
        <div className="workspace-analytics-table-scroll">
          <table className="workspace-analytics-table">
            <thead>
              <tr>{columns.map((column, index) => <th key={`${column}-${index}`} scope="col">{column}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, index) => (
                    <td key={`${column}-${index}`} title={displayValue(row[column] ?? null)} className={typeof row[column] === 'number' ? 'workspace-analytics-numeric' : undefined}>{displayValue(row[column] ?? null)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="px-4 py-6 text-center text-sm text-gray-500">Truy vấn chạy thành công nhưng không có dòng dữ liệu.</p>}
      {copyStatus && <p className="workspace-analytics-copy-status" role="status">{copyStatus}</p>}
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
  const [manualSuggestions, setManualSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({ left: 16, top: 16 });
  const [results, setResults] = useState<QueryResult[] | null>(null);
  const [resultQuery, setResultQuery] = useState('');
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [queryLoading, setQueryLoading] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const queryController = useRef<AbortController | null>(null);

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
  useEffect(() => () => queryController.current?.abort(), []);
  useEffect(() => {
    try { sessionStorage.setItem(draftKey, sql); } catch { /* storage may be unavailable */ }
  }, [sql]);

  const schemaSnapshots = snapshots.filter((snapshot) => snapshot.available && (source === 'both' || snapshot.source === source));
  const schema = useMemo(() => {
    const tablesByName = new Map<string, Table>();
    for (const snapshot of schemaSnapshots) {
      for (const table of snapshot.schema) {
        const existing = tablesByName.get(table.name);
        if (!existing) {
          tablesByName.set(table.name, { ...table, columns: [...table.columns] });
        } else {
          for (const column of table.columns) {
            if (!existing.columns.some((item) => item.name === column.name)) existing.columns.push(column);
          }
        }
      }
    }
    return [...tablesByName.values()];
  }, [snapshots, source]);
  const ready = source === 'both'
    ? snapshots.length === 2 && snapshots.every((snapshot) => snapshot.available)
    : snapshots.some((snapshot) => snapshot.source === source && snapshot.available);

  const completions = useMemo(() => {
    if (!showSuggestions) return [];
    const { token, tables: suggestedTables, afterDot } = completionContext(sql, cursor, schema);
    const items: Completion[] = [
      ...(!afterDot ? schema.map((table) => ({ label: table.name, kind: 'table' as const })) : []),
      ...suggestedTables.flatMap((table) => table.columns.map((column) => ({ label: column.name, kind: 'column' as const, detail: table.name }))),
      ...keywords.map((keyword) => ({ label: keyword, kind: 'keyword' as const })),
    ];
    if (token.length < 2 && !afterDot && !manualSuggestions) return [];
    const matching = items.filter((item) => (!afterDot || item.kind === 'column') && item.label.toLowerCase().startsWith(token.toLowerCase()));
    const unique = new Set<string>();
    return matching.filter((item) => {
      if (unique.has(item.label)) return false;
      unique.add(item.label);
      return true;
    }).slice(0, 8);
  }, [cursor, manualSuggestions, schema, showSuggestions, sql]);

  const updateSuggestionPosition = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const caret = caretPosition(editor, editor.selectionStart);
    const menuWidth = Math.min(288, editor.clientWidth - 16);
    setSuggestionPosition({
      left: Math.max(8, Math.min(editor.offsetLeft + caret.left, editor.offsetLeft + editor.clientWidth - menuWidth - 8)),
      top: Math.max(8, Math.min(editor.offsetTop + caret.top + 24, editor.offsetTop + editor.clientHeight - 160)),
    });
  }, []);

  const insertText = useCallback((text: string, replaceToken = false) => {
    const editor = editorRef.current;
    if (!editor) return;
    const start = replaceToken
      ? editor.selectionStart - (sql.slice(0, editor.selectionStart).match(/[A-Za-z_][A-Za-z0-9_]*$/)?.[0].length ?? 0)
      : editor.selectionStart;
    const end = editor.selectionEnd;
    const next = `${sql.slice(0, start)}${text}${sql.slice(end)}`;
    setSql(next);
    setQueryError(null);
    setShowSuggestions(false);
    setManualSuggestions(false);
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(start + text.length, start + text.length);
      setCursor(start + text.length);
    });
  }, [sql]);

  const runQuery = useCallback(async () => {
    if (!sql.trim() || !ready || queryLoading) return;
    const controller = new AbortController();
    queryController.current = controller;
    setQueryLoading(true);
    setQueryError(null);
    try {
      const response = await fetch('/api/workspace/analytics/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, source }),
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal,
      });
      const data = await readResponse<{ results: QueryResult[] }>(response);
      setResults(data.results);
      setResultQuery(sql);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }));
    } catch (error) {
      setQueryError(controller.signal.aborted ? 'Đã hủy truy vấn.' : error instanceof Error ? error.message : 'Không thể chạy truy vấn.');
    } finally {
      if (queryController.current === controller) queryController.current = null;
      setQueryLoading(false);
    }
  }, [queryLoading, ready, source, sql]);

  const cancelQuery = () => queryController.current?.abort();

  return (
    <section className="workspace-analytics" aria-label="SQL analytics local">
      <div className="workspace-analytics-heading">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-950"><Code2 className="h-5 w-5 text-[#004A98]" aria-hidden="true" /> SQL analytics</h2>
          <p className="mt-1 text-sm text-gray-600">Viết SQL trên snapshot local. Chọn “Gộp hai nguồn” để truy vấn chung, phân biệt bằng cột <code>source</code>.</p>
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
              : snapshot.error ?? 'Chưa có snapshot'}</span>
          </div>
        ))}
      </div>

      {!metadataLoading && !ready && !metadataError && (
        <div className="workspace-analytics-notice" role="status">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Chưa có đủ snapshot cho nguồn đang chọn. Mở terminal ở thư mục UStudy, chạy <code>pnpm run analytics:snapshot</code> để tải dữ liệu mới từ Cloudflare, rồi bấm “Kiểm tra snapshot” để đọc lại file trên máy.</p>
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
                onChange={(next) => { setSource(next as Source); setResults(null); setQueryError(null); setShowSuggestions(false); }}
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
                  onClick={() => { setSql(example.sql); setQueryError(null); setShowSuggestions(false); }}
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
                  setManualSuggestions(false);
                  setActiveSuggestion(0);
                  setQueryError(null);
                  requestAnimationFrame(updateSuggestionPosition);
                }}
                onClick={(event) => { setCursor(event.currentTarget.selectionStart); requestAnimationFrame(updateSuggestionPosition); }}
                onKeyUp={(event) => { setCursor(event.currentTarget.selectionStart); requestAnimationFrame(updateSuggestionPosition); }}
                onScroll={() => { if (showSuggestions) updateSuggestionPosition(); }}
                onKeyDown={(event) => {
                  if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); void runQuery(); return; }
                  if (event.ctrlKey && event.code === 'Space') { event.preventDefault(); setShowSuggestions(true); setManualSuggestions(true); setActiveSuggestion(0); requestAnimationFrame(updateSuggestionPosition); return; }
                  if (event.key === 'Escape') { setShowSuggestions(false); return; }
                  if (showSuggestions && completions.length) {
                    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveSuggestion((index) => (index + 1) % completions.length); return; }
                    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveSuggestion((index) => (index - 1 + completions.length) % completions.length); return; }
                    if (event.key === 'Tab' && !event.shiftKey) { event.preventDefault(); insertText(completions[activeSuggestion]?.label ?? completions[0].label, true); return; }
                  }
                  if (event.key === 'Tab' && !event.shiftKey) { event.preventDefault(); insertText('  '); }
                }}
                onBlur={() => { window.setTimeout(() => setShowSuggestions(false), 100); }}
                aria-controls="workspace-analytics-suggestions"
                aria-expanded={showSuggestions && completions.length > 0}
                aria-autocomplete="list"
                aria-activedescendant={showSuggestions && completions.length > 0 ? `workspace-analytics-suggestion-${Math.min(activeSuggestion, completions.length - 1)}` : undefined}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="workspace-analytics-editor"
              />
              {showSuggestions && completions.length > 0 && (
                <div id="workspace-analytics-suggestions" className="workspace-analytics-suggestions" style={suggestionPosition} role="listbox" aria-label="Gợi ý SQL">
                  {completions.map((completion, index) => (
                    <button
                      type="button"
                      role="option"
                      id={`workspace-analytics-suggestion-${index}`}
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
              <p className="text-xs text-gray-500">Gõ <code>i.</code> để thấy cột; gợi ý đầu tiên được chọn sẵn, bấm Tab để chèn. ↑/↓ đổi gợi ý.</p>
              <div className="workspace-analytics-editor-actions">
                {queryLoading && <button type="button" className="ustudy-button-outline min-h-10" onClick={cancelQuery}><Square className="h-3.5 w-3.5" aria-hidden="true" /> Hủy</button>}
                <button type="button" className="ustudy-button-primary min-h-10 shrink-0" onClick={() => { void runQuery(); }} disabled={!ready || !sql.trim() || queryLoading}>
                  {queryLoading ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                  {queryLoading ? 'Đang chạy…' : 'Chạy SQL'}
                </button>
              </div>
            </div>
          </div>

          {queryError && <p className="workspace-analytics-error" role="alert"><CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />{queryError}</p>}
          {results ? (
            <div ref={resultRef} className="space-y-3" aria-live="polite">
              {resultQuery !== sql && <p className="text-xs text-amber-800">Kết quả của lần chạy trước; SQL trong ô nhập đã thay đổi.</p>}
              {results.map((result) => <ResultTable key={result.source} result={result} />)}
            </div>
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
            {schemaSnapshots.length > 0 && <p className="mt-1 text-xs font-medium text-[#004A98]">{source === 'both' ? `Hợp nhất · ${schemaSnapshots.map((item) => sourceLabel(item.source)).join(' + ')}` : `Đang xem: ${sourceLabel(source)}`}</p>}
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
                      {foreignKey && <p className="workspace-analytics-fk">→ {foreignKey.table}.{foreignKey.to}</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )) : <p className="px-4 py-6 text-sm text-gray-500">{metadataLoading ? 'Đang đọc schema…' : `Chưa có schema ${source === 'both' ? 'nào' : sourceLabel(source)}. Tải snapshot rồi làm mới.`}</p>}
          <div className="workspace-analytics-schema-tip">
            Nối hai bảng bằng <code>source</code> và <code>installation_hash</code>. Cùng hash ở hai nguồn vẫn là hai dòng riêng.
          </div>
        </aside>
      </div>
    </section>
  );
}
