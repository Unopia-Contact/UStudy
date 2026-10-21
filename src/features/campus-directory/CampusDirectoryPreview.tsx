import { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronRight, Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { CAMPUS_UNITS, type CampusUnitType } from '../../assets/data/campus-directory';
import { AppSelect } from '../../components/ui/form/app-select';
import { MobileBottomSheet } from '../../components/ui/overlays/mobile-bottom-sheet';
import { searchCampusUnits } from './campus-directory-search';
import { DIRECTORY_TYPES, directoryTypeLabel, locationLabel } from './directory-preview-utils';
import { DirectoryPreviewDetail } from './components/DirectoryPreviewDetail';
import './directory-preview.css';

export function CampusDirectoryPreview() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [type, setType] = useState(params.get('type') ?? 'all');
  const [selectedId, setSelectedId] = useState(params.get('unit') ?? '');
  const [sheetOpen, setSheetOpen] = useState(Boolean(params.get('unit')));
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => { setCompact(media.matches); if (!media.matches) setSheetOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const filtered = useMemo(() => searchCampusUnits(CAMPUS_UNITS, query).filter(unit => type === 'all' || unit.type === type), [query, type]);
  const selected = filtered.find(unit => unit.id === selectedId) ?? filtered[0];
  const groups = query.trim()
    ? [{ name: 'Résultats', units: filtered }]
    : DIRECTORY_TYPES.map(item => ({ name: item.name, units: filtered.filter(unit => unit.type === item.id) })).filter(group => group.units.length);

  const selectUnit = (id: string, related = false) => {
    if (related) { setQuery(''); setType('all'); }
    setSelectedId(id);
    setParams(current => {
      const next = new URLSearchParams(current);
      next.set('unit', id);
      return next;
    }, { replace: true });
    if (compact) setSheetOpen(true);
  };
  const clearFilters = () => { setQuery(''); setType('all'); };
  const displayMeta = (id: string) => {
    const unit = CAMPUS_UNITS.find(item => item.id === id)!;
    const parent = CAMPUS_UNITS.find(item => item.id === unit.parentId);
    return unit.locations[0] ? locationLabel(unit.locations[0]) : parent?.name ?? directoryTypeLabel(unit.type);
  };

  return <section className="directory-preview" aria-label="Danh bạ đơn vị mới">
    <div className="directory-preview-layout">
      <aside className="directory-preview-list" aria-label="Tìm đơn vị">
        <div className="directory-preview-search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input aria-label="Tìm đơn vị hoặc thủ tục" placeholder="Tên đơn vị, thủ tục…" value={query} onChange={event => setQuery(event.target.value)} className="directory-preview-search-input" />
            {query && <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setQuery('')} className="directory-preview-icon-button absolute right-0 top-0"><X className="h-4 w-4" /></button>}
          </div>
          <AppSelect value={type} onChange={setType} ariaLabel="Lọc loại đơn vị" className="mt-2" triggerClassName="min-h-11" options={[{ id: 'all', name: 'Tất cả đơn vị' }, ...DIRECTORY_TYPES.filter(item => CAMPUS_UNITS.some(unit => unit.type === item.id))]} />
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span aria-live="polite">{filtered.length} đơn vị{query.trim() ? ' phù hợp' : ''}</span>
            {(query || type !== 'all') && <button type="button" onClick={clearFilters} className="min-h-9 font-medium text-[#004A98]">Xóa bộ lọc</button>}
          </div>
        </div>
        <div className="directory-preview-results">
          {groups.map(group => <section key={group.name}>
            {!query.trim() && <h3 className="directory-preview-group">{group.name} <span className="ml-1 font-normal text-slate-400">{group.units.length}</span></h3>}
            {group.units.map(unit => <button key={unit.id} type="button" className="directory-preview-row" aria-current={!compact && selected?.id === unit.id} onClick={() => selectUnit(unit.id)}>
              <Building2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="min-w-0 flex-1"><span className="directory-preview-row-title">{unit.name}</span><span className="mt-1 block truncate text-xs text-slate-500">{displayMeta(unit.id)}{unit.locations.length > 1 ? ` · +${unit.locations.length - 1}` : ''}</span></span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            </button>)}
          </section>)}
          {!filtered.length && <div className="directory-preview-empty"><Search className="mx-auto mb-3 h-6 w-6 text-slate-300" /><p className="font-medium text-slate-700">Không tìm thấy đơn vị</p><p className="mt-2 text-xs leading-5">Thử tên viết tắt như PĐT, CTSV hoặc tên thủ tục.</p><button type="button" onClick={clearFilters} className="mt-3 min-h-11 font-medium text-[#004A98]">Xóa bộ lọc</button></div>}
        </div>
      </aside>
      {!compact && (selected ? <DirectoryPreviewDetail key={selected.id} unit={selected} allUnits={CAMPUS_UNITS} onSelectUnit={id => selectUnit(id, true)} /> : <div className="directory-preview-empty flex items-center justify-center">Chọn đơn vị để xem thông tin liên hệ.</div>)}
    </div>
    {compact && sheetOpen && selected && <MobileBottomSheet sheetId="directory-preview" title={selected.name} eyebrow={directoryTypeLabel(selected.type)} onClose={() => setSheetOpen(false)} contentClassName="directory-preview-sheet">
      <DirectoryPreviewDetail key={selected.id} unit={selected} allUnits={CAMPUS_UNITS} onSelectUnit={id => selectUnit(id, true)} />
    </MobileBottomSheet>}
  </section>;
}
