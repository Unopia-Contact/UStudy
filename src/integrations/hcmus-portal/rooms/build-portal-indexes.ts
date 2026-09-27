import type { PortalRoomBinding, PortalRoomIndexes } from './types';

export function compilePortalCode(binding: PortalRoomBinding): string {
  return binding.exactCodeOverride ??
    `${binding.components.campusCode}${binding.components.buildingCode ?? ''}${binding.components.roomCode}`;
}

export function createEquivalentPortalKey(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').replace(/Đ/g, 'D')
    .toUpperCase().replace(/[‐‑‒–—]/g, '-').replace(/\s+/g, '').replace(/NDH\./g, 'NDH');
}

function add(index: Map<string, string[]>, key: string, roomId: string): void {
  const ids = index.get(key) ?? [];
  if (!ids.includes(roomId)) ids.push(roomId);
  index.set(key, ids);
}

export function buildPortalRoomIndexes(bindings: PortalRoomBinding[]): PortalRoomIndexes {
  const exact = new Map<string, string[]>();
  const equivalent = new Map<string, string[]>();
  for (const binding of bindings) {
    const code = compilePortalCode(binding);
    add(exact, code, binding.roomId);
    add(equivalent, createEquivalentPortalKey(code), binding.roomId);
  }
  return { exact, equivalent };
}
