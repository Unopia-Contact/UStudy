import { useState } from 'react';
import { BookOpen, DollarSign, RotateCw, TrendingUp } from 'lucide-react';
import { ACADEMIC_RULES } from '../../../constants';

interface GpaWidgetProps {
  currentGPA: number;
  currentGPA4: number;
  classification: string;
  letterGrade: string;
}

interface GpaFaceProps {
  value: number;
  maximum: number;
  subtitle: string;
  footerLabel: string;
  footerValue: string;
  accentColor: string;
  badgeClassName: string;
  hint: string;
  className?: string;
}

function GpaFace({
  value,
  maximum,
  subtitle,
  footerLabel,
  footerValue,
  accentColor,
  badgeClassName,
  hint,
  className = '',
}: GpaFaceProps) {
  const percentage = Math.min(Math.max((value / maximum) * 100, 0), 100);
  const circumference = 2 * Math.PI * 70;

  return (
    <span className={`ustudy-card ustudy-card-padding absolute inset-0 block h-full overflow-hidden [backface-visibility:hidden] ${className}`}>
      <span className="ustudy-card-header justify-between">
        <span className="flex min-w-0 items-center gap-2 md:gap-3">
          <span className={`ustudy-icon-badge ${badgeClassName}`}>
            <TrendingUp className="h-4 w-4 text-white md:h-5 md:w-5" />
          </span>
          <span className="min-w-0">
            <span className="ustudy-card-title block">GPA hiện tại</span>
            <span className="ustudy-card-subtitle block">{subtitle}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">
          <RotateCw className="h-3 w-3" aria-hidden="true" />
          {hint}
        </span>
      </span>

      <span className="mb-2 flex items-center justify-center md:mb-4">
        <span className="relative block h-40 w-40 scale-75 md:scale-100">
          <svg className="h-full w-full -rotate-90 transform" aria-hidden="true">
            <circle cx="80" cy="80" r="70" stroke="#E5E7EB" strokeWidth="12" fill="none" />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={accentColor}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - percentage / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <strong className="text-2xl font-bold tabular-nums md:text-3xl" style={{ color: accentColor }}>
              {value.toFixed(ACADEMIC_RULES.GPA_POINT_DECIMAL)}
            </strong>
            <span className="text-xs text-gray-500 md:text-sm">
              / {maximum.toFixed(ACADEMIC_RULES.GPA_POINT_DECIMAL)}
            </span>
          </span>
        </span>
      </span>

      <span className="block min-w-0 border-t border-gray-100 pt-3 md:pt-4">
        <span className="ustudy-stat-row">
          <span className="ustudy-stat-label">{footerLabel}</span>
          <strong className="font-semibold" style={{ color: accentColor }}>{footerValue}</strong>
        </span>
      </span>
    </span>
  );
}

export function GpaWidget({ currentGPA, currentGPA4, classification, letterGrade }: GpaWidgetProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <section className="group relative h-full min-h-[300px] [perspective:1200px] md:min-h-[328px]">
      <button
        type="button"
        className="block h-full w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004A98] focus-visible:ring-offset-2"
        aria-label={`GPA hiện tại, ${isFlipped ? 'thang điểm 4' : 'thang điểm 10'}. Nhấn để đổi thang điểm.`}
        aria-pressed={isFlipped}
        onClick={(event) => {
          const isKeyboardAction = event.detail === 0;
          const isTouchDevice = !window.matchMedia('(hover: hover)').matches;
          if (isKeyboardAction || isTouchDevice) {
            setIsFlipped((current) => !current);
          }
        }}
      >
        <span
          className={`relative block h-full w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none group-hover:[transform:rotateY(180deg)] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          <GpaFace
            value={currentGPA}
            maximum={ACADEMIC_RULES.MAX_GPA}
            subtitle="Thang điểm 10"
            footerLabel="Xếp loại"
            footerValue={classification}
            accentColor="#004A98"
            badgeClassName="ustudy-icon-primary"
            hint="Xem hệ 4"
          />
          <GpaFace
            value={currentGPA4}
            maximum={4}
            subtitle="Thang điểm 4"
            footerLabel="Điểm chữ"
            footerValue={letterGrade}
            accentColor="#4F46E5"
            badgeClassName="text-indigo-600"
            hint="Xem hệ 10"
            className="[transform:rotateY(180deg)]"
          />
        </span>
      </button>
    </section>
  );
}

interface CreditsWidgetProps {
  accumulatedCredits: number;
  totalCredits: number;
}

export function CreditsWidget({ accumulatedCredits, totalCredits }: CreditsWidgetProps) {
  const percentage = Math.min((accumulatedCredits / Math.max(totalCredits, 1)) * 100, 100);

  return (
    <section className="ustudy-card ustudy-card-padding h-full">
      <div className="ustudy-card-header">
        <div className="ustudy-icon-badge ustudy-icon-success">
          <BookOpen className="h-4 w-4 text-white md:h-5 md:w-5" />
        </div>
        <div>
          <h3 className="ustudy-card-title">Tín chỉ tích lũy</h3>
          <p className="ustudy-card-subtitle">Tiến độ hoàn thành</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-end justify-between gap-2">
          <span className="text-2xl font-bold text-gray-900 md:text-3xl">{accumulatedCredits}</span>
          <span className="text-xs text-gray-500 md:text-sm">/ {totalCredits} tín chỉ</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 md:h-4">
          <div
            className="flex h-3 items-center justify-end rounded-full bg-green-500 pr-2 transition-all duration-1000 ease-out md:h-4"
            style={{ width: `${percentage}%` }}
          >
            <span className="text-[9px] font-semibold text-white md:text-[10px]">{percentage.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-3 md:space-y-3 md:pt-4">
        <div className="ustudy-stat-row">
          <span className="ustudy-stat-label">Đã tích lũy</span>
          <span className="font-semibold text-green-600">{accumulatedCredits} tín chỉ</span>
        </div>
        <div className="ustudy-stat-row">
          <span className="ustudy-stat-label">Còn lại</span>
          <span className="font-semibold text-orange-600">{Math.max(0, totalCredits - accumulatedCredits)} tín chỉ</span>
        </div>
      </div>
    </section>
  );
}

interface TuitionWidgetProps {
  amountLabel: string;
  dueDate: string;
}

export function TuitionWidget({ amountLabel, dueDate }: TuitionWidgetProps) {
  return (
    <section className="h-full rounded-xl bg-gradient-to-br from-[#004A98] to-[#0066CC] p-4 text-white shadow-lg md:p-6">
      <div className="ustudy-card-header">
        <div className="ustudy-icon-badge bg-white/20 text-white">
          <DollarSign className="h-4 w-4 text-white md:h-5 md:w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white md:text-base">Học phí học kỳ</h3>
          <p className="text-xs text-blue-100 md:text-sm">Dự kiến</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs text-blue-100 md:text-sm">Tổng học phí dự kiến</p>
        <p className="break-words text-2xl font-bold text-white md:text-3xl">{amountLabel}</p>
      </div>

      <div className="border-t border-white/20 pt-3 md:pt-4">
        <div className="ustudy-stat-row">
          <span className="text-blue-100">Hạn đóng học phí</span>
          <span className="font-semibold text-white">{dueDate}</span>
        </div>
      </div>
    </section>
  );
}
