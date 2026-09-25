import { MapPin } from 'lucide-react';
import { getCampusDefinition, type CampusId } from '../../domain/campus';

export function getCompactCampusLabel(campusId?: CampusId): string {
  return campusId === 'cho-quan' ? 'CS1' : 'CS2';
}

interface CampusLabelProps {
  campusId?: CampusId;
  isFallback?: boolean;
  className?: string;
}

export function CampusLabel({
  campusId = 'dong-hoa',
  isFallback = false,
  className = '',
}: CampusLabelProps) {
  const campus = getCampusDefinition(campusId);
  const fallbackLabel = isFallback ? ' (mặc định)' : '';

  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1 ${className}`}
      title={`${campus.name}${fallbackLabel}`}
      aria-label={`Cơ sở học: ${campus.name}${fallbackLabel}`}
    >
      <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{campus.name}{fallbackLabel}</span>
    </span>
  );
}
