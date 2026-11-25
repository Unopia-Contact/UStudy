import { ChevronDown, Eye } from 'lucide-react';
import type { GroupScheduleResultViewMode } from './GroupScheduleResult';
import { AppSelect } from '../../../components/ui/form/app-select';

type GroupScheduleDisplayMode = 'calendar' | GroupScheduleResultViewMode;

interface GroupScheduleResultViewTabsProps {
  value: GroupScheduleDisplayMode;
  onChange: (value: GroupScheduleDisplayMode) => void;
}

const views = [
  { id: 'calendar', name: 'Tổng quát' },
  { id: 'course', name: 'Theo môn' },
  { id: 'member', name: 'Theo thành viên' },
];

export function GroupScheduleResultViewTabs({ value, onChange }: GroupScheduleResultViewTabsProps) {
  const currentView = views.find(view => view.id === value)?.name;
  return (
    <AppSelect
      ariaLabel="Cách xem"
      value={value}
      options={views}
      onChange={view => onChange(view as GroupScheduleDisplayMode)}
      className="shrink-0"
      triggerClassName="group h-11 gap-1.5 px-2.5 py-0 text-xs font-medium sm:h-8"
      menuClassName="right-0 min-w-40"
      triggerContent={<>
        <Eye aria-hidden="true" className="size-4 shrink-0 text-slate-500" />
        <span className="whitespace-nowrap"><span className="hidden text-slate-500 sm:inline">Cách xem · </span>{currentView}</span>
        <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-slate-500 transition-transform group-aria-expanded:rotate-180" />
      </>}
    />
  );
}
