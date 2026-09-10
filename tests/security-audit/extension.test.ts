import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { expect, it } from 'vitest';

const config = JSON.parse(readFileSync('src/portal-sync/config.json', 'utf8'));
const background = readFileSync('extension/background.js', 'utf8');
const extensionId = 'synthetic-extension';
const noop = () => undefined;

function policy() {
  const context = vm.createContext({
    USTUDY_EXTENSION_CONFIG: config, importScripts: noop, URL, console,
    fetch: () => { throw new Error('AUDIT_NETWORK_DISABLED'); },
    chrome: {
      runtime: { id: extensionId, getURL: (path: string) => `chrome-extension://${extensionId}/${path}`,
        onInstalled: { addListener: noop }, onStartup: { addListener: noop }, onMessage: { addListener: noop } },
      tabs: { query: async () => [], onRemoved: { addListener: noop } },
    },
  });
  vm.runInContext(background, context);
  return vm.runInContext('assertAuthorizedSender', context) as (message: unknown, sender: unknown) => void;
}

const actions = ['GET_STATE', 'SAVE_SETTINGS', 'OPEN_PORTAL', 'GET_PENDING_IMPORT', 'ACK_PENDING_IMPORT', 'SYNC_COMPLETE'];
const sources = [
  { name: 'foreign-origin', id: extensionId, url: 'https://evil.invalid/', allowed: [] },
  { name: 'lookalike-origin', id: extensionId, url: `${config.appOrigins[0]}.evil.invalid/`, allowed: [] },
  { name: 'wrong-extension-id', id: 'other-extension', url: `${config.appOrigins[0]}/`, allowed: [] },
  ...config.appOrigins.map((origin: string, index: number) => ({
    name: `app-${index}`,
    id: extensionId,
    url: `${origin}/`,
    allowed: actions.filter((a) => a !== 'SYNC_COMPLETE'),
  })),
  { name: 'extension-popup', id: extensionId, url: `chrome-extension://${extensionId}/popup.html`, allowed: ['GET_STATE', 'SAVE_SETTINGS', 'OPEN_PORTAL'] },
];

it.each(sources.flatMap((source) => actions.map((action) => ({ source, action }))))(
  '[CONTROL] extension policy $source.name / $action', ({ source, action }) => {
    const invoke = () => policy()({ action }, { id: source.id, url: source.url });
    if (source.allowed.includes(action)) expect(invoke).not.toThrow();
    else expect(invoke).toThrow();
  },
);

it.each(['wrong-origin', 'wrong-window', 'forbidden-action', 'valid-app-request'])(
  '[CONTROL] app bridge %s', async (variant) => {
    let listener: (event: unknown) => Promise<void>;
    const sent: unknown[] = [];
    const fakeWindow = {
      location: { origin: config.appOrigins[0] },
      addEventListener: (_type: string, callback: typeof listener) => { listener = callback; },
      postMessage: noop,
    };
    const context = vm.createContext({
      USTUDY_EXTENSION_CONFIG: config, window: fakeWindow,
      document: { documentElement: null, addEventListener: noop },
      chrome: { runtime: { sendMessage: async (message: unknown) => { sent.push(message); return { ok: true }; },
        onMessage: { addListener: noop } } },
    });
    vm.runInContext(readFileSync('extension/app-bridge.js', 'utf8'), context);
    await listener!({
      origin: variant === 'wrong-origin' ? 'https://evil.invalid' : config.appOrigins[0],
      source: variant === 'wrong-window' ? {} : fakeWindow,
      data: { type: 'USTUDY_EXTENSION_BRIDGE_REQUEST', requestId: 'synthetic-id',
        action: variant === 'forbidden-action' ? 'SYNC_COMPLETE' : 'GET_STATE' },
    });
    expect(sent).toHaveLength(variant === 'valid-app-request' ? 1 : 0);
  },
);

it.each(config.appOrigins)('[CONTROL] app bridge initializes on %s', async (origin: string) => {
  let listener: (event: unknown) => Promise<void>;
  const sent: unknown[] = [];
  const fakeWindow = {
    location: { origin },
    addEventListener: (_type: string, callback: typeof listener) => { listener = callback; },
    postMessage: noop,
  };
  const context = vm.createContext({
    USTUDY_EXTENSION_CONFIG: config, window: fakeWindow,
    document: { documentElement: null, addEventListener: noop },
    chrome: { runtime: { sendMessage: async (message: unknown) => { sent.push(message); return { ok: true }; },
      onMessage: { addListener: noop } } },
  });

  vm.runInContext(readFileSync('extension/app-bridge.js', 'utf8'), context);
  await listener!({
    origin,
    source: fakeWindow,
    data: { type: 'USTUDY_EXTENSION_BRIDGE_REQUEST', requestId: 'synthetic-id', action: 'GET_STATE' },
  });
  expect(sent).toHaveLength(1);
});
