import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// This harness serves source modules only. It never loads the application,
// its configured Vite middleware, a real profile, or any external service.
const html = `<!doctype html><html><body><div id="root"></div><script type="module">
import React from '/node_modules/.vite/deps/react.js';
import { createRoot } from '/node_modules/.vite/deps/react-dom_client.js';
import * as storage from '/src/helpers/localStorage/save.tsx';
import { CryptoProvider, useCrypto } from '/src/context/CryptoContext.tsx';
import { SecurityGate } from '/src/components/security/SecurityGate.tsx';
const root = createRoot(document.getElementById('root'));
function Probe() { window.auditState = useCrypto(); return null; }
async function readSnapshot() {
  const db = await new Promise((resolve,reject) => {
    const request = indexedDB.open('ustudy-import-rollback',1);
    request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error);
  });
  try {
    return await new Promise((resolve,reject)=>{
      const request=db.transaction('snapshots').objectStore('snapshots').get('latest');
      request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error);
    });
  } finally { db.close(); }
}
window.audit = { storage, readSnapshot,
  mount: (gate=false) => root.render(React.createElement(CryptoProvider,null,
    React.createElement(Probe),gate ? React.createElement(SecurityGate,null,React.createElement('div',null,'audit')) : null)),
  unmount: () => root.unmount(),
};
window.auditReady = true;
</script></body></html>`;

