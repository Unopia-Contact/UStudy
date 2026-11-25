import { useId, useMemo, useRef, useState } from 'react';
import { Plus, Search, Settings, X } from 'lucide-react';
import { Input } from '../../../components/ui/form/input';
import { parseCourseInput } from '../hooks/use-group-scheduler';

const visibleResultLimit = 5;
const courseCodePattern = /^[A-Z][A-Z0-9-]*\d[A-Z0-9-]*$/;

function normalizeSearch(value: string) {
    return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd').trim();
}

interface GroupMemberCoursePickerProps {
    catalog: ReadonlyMap<string, string>;
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    canFilterClasses: (id: string) => boolean;
    onFilterClasses: (id: string) => void;
}

export function GroupMemberCoursePicker({ catalog, selectedIds, onChange, canFilterClasses, onFilterClasses }: GroupMemberCoursePickerProps) {
    const headingId = useId();
    const resultsHeadingId = useId();
    const searchRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const searchable = useMemo(() => Array.from(catalog, ([id, name]) => ({
        id, name, text: normalizeSearch(id + ' ' + name),
    })), [catalog]);
    const normalized = normalizeSearch(query);
    const tokens = normalized.split(/\s+/);
    const selected = new Set(selectedIds);
    const enteredCodes = parseCourseInput(query);
    const directCodes = enteredCodes.length > 0
        && enteredCodes.every(id => catalog.has(id) || (id.length <= 32 && courseCodePattern.test(id)))
        ? enteredCodes.filter(id => !selected.has(id)) : [];
    const matches = normalized ? searchable.filter(course => !selected.has(course.id)
        && tokens.every(token => course.text.includes(token))) : [];
    const exactMatch = matches.find(course => course.id.toLowerCase() === normalized);
    const results = (exactMatch ? [exactMatch, ...matches.filter(course => course !== exactMatch)] : matches)
        .slice(0, visibleResultLimit);
    const manualIds = (enteredCodes.length > 1 || !results.length) ? directCodes : [];

    const addCourses = (ids: string[], restoreFocus = false) => {
        onChange([...selectedIds, ...ids]);
        setQuery('');
        if (restoreFocus) searchRef.current?.focus({ preventScroll: true });
    };

    return (
        <section aria-labelledby={headingId} className="space-y-2.5 border-y border-slate-200 py-3">
            <div className="space-y-1.5">
                <div className="relative">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <Input
                        ref={searchRef}
                        aria-label="Tìm môn học"
                        placeholder="Tìm theo mã hoặc tên môn"
                        className="h-11 border-slate-300 bg-white pl-9 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-200"
                        autoComplete="off"
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        onKeyDown={event => {
                            if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
                            event.preventDefault();
                            if (manualIds.length) addCourses(manualIds);
                            else if (exactMatch) addCourses([exactMatch.id]);
                            else if (matches.length === 1) addCourses([matches[0].id]);
                        }}
                    />
                </div>
                {normalized && (
                    <div role="group" aria-labelledby={resultsHeadingId} className="overflow-hidden rounded-lg border border-blue-200 bg-white shadow-sm">
                        <p id={resultsHeadingId} className="border-b border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-[#004A98]">Kết quả tìm môn</p>
                        {results.length > 0 && <ul aria-label="Môn tìm thấy" className="divide-y divide-slate-200">
                            {results.map(({ id, name }) => (
                                <li key={id}>
                                    <button
                                        type="button"
                                        aria-label={`Thêm ${id} · ${name}`}
                                        className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500"
                                        onClick={event => addCourses([id], event.detail === 0)}
                                    >
                                        <span className="min-w-0 flex-1 truncate"><span className="font-medium text-slate-900">{id}</span>{name !== id && <span className="text-slate-600"> · {name}</span>}</span>
                                        <Plus aria-hidden="true" className="size-4 shrink-0 text-[#004A98]" />
                                    </button>
                                </li>
                            ))}
                        </ul>}
                        {manualIds.length > 0 && <button type="button" className="min-h-11 px-3 text-left text-sm font-medium text-[#004A98] focus-visible:outline-blue-500"
                            onClick={event => addCourses(manualIds, event.detail === 0)}>
                            {manualIds.length > 1 ? `Thêm ${manualIds.length} môn theo mã` : `Thêm mã ${manualIds[0]}`}
                        </button>}
                        {!results.length && !manualIds.length && <p role="status" className="px-3 py-2 text-sm text-slate-600">
                            {enteredCodes.length === 1 && selected.has(enteredCodes[0]) ? 'Môn này đã có trong danh sách.' : 'Không tìm thấy môn phù hợp.'}
                        </p>}
                        {matches.length > visibleResultLimit && <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-600">Nhập thêm để thu hẹp kết quả.</p>}
                    </div>
                )}
            </div>
            <h3 id={headingId} className="border-t border-slate-100 pt-3 text-sm font-semibold text-slate-900">Môn đã chọn ({selectedIds.length})</h3>
            {selectedIds.length > 0 && <ul aria-label="Môn đã chọn" className="divide-y divide-slate-100">
                {selectedIds.map(id => (
                    <li key={id} className="flex min-h-11 items-center gap-1">
                        <span className="min-w-0 flex-1 wrap-break-word text-sm"><span className="font-medium text-slate-900">{id}</span>{catalog.get(id) && catalog.get(id) !== id && <span className="text-slate-600"> · {catalog.get(id)}</span>}</span>
                        {canFilterClasses(id) && <button type="button" aria-label={`Lọc lớp ${id}`} title="Lọc lớp"
                            className="flex size-11 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-blue-50 hover:text-[#004A98] focus-visible:outline-2 focus-visible:outline-blue-500 sm:size-9"
                            onClick={() => onFilterClasses(id)}>
                            <Settings aria-hidden="true" className="size-4" />
                        </button>}
                        <button type="button" aria-label={`Xóa môn ${id}`} title="Xóa môn"
                            className="flex size-11 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-blue-500 sm:size-9"
                            onClick={event => {
                                onChange(selectedIds.filter(courseId => courseId !== id));
                                if (event.detail === 0) searchRef.current?.focus({ preventScroll: true });
                            }}>
                            <X aria-hidden="true" className="size-4" />
                        </button>
                    </li>
                ))}
            </ul>}
        </section>
    );
}
