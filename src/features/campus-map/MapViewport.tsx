import { Maximize2, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent, type ReactNode, type WheelEvent } from 'react';
import './campus-map.css';

export interface Box { x: number; y: number; width: number; height: number }

export function zoomMapBox(box: Box, factor: number, anchorX: number, anchorY: number, base: Box): Box {
  const width = Math.min(base.width, Math.max(base.width / 5, box.width * factor));
  const height = width * base.height / base.width;
  const ratioX = (anchorX - box.x) / box.width;
  const ratioY = (anchorY - box.y) / box.height;
  return {
    x: Math.max(base.x, Math.min(base.x + base.width - width, anchorX - ratioX * width)),
    y: Math.max(base.y, Math.min(base.y + base.height - height, anchorY - ratioY * height)),
    width, height,
  };
}

export function MapViewport({ width, height, label, resetKey, className = '', children }: {
  width: number;
  height: number;
  label: string;
  resetKey: string;
  className?: string;
  children: ReactNode;
}) {
  const base = { x: 0, y: 0, width, height };
  const [box, setBox] = useState<Box>(base);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);

  useEffect(() => { setBox({ x: 0, y: 0, width, height }); }, [width, height, resetKey]);

  function zoom(factor: number, x = box.x + box.width / 2, y = box.y + box.height / 2) {
    setBox((current) => zoomMapBox(current, factor, x, y, base));
  }

  function onWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = box.x + (event.clientX - rect.left) / rect.width * box.width;
    const y = box.y + (event.clientY - rect.top) / rect.height * box.height;
    zoom(event.deltaY < 0 ? 0.85 : 1.15, x, y);
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!pointer.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - pointer.current.x;
    const dy = event.clientY - pointer.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragged.current = true;
    setBox((current) => ({
      ...current,
      x: Math.max(0, Math.min(width - current.width, current.x - dx / rect.width * current.width)),
      y: Math.max(0, Math.min(height - current.height, current.y - dy / rect.height * current.height)),
    }));
    pointer.current = { x: event.clientX, y: event.clientY };
  }

  return <div className={`relative min-h-[340px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:min-h-[480px] ${className}`}>
    <svg viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full touch-none cursor-grab active:cursor-grabbing"
      role="img" aria-label={label}
      onWheel={onWheel}
      onPointerDown={(event) => { pointer.current = { x: event.clientX, y: event.clientY }; dragged.current = false; }}
      onPointerMove={onPointerMove}
      onPointerUp={() => { pointer.current = null; window.setTimeout(() => { dragged.current = false; }, 0); }}
      onPointerCancel={() => { pointer.current = null; dragged.current = false; }}
      onPointerLeave={() => { pointer.current = null; }}
      onClickCapture={(event) => { if (dragged.current) { event.stopPropagation(); dragged.current = false; } }}>
      {children}
    </svg>
    <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      <button type="button" onClick={() => zoom(0.8)} aria-label="Phóng to bản đồ" className="ustudy-map-control"><Plus className="h-4 w-4" /></button>
      <button type="button" onClick={() => zoom(1.25)} aria-label="Thu nhỏ bản đồ" className="ustudy-map-control"><Minus className="h-4 w-4" /></button>
      <button type="button" onClick={() => setBox(base)} aria-label="Vừa bản đồ vào khung" className="ustudy-map-control"><Maximize2 className="h-4 w-4" /></button>
    </div>
  </div>;
}
