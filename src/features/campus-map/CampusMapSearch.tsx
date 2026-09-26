import { Building2, DoorOpen, Layers3, LoaderCircle, Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  CAMPUS_MAP_DATA,
  createRoomSearchResult,
  searchCampusPlaces,
  type CampusId,
  type CampusPlaceSearchResult,
} from '../../domain/campus-map';
import { resolveKnownPortalRoom } from '../../integrations/hcmus-portal/rooms';

const data = CAMPUS_MAP_DATA;

function portalCandidates(query: string, campusId: CampusId): CampusPlaceSearchResult[] {
  const campusCode = data.campusesById[campusId]?.code.toLowerCase();
  const codes = /^P\./i.test(query) || !campusCode ? [query] : [query, `P.${campusCode}:${query}`];
  const roomIds = new Set<string>();
  for (const code of codes) {
    const resolution = resolveKnownPortalRoom(code);
    if (resolution.status === 'matched' && resolution.roomId) roomIds.add(resolution.roomId);
    if (resolution.status === 'ambiguous') resolution.candidates?.forEach((id) => roomIds.add(id));
  }
  return [...roomIds]
    .map((roomId) => createRoomSearchResult(roomId, data, 1000))
    .filter((result): result is CampusPlaceSearchResult => Boolean(result));
}

function resultIcon(type: CampusPlaceSearchResult['type']) {
  if (type === 'building') return Building2;
  if (type === 'floor') return Layers3;
  return DoorOpen;
}

function resultType(type: CampusPlaceSearchResult['type']) {
  if (type === 'building') return 'Tòa';
  if (type === 'floor') return 'Tầng';
  return 'Phòng';
}

export function CampusMapSearch({ campusId, onSelect, maxResults = 10 }: {
  campusId: CampusId;
  maxResults?: number;
  onSelect: (result: CampusPlaceSearchResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const trimmedQuery = query.trim();
  const pending = Boolean(trimmedQuery) && trimmedQuery !== debouncedQuery;

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(trimmedQuery), 160);
    return () => window.clearTimeout(timeout);
  }, [trimmedQuery]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const results = useMemo(() => {
    if (!debouncedQuery) return [];
    const inventoryQuery = debouncedQuery.replace(/^P\.(?:cs1|cs2):/i, '');
    const combined = [
      ...portalCandidates(debouncedQuery, campusId),
      ...searchCampusPlaces(inventoryQuery, data, campusId),
    ];
    return [...new Map(combined.map((result) => [result.key, result])).values()].slice(0, maxResults);
  }, [campusId, debouncedQuery, maxResults]);

  useEffect(() => { setActiveIndex(0); }, [campusId, debouncedQuery]);

  function choose(result: CampusPlaceSearchResult) {
    setQuery(result.label);
    setOpen(false);
    inputRef.current?.blur();
    onSelect(result);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') { setOpen(false); return; }
    if (!open || !results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(results[activeIndex]);
    }
  }

  return <div ref={rootRef} className="ustudy-campus-search">
    <div className="ustudy-campus-search-field">
      <Search className="ustudy-campus-search-leading" aria-hidden="true" />
      <label htmlFor={`${listId}-input`} className="sr-only">Tìm phòng, tầng, tòa hoặc mã Portal</label>
      <input
        ref={inputRef}
        id={`${listId}-input`}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && Boolean(trimmedQuery)}
        aria-controls={listId}
        aria-activedescendant={open && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => { if (trimmedQuery) setOpen(true); }}
        onKeyDown={onKeyDown}
        placeholder="Tìm phòng, tòa hoặc mã Portal…"
        className="ustudy-campus-search-input"
      />
      {pending ? <LoaderCircle className="ustudy-campus-search-trailing animate-spin" aria-label="Đang tìm" /> : query && <button
        type="button"
        onClick={() => { setQuery(''); setDebouncedQuery(''); setOpen(false); }}
        aria-label="Xóa nội dung tìm kiếm"
        className="ustudy-campus-search-clear"
      ><X className="h-4 w-4" aria-hidden="true" /></button>}
    </div>

    {open && trimmedQuery && <div id={listId} role="listbox" aria-label="Kết quả tìm kiếm bản đồ" className="ustudy-campus-search-menu">
      {pending ? <p className="ustudy-campus-search-message">Đang tìm địa điểm…</p> : results.length ? results.map((result, index) => {
        const Icon = resultIcon(result.type);
        const active = index === activeIndex;
        return <button
          id={`${listId}-${index}`}
          key={result.key}
          type="button"
          role="option"
          aria-selected={active}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => choose(result)}
          className={`ustudy-campus-search-option ${active ? 'ustudy-campus-search-option-active' : ''}`}
        >
          <span className="ustudy-campus-search-icon"><Icon className="h-4 w-4" aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{result.label}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{result.context}</span></span>
          <span className="text-xs font-medium text-slate-400">{resultType(result.type)}</span>
        </button>;
      }) : <div className="ustudy-campus-search-message"><p className="font-medium text-slate-700">Không tìm thấy địa điểm</p><p className="mt-1 text-xs">Thử mã như D207, E301 hoặc tên tòa/phòng.</p></div>}
    </div>}
    <span className="sr-only" role="status" aria-live="polite">{!pending && trimmedQuery ? `${results.length} kết quả` : ''}</span>
  </div>;
}
