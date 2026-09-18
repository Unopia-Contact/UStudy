import { MapViewport } from './MapViewport';
import { CAMPUS_BUILDINGS, type BuildingId, type CampusFloor, type FloorPlanElement } from './campus-data';

const LEGACY_BUILDINGS: Array<{ id: BuildingId; x: number; y: number; width: number; height: number; label: string }> = [
  { id: 'A', x: 62, y: 118, width: 76, height: 232, label: 'A' },
  { id: 'B', x: 142, y: 154, width: 156, height: 96, label: 'B' },
  { id: 'C', x: 324, y: 134, width: 72, height: 318, label: 'C' },
  { id: 'D', x: 430, y: 134, width: 72, height: 318, label: 'D' },
  { id: 'E', x: 540, y: 134, width: 72, height: 318, label: 'E' },
  { id: 'F', x: 780, y: 154, width: 72, height: 298, label: 'F' },
  { id: 'G', x: 878, y: 154, width: 72, height: 298, label: 'G' },
  { id: 'NDH', x: 650, y: 512, width: 92, height: 142, label: 'NĐH' },
];

export const LEGACY_CAMPUS_BUILDINGS = LEGACY_BUILDINGS.map((shape) => ({
  ...shape, building: CAMPUS_BUILDINGS.find((item) => item.id === shape.id)!,
}));

export function Campus2Diagram({ selected, onSelect }: {
  selected?: BuildingId;
  onSelect: (id: BuildingId) => void;
}) {
  return <MapViewport width={1000} height={720} label="Sơ đồ khuôn viên cơ sở Đông Hòa" resetKey="dong-hoa-campus">
    <rect x="24" y="24" width="952" height="654" rx="28" fill="#f4f7fb" stroke="#d6e0ea" strokeWidth="2" />
    <path d="M78 250 H310 V336 H465 V250 H792 V530 H670" fill="none" stroke="#d8e2ec" strokeWidth="38" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M180 565 H780" fill="none" stroke="#d9e2ec" strokeWidth="26" strokeLinecap="round" />
    <path d="M70 278 H284 V356 C260 380 230 408 214 448 H72 Z" fill="#dff3e4" stroke="#b8dec4" strokeWidth="2" />
    <rect x="328" y="486" width="190" height="70" rx="26" fill="#dff3e4" stroke="#b8dec4" strokeWidth="2" />
    <path d="M642 122 H790 V498 H626 C648 430 660 356 652 284 Z" fill="#dff3e4" stroke="#b8dec4" strokeWidth="2" />
    <path d="M694 548 H900 V638 H724 C710 610 700 584 694 548 Z" fill="#dff3e4" stroke="#b8dec4" strokeWidth="2" />
    <path d="M680 252 C708 214 754 234 760 286 C768 342 742 404 704 410 C668 416 652 376 660 326 C664 296 666 270 680 252 Z"
      fill="#8ed8ff" stroke="#2b92d0" strokeWidth="3" />
    <text x="710" y="332" textAnchor="middle" fill="#0f4f76" fontSize="12" fontWeight="700">HỒ NƯỚC</text>
    <rect x="648" y="124" width="128" height="62" rx="16" fill="white" stroke="#bdd0e1" strokeWidth="2" />
    <text x="712" y="160" textAnchor="middle" fill="#004a98" fontSize="13" fontWeight="700">NHÀ THỂ DỤC</text>
    <rect x="246" y="556" width="232" height="78" rx="18" fill="#fff" stroke="#aebdca" strokeWidth="2" />
    <text x="362" y="603" textAnchor="middle" fill="#0f172a" fontSize="22" fontWeight="700">NHÀ XE</text>
    <rect x="782" y="640" width="160" height="34" rx="12" fill="white" stroke="#bdd0e1" strokeWidth="2" />
    <text x="862" y="662" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="700">CỔNG CHÍNH</text>
    {LEGACY_BUILDINGS.map((shape) => {
      const active = selected === shape.id;
      return <g key={shape.id} role="button" tabIndex={0} aria-label={`Chọn ${CAMPUS_BUILDINGS.find((item) => item.id === shape.id)?.name ?? shape.label}`}
        className="cursor-pointer outline-none" onClick={() => onSelect(shape.id)}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(shape.id); } }}>
        <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx="18"
          fill={active ? '#004a98' : '#fff'} stroke={active ? '#003a78' : '#a9bfd3'} strokeWidth={active ? 4 : 2} />
        <text x={shape.x + shape.width / 2} y={shape.y + shape.height / 2} textAnchor="middle" dominantBaseline="middle"
          fill={active ? '#fff' : '#0f172a'} fontSize={shape.id === 'NDH' ? 20 : 34} fontWeight="700" pointerEvents="none">{shape.label}</text>
      </g>;
    })}
  </MapViewport>;
}

function PlanShape({ shape, selected, onSelect }: {
  shape: FloorPlanElement;
  selected: boolean;
  onSelect: (code: string) => void;
}) {
  if (shape.type === 'path') return <path d={shape.d} fill={shape.fill ?? 'none'} fillRule={shape.fillRule} stroke={shape.stroke ?? '#94a3b8'} strokeWidth={shape.strokeWidth ?? 1} />;
  if (shape.type === 'label') return <text x={shape.x} y={shape.y} textAnchor="middle" fill={shape.color ?? '#475569'} fontSize={shape.size ?? 14}>{shape.text}</text>;
  const isRoom = shape.type === 'room';
  return <g role={isRoom ? 'button' : undefined} tabIndex={isRoom ? 0 : undefined}
    aria-label={isRoom ? `Chọn ${shape.label ?? shape.code}` : undefined}
    onClick={isRoom ? () => onSelect(shape.code) : undefined}
    onKeyDown={isRoom ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(shape.code); } } : undefined}
    className={isRoom ? 'cursor-pointer outline-none' : undefined}>
    <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx="4"
      fill={selected ? '#dbeafe' : shape.fill ?? (isRoom ? '#eff6ff' : '#f1f5f9')}
      stroke={selected ? '#004a98' : '#94a3b8'} strokeWidth={selected ? 4 : 1} />
    <text x={shape.x + shape.width / 2} y={shape.y + shape.height / 2} dominantBaseline="middle"
      textAnchor="middle" fontSize="13" fontWeight="600" fill="#1e3a5f" pointerEvents="none">
      {isRoom ? shape.label ?? shape.code : shape.label}
    </text>
  </g>;
}

export function LegacyFloorDiagram({ buildingId, floor, selectedRoom, onSelectRoom }: {
  buildingId: BuildingId;
  floor: CampusFloor;
  selectedRoom?: string;
  onSelectRoom: (code: string) => void;
}) {
  const plan = floor.plan;
  if (!plan?.elements.length) return <div className="flex min-h-[340px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
    Tầng này chưa có bản vẽ vị trí phòng trong sơ đồ cũ.
  </div>;
  return <MapViewport width={plan.width} height={plan.height} resetKey={`${buildingId}-${floor.number}`}
    label={`Sơ đồ cũ tòa ${buildingId}, tầng ${floor.number}`}>
    <rect width={plan.width} height={plan.height} fill="white" />
    {plan.elements.map((shape, index) => <PlanShape key={`${shape.id}-${index}`} shape={shape}
      selected={shape.type === 'room' && shape.code === selectedRoom} onSelect={onSelectRoom} />)}
  </MapViewport>;
}
