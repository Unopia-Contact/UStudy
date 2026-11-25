import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { AppSelect } from '../../../components/ui/form';

export interface ScheduleOptionItem {
  id: string | number;
  label: string;
}

interface ScheduleOptionSelectorProps {
  options: ScheduleOptionItem[];
  activeIndex: number;
  onChange: (index: number) => void;
  className?: string;
  compact?: boolean;
  selectThreshold?: number; // Kept for API compatibility, though unused now
}

export function ScheduleOptionSelector({
  options,
  activeIndex,
  onChange,
  className = '',
  compact = false,
}: ScheduleOptionSelectorProps) {
  const pagerRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const pager = pagerRef.current;
    const activeButton = activeButtonRef.current;
    if (!compact || !pager || !activeButton || pager.scrollWidth <= pager.clientWidth) return;
    const bounds = pager.getBoundingClientRect();
    const activeBounds = activeButton.getBoundingClientRect();
    const offsetLeft = activeBounds.left - bounds.left;
    const offsetRight = activeBounds.right - bounds.right;
    if (offsetLeft < 0) pager.scrollLeft += offsetLeft;
    else if (offsetRight > 0) pager.scrollLeft += offsetRight;
  }, [activeIndex, compact, options.length]);

  if (options.length < 2) return null;

  const safeActiveIndex = Math.min(Math.max(activeIndex, 0), options.length - 1);
  const PAGE_SIZE = 5;
  const currentPage = Math.floor(safeActiveIndex / PAGE_SIZE);
  const startIndex = currentPage * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, options.length);
  const visibleOptions = options.slice(startIndex, endIndex);

  const arrowClass = `flex shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-30 ${compact ? 'h-10 w-7 sm:size-8' : 'size-8'}`;

  return (
    <div ref={pagerRef} role="group" aria-label="Các phương án lịch" className={`flex min-w-0 max-w-full items-center ${compact ? 'overflow-x-auto' : 'flex-wrap gap-2'} ${className}`}>
      {!compact && <>
        <span className="shrink-0 pr-1 text-xs font-medium text-gray-500">Phương án</span>

        <AppSelect
          value={String(safeActiveIndex)}
          onChange={(value) => onChange(Number(value))}
          options={options.map((option, index) => ({ id: String(index), name: option.label }))}
          ariaLabel="Chọn phương án"
          className="min-w-28 shrink-0"
          triggerClassName="h-8 px-2 py-0 text-xs font-semibold"
        />
      </>}

      <div className={`flex items-center ${compact ? 'gap-0.5 sm:gap-1' : 'gap-1'}`}>
        <button
          type="button"
          onClick={() => onChange(Math.max(0, safeActiveIndex - PAGE_SIZE))}
          disabled={safeActiveIndex < PAGE_SIZE}
          className={arrowClass}
          aria-label="Lùi 5 phương án"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onChange(Math.max(0, safeActiveIndex - 1))}
          disabled={safeActiveIndex === 0}
          className={arrowClass}
          aria-label="Phương án trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className={`flex items-center ${compact ? 'gap-0.5 sm:gap-1' : 'gap-1'}`}>
          {visibleOptions.map((option, index) => {
            const actualIndex = startIndex + index;
            // Trim "PA " from the label if it exists, otherwise use the whole label
            const labelText = option.label.replace(/^PA\s*/i, '');
            return (
              <button
                key={option.id}
                ref={safeActiveIndex === actualIndex ? activeButtonRef : undefined}
                type="button"
                onClick={() => onChange(actualIndex)}
                aria-label={compact ? `Phương án ${labelText}` : undefined}
                aria-current={safeActiveIndex === actualIndex ? 'true' : undefined}
                className={`shrink-0 rounded-lg text-xs font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500 ${compact ? 'h-10 min-w-7 px-1 sm:h-8 sm:min-w-8' : 'h-8 px-3'} ${
                  safeActiveIndex === actualIndex
                    ? 'bg-[#004A98] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {labelText}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onChange(Math.min(options.length - 1, safeActiveIndex + 1))}
          disabled={safeActiveIndex === options.length - 1}
          className={arrowClass}
          aria-label="Phương án tiếp theo"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onChange(Math.min(options.length - 1, safeActiveIndex + PAGE_SIZE))}
          disabled={safeActiveIndex === options.length - 1}
          className={arrowClass}
          aria-label="Tiến 5 phương án"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
