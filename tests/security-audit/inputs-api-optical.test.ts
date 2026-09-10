import { gzipSync } from 'node:zlib';
import { expect, it, vi } from 'vitest';
import handler from '../../api/chat';
import { isPortalSyncPacket, isSupportedPortalOrigin } from '../../src/portal-sync/protocol';
import { normalizeStorageBackupData, isSystemBackupData } from '../../src/features/settings/services/system-backup';
import { buildOpticalSyncPayload } from '../../src/features/optical-sync/services/optical-sync-payload';
import { decodeOpticalText, encodeOpticalText } from '../../src/features/optical-sync/services/optical-payload';
import { packFile, unpackFile, verifyFile, parseFrame } from '../../src/features/optical-sync/vendor/decimen/protocol';
import { populateSecureCache } from '../../src/helpers/localStorage/save';

it.each([
  { raw: { grades: [null] } },
  { raw: { grades: [42], registrations: 'wrong-type' } },
  { protocolVersion: 'unsupported', raw: { grades: [] } },
])('[FINDING SEC-10] malformed inner packet passes outer guard %#', (packet) => {
  expect(isPortalSyncPacket(packet)).toBe(true);
});

it('[FINDING SEC-10] managed backup value has no domain schema check', () => {
  const data = { raw_student_db: 'malformed-domain-data' };
  expect(isSystemBackupData(data)).toBe(true);
  expect(normalizeStorageBackupData(data)).toEqual(data);
});

it('[CONTROL] storage allowlist drops arbitrary and prototype-looking top-level keys', () => {
  const parsed = JSON.parse('{"__proto__":{"auditPolluted":true},"constructor":{},"unknown":"x","selected_cohort_id":"k24"}');
  expect(normalizeStorageBackupData(parsed)).toEqual({ selected_cohort_id: 'k24' });
  expect(({} as Record<string, unknown>).auditPolluted).toBeUndefined();
});

it.each([
  'https://new-portal1.hcmus.edu.vn.evil.invalid',
  'http://new-portal1.hcmus.edu.vn',
  'https://new-portal1.hcmus.edu.vn@evil.invalid',
  'null', 'https://evil.invalid',
])('[CONTROL] local origin parser rejects %s without making a request', (origin) => {
  expect(isSupportedPortalOrigin(origin)).toBe(false);
});

function responseMock() {
  const response = { statusCode: 200, body: null as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  };
  return response;
}
function mockProvider() {
  vi.stubEnv('GEMINI_API_KEY', 'SYNTHETIC_NOT_A_REAL_KEY');
  vi.stubEnv('GROQ_API_KEY', '');
  vi.stubEnv('VITE_GROQ_API_KEY', '');
  const provider = vi.fn(async () => new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: 'synthetic response' }] } }],
  }), { headers: { 'Content-Type': 'application/json' } }));
  vi.stubGlobal('fetch', provider);
  return provider;
}

it('[FINDING SEC-07] anonymous burst reaches only the mocked AI provider eight times', async () => {
  const provider = mockProvider();
  for (let i = 0; i < 8; i++) {
    const res = responseMock();
    await handler({ method: 'POST', headers: {}, body: { newMessage: 'synthetic' } } as any, res as any);
    expect(res.statusCode).toBe(200);
  }
  expect(provider).toHaveBeenCalledTimes(8);
});

it('[FINDING SEC-07] non-string message reaches mocked upstream', async () => {
  const provider = mockProvider();
  const res = responseMock();
  await handler({ method: 'POST', headers: {}, body: { newMessage: { audit: true } } } as any, res as any);
  expect(provider).toHaveBeenCalledTimes(1);
});

it('[CONTROL] GET API call never reaches even the mocked provider', async () => {
  const provider = mockProvider();
  const res = responseMock();
  await handler({ method: 'GET' } as any, res as any);
  expect(res.statusCode).toBe(405);
  expect(provider).not.toHaveBeenCalled();
});

it('[FINDING SEC-09] optical container exposes synthetic private data without any secret', async () => {
  populateSecureCache('raw_student_db', { name: 'SYNTHETIC_OPTICAL_MARKER', grades: [] });
  const json = buildOpticalSyncPayload(['raw_student_db'], { raw_student_db: 'synthetic-ciphertext-placeholder' });
  const encoded = await encodeOpticalText(json);
  const packed = await packFile('audit.uos', 'application/vnd.ustudy.optical-sync', encoded.bytes);
  const file = await unpackFile(packed.container);
  expect(await verifyFile(file)).toBe(true);
  expect(await decodeOpticalText(file.bytes)).toContain('SYNTHETIC_OPTICAL_MARKER');
});

it('[CONTROL] altered optical file hash is rejected', async () => {
  const packed = await packFile('audit.uos', 'application/vnd.ustudy.optical-sync', new TextEncoder().encode('synthetic'));
  packed.container[17] ^= 1;
  expect(await verifyFile(await unpackFile(packed.container))).toBe(false);
});

it('[CONTROL] decompression over 16 MiB is rejected using a bounded 17 MiB fixture', async () => {
  const zipped = gzipSync(new Uint8Array(17 * 1024 * 1024));
  const container = new Uint8Array(9 + zipped.length);
  container.set([0x55, 0x4f, 0x53, 0x32, 1]);
  new DataView(container.buffer).setUint32(5, 1, true);
  container.set(zipped, 9);
  await expect(decodeOpticalText(container)).rejects.toThrow();
});

it('[CONTROL] 256 bounded deterministic malformed frames do not throw', () => {
  let state = 42;
  for (let i = 0; i < 256; i++) {
    const frame = Uint8Array.from({ length: i % 96 }, () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state & 255;
    });
    expect(() => parseFrame(frame)).not.toThrow();
  }
});
