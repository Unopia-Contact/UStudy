import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export interface AppSelectOption {
  id: string;
  name: string;
  disabled?: boolean;
}

interface AppSelectProps {
  label?: string;
  value: string;
  options: AppSelectOption[];
  onChange: (value: string) => void;
  subLabel?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
}

/** Dropdown custom chuẩn của UStudy, dùng cho form và toolbar. */
export function AppSelect({
  label,
  value,
  options,
  onChange,
  subLabel,
  disabled = false,
  ariaLabel,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  optionClassName = '',
}: AppSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.id === value);
  const isDisabled = disabled || options.every((option) => option.disabled);

  const enabledOptions = () => Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)') ?? []);

  const openFromKeyboard = (direction: 'first' | 'last') => {
    if (isDisabled) return;
    setIsOpen(true);
    requestAnimationFrame(() => {
      const enabled = enabledOptions();
      const selectedIndex = enabled.findIndex((option) => option.dataset.value === value);
      enabled[selectedIndex >= 0 ? selectedIndex : direction === 'first' ? 0 : enabled.length - 1]?.focus();
    });
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key === 'Tab') {
      setIsOpen(false);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const enabled = enabledOptions();
    if (enabled.length === 0) return;
    const currentIndex = enabled.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1
      : event.key === 'ArrowDown' ? (currentIndex + 1) % enabled.length
      : (currentIndex - 1 + enabled.length) % enabled.length;
    enabled[nextIndex]?.focus();
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (isDisabled) setIsOpen(false);
  }, [isDisabled]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <span className="mb-2 block text-sm font-medium text-gray-700">
          {label} {subLabel && <span className="font-normal text-gray-400">{subLabel}</span>}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        disabled={isDisabled}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openFromKeyboard(event.key === 'ArrowDown' ? 'first' : 'last');
          } else if (event.key === 'Escape' && isOpen) {
            event.preventDefault();
            setIsOpen(false);
          } else if (event.key === 'Tab' && isOpen) {
            setIsOpen(false);
          }
        }}
        className={`ustudy-dropdown-trigger ${triggerClassName} ${
          isDisabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-200 hover:bg-gray-50'
            : isOpen ? 'ustudy-dropdown-trigger-open' : ''
        }`}
        aria-label={ariaLabel ?? label ?? 'Chọn mục'}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? menuId : undefined}
      >
        <span className="min-w-0 flex-1 truncate">{selectedOption?.name ?? 'Chọn...'}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div ref={menuRef} id={menuId} className={`ustudy-dropdown-menu border border-gray-400 ${menuClassName}`} role="listbox" aria-label={ariaLabel ?? label ?? 'Chọn mục'} onKeyDown={handleMenuKeyDown}>
          {options.map((option) => {
            const isSelected = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-value={option.id}
                disabled={option.disabled}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                className={`ustudy-dropdown-option ${optionClassName} ${isSelected ? 'ustudy-dropdown-option-active' : ''} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
