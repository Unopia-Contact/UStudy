import { useId, useRef, useState, type FormEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '../../../components/ui/form/input';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/overlays/popover';

interface GroupScheduleOptionJumpProps {
  current: number;
  total: number;
  onChange: (index: number) => void;
}

export function GroupScheduleOptionJump({ current, total, onChange }: GroupScheduleOptionJumpProps) {
  const headingId = useId();
  const rangeId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  const changeOpen = (next: boolean) => {
    if (next) {
      setValue(String(current));
      setInvalid(false);
    }
    setOpen(next);
  };

  const jump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const number = Number(value.trim());
    if (!/^\d+$/.test(value.trim()) || !Number.isSafeInteger(number) || number < 1 || number > total) {
      setInvalid(true);
      inputRef.current?.focus();
      return;
    }
    onChange(number - 1);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <button type="button"
          className="ustudy-dropdown-trigger group h-11 w-fit max-w-full gap-1 px-2.5 py-0 text-xs font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:h-8">
          <span className="whitespace-nowrap">Phương án {current}/{total}</span>
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-slate-500 transition-transform group-aria-expanded:rotate-180" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} collisionPadding={12} aria-labelledby={headingId}
        className="z-[var(--ustudy-z-modal-popover)] w-64 max-w-[calc(100vw-1.5rem)] rounded-lg border-slate-200 bg-white p-3 shadow-lg"
        onOpenAutoFocus={event => {
          event.preventDefault();
          inputRef.current?.focus({ preventScroll: true });
          inputRef.current?.select();
        }}>
        <form onSubmit={jump} className="space-y-2">
          <p id={headingId} className="text-sm font-semibold text-slate-900">Đi tới phương án</p>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              enterKeyHint="go"
              autoComplete="off"
              aria-label="Số phương án"
              aria-describedby={rangeId}
              aria-invalid={invalid || undefined}
              value={value}
              onChange={event => { setValue(event.target.value); setInvalid(false); }}
              className="h-11 flex-1 bg-white focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-200 sm:h-9"
            />
            <button type="submit" className="ustudy-button-primary h-11 shrink-0 px-3 py-0 text-xs sm:h-9">Đi tới</button>
          </div>
          <p id={rangeId} role={invalid ? 'alert' : undefined} className={invalid ? 'text-xs text-red-700' : 'text-xs text-slate-600'}>
            Nhập từ 1 đến {total}
          </p>
        </form>
      </PopoverContent>
    </Popover>
  );
}