const results = [];
const blocked = [];
const server = await createServer({
  configFile: false, envFile: false, root: process.cwd(), logLevel: 'error',
  server: { host: '127.0.0.1', port: 0, hmr: false, open: false },
  esbuild: { jsx: 'automatic' },
  optimizeDeps: { include: ['react', 'react-dom/client', 'react/jsx-runtime'] },
  plugins: [{ name: 'isolated-security-audit', configureServer(devServer) {
    devServer.middlewares.use((req,res,next) => {
      if (req.url?.split('?')[0] !== '/__security-audit') return next();
      res.setHeader('Content-Type','text/html; charset=utf-8');
      res.end(html);
    });
  } }],
});
let browser;
try {
  await server.listen();
  const address = server.httpServer.address();
  const origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ headless: true });
  async function check(name, run) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.route('**/*', route => {
      if (new URL(route.request().url()).origin === origin) return route.continue();
      blocked.push({ test: name, origin: new URL(route.request().url()).origin });
      return route.abort('blockedbyclient');
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(`${origin}/__security-audit`);
      await page.waitForFunction(() => window.auditReady, { timeout: 30000 });
      const evidence = await run(page, context, origin);
      results.push({ name, status: 'confirmed', evidence, pageErrors: errors });
      console.log(`CONFIRMED ${name}`);
    } catch (e) {
      results.push({ name, status: 'test-error', error: String(e), pageErrors: errors });
      console.error(`TEST ERROR ${name}: ${e}`);
    } finally { await context.close(); }
  }

  await check('SEC-02: real IndexedDB snapshot survives clearAllStorage', async page => {
    const evidence = await page.evaluate(async () => {
      const s = window.audit.storage;
      const key = await s.setupPin('synthetic-browser-password');
      await s.saveSecure('raw_student_db', { audit: 'PRIVATE_SYNTHETIC_MARKER' }, key);
      localStorage.setItem('group_scheduler_members', JSON.stringify([{ nickname: 'SYNTHETIC_MEMBER' }]));
      const created = await s.createImportRollbackSnapshot('audit', { added: 1, updated: 0, unchanged: 0 });
      s.clearAllStorage();
      const remaining = await window.audit.readSnapshot();
      return { created, localStorageLength: localStorage.length,
        snapshotHasCiphertext: Boolean(remaining?.raw_student_db),
        snapshotHasOldEnvelope: Boolean(remaining?.__encrypted_master_key__),
        snapshotHasPlainMember: remaining?.group_scheduler_members?.includes('SYNTHETIC_MEMBER') };
    });
    assert.equal(evidence.created, true);
    assert.equal(evidence.localStorageLength, 0);
    assert.equal(evidence.snapshotHasCiphertext, true);
    assert.equal(evidence.snapshotHasOldEnvelope, true);
    assert.equal(evidence.snapshotHasPlainMember, true);
    return evidence;
  });

  await check('SEC-03: actual snapshot old envelope opens new data after PIN change', async page => {
    const evidence = await page.evaluate(async () => {
      const s = window.audit.storage;
      const key = await s.setupPin('synthetic-old');
      await s.createImportRollbackSnapshot('audit', { added: 1, updated: 0, unchanged: 0 });
      await s.changePin(key, 'synthetic-old', 'synthetic-new');
      await s.saveSecure('raw_student_db', { audit: 'NEW_SYNTHETIC_DATA' }, key);
      const oldSnapshot = await window.audit.readSnapshot();
      const oldKey = await s.unlockBackupKey('synthetic-old', oldSnapshot);
      return { oldEnvelopeStillUnlocks: Boolean(oldKey),
        oldEnvelopeReadsNewData: (await s.readSecure('raw_student_db', oldKey, null))?.audit === 'NEW_SYNTHETIC_DATA' };
    });
    assert.equal(evidence.oldEnvelopeReadsNewData, true);
    return evidence;
  });

  await check('SEC-06: delayed decrypt repopulates RAM cache after lock', async page => {
    await page.evaluate(async () => {
      const s = window.audit.storage;
      const key = await s.setupPin('synthetic-race');
      await s.saveSecure('gpa_projected_grades', { audit: 'DELAYED_SYNTHETIC_MARKER' }, key);
      localStorage.setItem('__secure_data_schema_version__', '2');
      const original = crypto.subtle.decrypt.bind(crypto.subtle);
      let resolveGate;
      const gate = new Promise(resolve => { resolveGate = resolve; });
      window.releaseAuditDecrypt = resolveGate;
      crypto.subtle.decrypt = async (...args) => {
        window.auditDecryptStarted = true;
        await gate;
        return original(...args);
      };
      window.auditKey = key;
      window.audit.mount();
      window.addEventListener('message', e => {
        if (e.data?.type === 'CACHE_POPULATED') window.auditCacheFinished = true;
      });
    });
    await page.waitForFunction(() => window.auditState);
    await page.evaluate(() => window.auditState.unlock(window.auditKey));
    await page.waitForFunction(() => window.auditDecryptStarted);
    await page.evaluate(() => window.auditState.lock());
    await page.waitForFunction(() => window.auditState.cryptoKey === null);
    const before = await page.evaluate(() => window.audit.storage.readFromStorage('gpa_projected_grades', null));
    assert.equal(before, null);
    await page.evaluate(() => window.releaseAuditDecrypt());
    await page.waitForFunction(() => window.auditCacheFinished === true);
    const evidence = await page.evaluate(() => ({
      stillLocked: window.auditState.cryptoKey === null,
      markerBackInCache: window.audit.storage.readFromStorage('gpa_projected_grades', null)?.audit === 'DELAYED_SYNTHETIC_MARKER',
    }));
    assert.equal(evidence.stillLocked, true);
    assert.equal(evidence.markerBackInCache, true);
    return evidence;
  });

  await check('SEC-11: same-origin JavaScript uses non-extractable window key', async page => {
    await page.evaluate(async () => {
      window.auditKey = await window.audit.storage.setupPin('synthetic-window-key');
      await window.audit.storage.saveSecure('raw_student_db', { audit: 'WINDOW_KEY_MARKER' }, window.auditKey);
      window.audit.mount();
    });
    await page.waitForFunction(() => window.auditState);
    await page.evaluate(() => window.auditState.unlock(window.auditKey));
    const evidence = await page.evaluate(async () => {
      const key = window[Symbol.for('__ustudy_crypto_key__')];
      return { extractable: key.extractable,
        decrypts: (await window.audit.storage.readSecure('raw_student_db', key, null))?.audit === 'WINDOW_KEY_MARKER' };
    });
    assert.equal(evidence.extractable, false);
    assert.equal(evidence.decrypts, true);
    return evidence;
  });

  await check('SEC-11: second tab overwrites envelope while first retains stale key', async (page, context, origin) => {
    await page.evaluate(async () => {
      window.auditKey = await window.audit.storage.setupPin('synthetic-tab-a');
      await window.audit.storage.saveSecure('raw_student_db', { audit: 'TAB_A' }, window.auditKey);
      window.audit.mount(true);
    });
    await page.waitForFunction(() => window.auditState?.isReady);
    await page.evaluate(() => window.auditState.unlock(window.auditKey));
    await page.waitForFunction(() => window.auditState.cryptoKey !== null);
    await page.evaluate(() => { window.envelopeChangeSeen = false;
      window.addEventListener('storage', event => { if(event.key === '__encrypted_master_key__') window.envelopeChangeSeen = true; }); });
    const second = await context.newPage();
    await second.goto(`${origin}/__security-audit`);
    await second.waitForFunction(() => window.auditReady);
    await second.evaluate(async () => {
      const key = await window.audit.storage.setupPin('synthetic-tab-b');
      await window.audit.storage.saveSecure('raw_student_db', { audit: 'TAB_B' }, key);
    });
    await page.waitForFunction(() => window.envelopeChangeSeen === true);
    const evidence = await page.evaluate(async () => {
      let decryptFailed = false;
      try { await window.audit.storage.readSecure('raw_student_db', window.auditState.cryptoKey, null); }
      catch { decryptFailed = true; }
      return { retainedOldKey: window.auditState.cryptoKey === window.auditKey, decryptFailed };
    });
    assert.equal(evidence.retainedOldKey, true);
    assert.equal(evidence.decryptFailed, true);
    return evidence;
  });

  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/security-audit-browser.json', JSON.stringify({
    browser: browser.version(), externalRequestsBlocked: blocked, results,
  }, null, 2));
  if (results.some(result => result.status === 'test-error')) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await server.close();
}
