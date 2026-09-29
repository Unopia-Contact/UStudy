import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { X } from 'lucide-react';

import { cn } from './utils';

type CloseButtonTone = 'surface' | 'inverse';

interface CloseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  tone?: CloseButtonTone;
  iconClassName?: string;
}

const toneClasses: Record<CloseButtonTone, string> = {
  surface:
    'border-blue-200 bg-blue-50/95 text-[#004A98] shadow-sm hover:border-blue-300 hover:bg-blue-100 hover:text-[#003A78] hover:shadow-md',
  inverse:
    'border-white/25 bg-white/10 text-white shadow-sm backdrop-blur-sm hover:border-white/45 hover:bg-white/20 hover:shadow-md',
};

/** Shared close control for dialogs, sheets and floating panels. */
export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(function CloseButton(
  {
    label = 'Đóng',
    tone = 'surface',
    className,
    iconClassName,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'group inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border outline-none',
        'transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-out',
        'hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
        'focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'motion-reduce:transform-none motion-reduce:transition-none',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      <X
        aria-hidden="true"
        strokeWidth={2.25}
        className={cn(
          'size-5 transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:scale-110 group-focus-visible:rotate-90 group-active:rotate-45',
          'motion-reduce:transform-none motion-reduce:transition-none',
          iconClassName,
        )}
      />
    </button>
  );
});
