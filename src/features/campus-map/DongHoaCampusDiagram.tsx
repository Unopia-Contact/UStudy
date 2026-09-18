import type { BuildingRuntime } from '../../domain/campus-map';
import { MapViewport } from './MapViewport';

// Geometry of the CS2 overview only. Building, floor and room information lives in campuses.ts.
const shapes = [
  { key: 'a', label: 'A', x: 62, y: 118, width: 76, height: 232 },
  { key: 'b', label: 'B', x: 142, y: 154, width: 156, height: 96 },
  { key: 'c', label: 'C', x: 324, y: 134, width: 72, height: 318 },
  { key: 'd', label: 'D', x: 430, y: 134, width: 72, height: 318 },
  { key: 'e', label: 'E', x: 540, y: 134, width: 72, height: 318 },
  { key: 'f', label: 'F', x: 780, y: 154, width: 72, height: 298 },
  { key: 'g', label: 'G', x: 878, y: 154, width: 72, height: 298 },
  { key: 'ndh', label: 'NĐH', x: 650, y: 512, width: 92, height: 142 },
  { key: 'b42', label: 'B4.2', x: 540, y: 33, width: 76, height: 76 },
] as const;

export function DongHoaCampusDiagram({ buildings, selectedId, onSelect }: {
  buildings: BuildingRuntime[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const byShape = new Map(buildings.map((building) => [building.id.toLowerCase(), building]));

  return <MapViewport width={1000} height={720} label="Sơ đồ khuôn viên cơ sở Đông Hòa" resetKey="dong-hoa-campus">
    <rect x="24" y="24" width="952" height="654" rx="28" fill="#f4f7fb" stroke="#d6e0ea" strokeWidth="2" />
    <path d="M78 250 H310 V336 H465 V250 H792 V530 H670" fill="none" stroke="#d8e2ec" strokeWidth="38" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M180 565 H780" fill="none" stroke="#d9e2ec" strokeWidth="26" strokeLinecap="round" />
    <path d="M70 278 H284 V356 C260 380 230 408 214 448 H72 Z" fill="#dff3e4" stroke="#b8dec4" strokeWidth="2" />
    <rect x="328" y="486" width="190" height="70" rx="26" fill="#dff3e4" stroke="#b8dec4" strokeWidth="2" />
    <path d="M642 122 H790 V498 H626 C648 430 660 356 652 284 Z" fill="#dff3e4" stroke="#b8dec4" strokeWidth="2" />
    <path d="M694 548 H900 V638 H724 C710 610 700 584 694 548 Z" fill="#dff3e4" stroke="#b8dec4" strokeWidth="2" />
    <path d="M680 252 C708 214 754 234 760 286 C768 342 742 404 704 410 C668 416 652 376 660 326 C664 296 666 270 680 252 Z" fill="#8ed8ff" stroke="#2b92d0" strokeWidth="3" />
    <text x="710" y="332" textAnchor="middle" fill="#0f4f76" fontSize="12" fontWeight="700">HỒ NƯỚC</text>
    <rect x="648" y="124" width="128" height="62" rx="16" fill="white" stroke="#bdd0e1" strokeWidth="2" />
    <text x="712" y="160" textAnchor="middle" fill="#004a98" fontSize="13" fontWeight="700">NHÀ THỂ DỤC</text>
    <rect x="246" y="556" width="232" height="78" rx="18" fill="#fff" stroke="#aebdca" strokeWidth="2" />
    <text x="362" y="603" textAnchor="middle" fill="#0f172a" fontSize="22" fontWeight="700">NHÀ XE</text>
    <rect x="782" y="640" width="160" height="34" rx="12" fill="white" stroke="#bdd0e1" strokeWidth="2" />
    <text x="862" y="662" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="700">CỔNG CHÍNH</text>
    {shapes.map((shape) => {
      const building = byShape.get(shape.key);
      const active = building?.fullId === selectedId;
      return <g key={shape.key} role={building ? 'button' : undefined} tabIndex={building ? 0 : undefined}
        aria-label={building ? `Chọn ${building.name}` : undefined}
        className={building ? 'cursor-pointer outline-none' : undefined}
        onClick={building ? () => onSelect(building.fullId) : undefined}
        onKeyDown={building ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(building.fullId); } } : undefined}>
        <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx="18"
          fill={active ? '#004a98' : '#fff'} stroke={active ? '#003a78' : '#a9bfd3'} strokeWidth={active ? 4 : 2} />
        <text x={shape.x + shape.width / 2} y={shape.y + shape.height / 2} textAnchor="middle" dominantBaseline="middle"
          fill={active ? '#fff' : '#0f172a'} fontSize={shape.key === 'ndh' ? 20 : 34} fontWeight="700" pointerEvents="none">{shape.label}</text>
      </g>;
    })}
  </MapViewport>;
}
