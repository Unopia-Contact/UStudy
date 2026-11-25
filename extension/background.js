importScripts('config.js');

const CONFIG = globalThis.USTUDY_EXTENSION_CONFIG;
const STORAGE_KEYS = {
  settings: 'ustudySyncSettings',
  stats: 'ustudySyncStats',
  pendingImport: 'ustudyPendingImport',
  pendingSyncRequest: 'ustudyPendingSyncRequest',
  syncSessions: 'ustudySyncSessions',
  autoCooldowns: 'ustudyAutoCooldowns',
};
const SYNC_SESSION_TIMEOUT_MS = 2 * 60 * 1000;
const PENDING_IMPORT_TTL_MS = 30 * 60 * 1000;

const DEFAULT_SETTINGS = {
  onboardingComplete: false,
  mode: CONFIG.defaults.mode,
  sources: {
    grades: true,
    registrations: true,
    exams: true,
    courses: true,
    tuition: true,
  },
  academicYear: CONFIG.defaults.academicYear,
  semester: CONFIG.defaults.semester,
  cooldownMinutes: CONFIG.defaults.cooldownMinutes,
  openAppAfterSync: false,
  autoSuggestionDismissed: false,
};

const DEFAULT_STATS = {
  successfulSyncs: 0,
  lastSyncedAt: null,
  lastError: null,
};
const activePortalRuns = new Map();
let storageQueue = Promise.resolve();

function getRandomPortalLoginUrl() {
  const { urlTemplate, shardMin, shardMax } = CONFIG.portalLogin;
  const shard = shardMin + Math.floor(Math.random() * (shardMax - shardMin + 1));
  return urlTemplate.replace('{shard}', String(shard));
}

function getSelectedSources(settings) {
  return ['grades', 'tuition', 'exams', 'courses', 'registrations']
    .filter((source) => source === 'grades' || Boolean(settings.sources[source]));
}

function enqueueStorageMutation(operation) {
  const next = storageQueue.then(operation, operation);
  storageQueue = next;
  return next;
}

async function readSyncSessions() {
  const stored = await chrome.storage.session.get(STORAGE_KEYS.syncSessions);
  return stored[STORAGE_KEYS.syncSessions] || {};
}

async function writeSyncSessions(sessions) {
  await chrome.storage.session.set({ [STORAGE_KEYS.syncSessions]: sessions });
}

function isPendingImportFresh(pending) {
  const createdAt = new Date(pending?.createdAt || '').getTime();
  return Boolean(pending?.id && pending?.packet && Number.isFinite(createdAt) && Date.now() - createdAt <= PENDING_IMPORT_TTL_MS);
}

async function readPendingImports() {
  const [session, local] = await Promise.all([
    chrome.storage.session.get(STORAGE_KEYS.pendingImport),
    chrome.storage.local.get(STORAGE_KEYS.pendingImport),
  ]);
  const current = session[STORAGE_KEYS.pendingImport];
  const entries = Array.isArray(current) ? current : [current];
  const byId = new Map();
  for (const entry of [...entries, local[STORAGE_KEYS.pendingImport]]) {
    if (isPendingImportFresh(entry) && !byId.has(entry.id)) byId.set(entry.id, entry);
  }
  return [...byId.values()];
}

async function readPendingImport(ignoredIds = []) {
  const ignored = new Set(Array.isArray(ignoredIds) ? ignoredIds : []);
  const pending = await readPendingImports();
  return pending.find(({ id }) => !ignored.has(id)) ?? null;
}

async function writePendingImports(pending) {
  // Legacy local data must not reappear after a packet is acknowledged.
  await chrome.storage.session.set({ [STORAGE_KEYS.pendingImport]: pending });
  await chrome.storage.local.remove(STORAGE_KEYS.pendingImport);
}

async function removeSyncSession(tabId) {
  return enqueueStorageMutation(async () => {
    const sessions = await readSyncSessions();
    delete sessions[tabId];
    await writeSyncSessions(sessions);
  });
}

async function readAutoCooldowns() {
  const stored = await chrome.storage.session.get(STORAGE_KEYS.autoCooldowns);
  return stored[STORAGE_KEYS.autoCooldowns] || {};
}

async function removeAutoCooldown(tabId) {
  return enqueueStorageMutation(async () => {
    const cooldowns = await readAutoCooldowns();
    delete cooldowns[tabId];
    await chrome.storage.session.set({ [STORAGE_KEYS.autoCooldowns]: cooldowns });
  });
}

function hasSameSourceSelection(session, selectedSources) {
  return Array.isArray(session?.selectedSources)
    && session.selectedSources.length === selectedSources.length
    && session.selectedSources.every((source, index) => source === selectedSources[index]);
}

function mergeSettings(value) {
  const incoming = value && typeof value === 'object' ? value : {};
  const mode = ['off', 'manual', 'ask', 'auto'].includes(incoming.mode) ? incoming.mode : DEFAULT_SETTINGS.mode;
  const academicYear = /^\d{2}-\d{2}$/.test(String(incoming.academicYear || ''))
    ? String(incoming.academicYear)
    : DEFAULT_SETTINGS.academicYear;
  const semester = ['1', '2', '3'].includes(String(incoming.semester))
    ? String(incoming.semester)
    : DEFAULT_SETTINGS.semester;
  const cooldownMinutes = Math.max(1, Math.min(1440, Number(incoming.cooldownMinutes) || DEFAULT_SETTINGS.cooldownMinutes));
  const sources = {};
  for (const source of Object.keys(DEFAULT_SETTINGS.sources)) {
    sources[source] = source === 'grades' || Boolean(incoming.sources?.[source]);
  }

  return {
    ...DEFAULT_SETTINGS,
    mode,
    academicYear,
    semester,
    cooldownMinutes,
    onboardingComplete: Boolean(incoming.onboardingComplete),
    openAppAfterSync: Boolean(incoming.openAppAfterSync),
    autoSuggestionDismissed: Boolean(incoming.autoSuggestionDismissed),
    sources,
  };
}

async function getStoredState() {
  const [stored, pending] = await Promise.all([
    chrome.storage.local.get([STORAGE_KEYS.settings, STORAGE_KEYS.stats, STORAGE_KEYS.pendingSyncRequest]),
    readPendingImport(),
  ]);
  const settings = mergeSettings(stored[STORAGE_KEYS.settings]);
  const stats = { ...DEFAULT_STATS, ...(stored[STORAGE_KEYS.stats] || {}) };

  return {
    installed: true,
    extensionVersion: CONFIG.extensionVersion,
    settings,
    stats,
    pendingImport: pending ? { id: pending.id, createdAt: pending.createdAt } : null,
    pendingSyncRequest: Boolean(stored[STORAGE_KEYS.pendingSyncRequest]),
  };
}

async function getStateForSender(sender) {
  const state = await getStoredState();
  if (!sender.tab?.id || !isPortalUrl(sender.tab.url)) return state;
  const sessions = await readSyncSessions();
  const session = sessions[sender.tab.id];
  if (!session) return state;
  return {
    ...state,
    syncSession: {
      id: session.id,
      trigger: session.trigger,
      completed: session.completedSources.length,
      total: session.selectedSources.length,
      updatedAt: session.updatedAt,
    },
  };
}

async function saveSettings(patch) {
  const current = await getStoredState();
  const settings = mergeSettings({
    ...current.settings,
    ...(patch || {}),
    sources: {
      ...current.settings.sources,
      ...(patch?.sources || {}),
    },
  });
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings });
  return getStoredState();
}

function isPortalUrl(url) {
  if (typeof url !== 'string') return false;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:'
      && new RegExp(CONFIG.portalHostnamePattern, 'i').test(parsedUrl.hostname);
  } catch {
    return false;
  }
}

function isPortalLoginUrl(url) {
  return typeof url === 'string' && url.toLowerCase().includes('login');
}

function isPortalReadyUrl(url) {
  return isPortalUrl(url) && !isPortalLoginUrl(url);
}

function isAppUrl(url) {
  if (typeof url !== 'string') return false;
  try {
    const parsedUrl = new URL(url);
    return CONFIG.appOrigins.includes(parsedUrl.origin);
  } catch {
    return false;
  }
}

function getSenderUrl(sender) {
  return sender?.url || sender?.tab?.url || '';
}

function isExtensionPageSender(sender) {
  return sender?.id === chrome.runtime.id
    && typeof sender?.url === 'string'
    && sender.url.startsWith(chrome.runtime.getURL(''));
}

function isPortalSender(sender) {
  return sender?.id === chrome.runtime.id && isPortalUrl(getSenderUrl(sender));
}

function isAppSender(sender) {
  return sender?.id === chrome.runtime.id && isAppUrl(getSenderUrl(sender));
}

function assertAuthorizedSender(message, sender) {
  const action = message?.action;
  const fromPortal = isPortalSender(sender);
  const fromApp = isAppSender(sender);
  const fromExtensionPage = isExtensionPageSender(sender);
  const isPortalAction = ['RUN_PORTAL_SYNC', 'SYNC_SOURCE_COMPLETE', 'SYNC_HEARTBEAT', 'SYNC_COMPLETE', 'SYNC_FAILED'].includes(action);
  const isPendingImportAction = action === 'GET_PENDING_IMPORT' || action === 'ACK_PENDING_IMPORT';

  const allowed = (
    (action === 'GET_STATE' && (fromPortal || fromApp || fromExtensionPage))
    || (action === 'SAVE_SETTINGS' && (fromPortal || fromApp || fromExtensionPage))
    || (action === 'OPEN_PORTAL' && (fromApp || fromExtensionPage))
    || (isPendingImportAction && fromApp)
    || (isPortalAction && fromPortal)
  );

  if (!allowed) throw new Error('Nguồn gửi yêu cầu extension không hợp lệ.');
}

async function findTab(predicate) {
  const tabs = await chrome.tabs.query({});
  return tabs.find((tab) => predicate(tab.url));
}

async function focusTab(tab) {
  if (!tab?.id) return;
  await chrome.tabs.update(tab.id, { active: true });
  if (typeof tab.windowId === 'number') await chrome.windows.update(tab.windowId, { focused: true });
}

async function notifyAppTabs() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.filter((tab) => tab.id && isAppUrl(tab.url)).map(async (tab) => {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'USTUDY_PENDING_IMPORT_AVAILABLE' });
    } catch {
      // The app may still be loading; it will request the pending packet on mount.
    }
  }));
}

async function openOrFocusApp() {
  const appTab = await findTab(isAppUrl);
  if (appTab) {
    await focusTab(appTab);
    await notifyAppTabs();
    return appTab;
  }
  return chrome.tabs.create({ url: CONFIG.productionAppUrl, active: true });
}

async function injectAppBridgeIntoOpenTabs() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.filter((tab) => tab.id && isAppUrl(tab.url)).map(async (tab) => {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['config.js', 'app-bridge.js'],
      });
    } catch {
      // Restricted or closing tabs can reject injection; reloading uses the manifest script.
    }
  }));
}

async function openPortalAndRequestSync() {
  await chrome.storage.local.set({ [STORAGE_KEYS.pendingSyncRequest]: true });
  const portalTab = await findTab(isPortalReadyUrl);
  if (portalTab) {
    await focusTab(portalTab);
    try {
      await chrome.tabs.sendMessage(portalTab.id, { type: 'USTUDY_START_SYNC' });
    } catch {
      // The content script will consume pendingSyncRequest after the page is ready.
    }
    return;
  }
  const loginTab = await findTab(isPortalUrl);
  if (loginTab) {
    await focusTab(loginTab);
    return;
  }
  await chrome.tabs.create({ url: getRandomPortalLoginUrl() });
}

function buildRunnerRuntime(requestId, settings, completedSources = []) {
  const completed = new Set(completedSources);
  return {
    transport: 'extension',
    requestId,
    config: {
      URL_DIEM: CONFIG.endpoints.grades,
      URL_LICHTHI: CONFIG.endpoints.exams,
      URL_HOCPHI: CONFIG.endpoints.tuition,
      URL_LOPMO: CONFIG.endpoints.openClasses,
      URL_DKHP: CONFIG.endpoints.registrations,
      TARGET_YEAR: settings.academicYear,
      TARGET_SEM: settings.semester,
      CLASS_TARGET_YEAR: settings.academicYear,
      CLASS_TARGET_SEM: settings.semester,
      REG_TARGET_YEAR: settings.academicYear,
      REG_TARGET_SEM: settings.semester,
      VERSION: CONFIG.scraperVersion,
      PROTOCOL_VERSION: CONFIG.protocolVersion,
      CONCURRENCY: '4',
    },
    syncOptions: {
      getGrades: !completed.has('grades'),
      getTuition: settings.sources.tuition && !completed.has('tuition'),
      getExam: settings.sources.exams && !completed.has('exams'),
      getClass: settings.sources.courses && !completed.has('courses'),
      classYear: settings.academicYear,
      classSem: settings.semester,
      getReg: settings.sources.registrations && !completed.has('registrations'),
      regYear: settings.academicYear,
      regSem: settings.semester,
    },
  };
}

function canResumeSession(session, studentId, settings, selectedSources) {
  return Boolean(session && studentId && studentId === session.studentId
    && Date.now() - Date.parse(session.updatedAt) <= SYNC_SESSION_TIMEOUT_MS
    && hasSameSourceSelection(session, selectedSources)
    && session.academicYear === settings.academicYear && session.semester === settings.semester);
}

async function runPortalSync(sender, requestId, trigger = 'manual', documentInstanceId = '', studentId = '') {
  if (!sender.tab?.id || !isPortalUrl(sender.tab.url)) throw new Error('Chỉ có thể đồng bộ từ HCMUS Portal.');
  const tabId = sender.tab.id;
  const currentTab = await chrome.tabs.get(tabId);
  if (!isPortalReadyUrl(currentTab.url)) throw new Error('Bạn cần đăng nhập Portal trước khi đồng bộ.');
  const state = await getStoredState();
  const selectedSources = getSelectedSources(state.settings);
  const documentId = documentInstanceId || sender.documentId || null;
  let session;
  await enqueueStorageMutation(async () => {
    if (activePortalRuns.get(tabId)?.documentId === documentId) return;
    const cooldowns = trigger === 'auto' ? await readAutoCooldowns() : {};
    const sessions = await readSyncSessions();
    const existing = sessions[tabId];
    if (canResumeSession(existing, studentId, state.settings, selectedSources)) {
      session = { ...existing, currentRequestId: requestId, updatedAt: new Date().toISOString() };
    } else {
      session = {
        id: crypto.randomUUID(),
        tabId,
        selectedSources,
        academicYear: state.settings.academicYear,
        semester: state.settings.semester,
        completedSources: [],
        studentId,
        partialRaw: {},
        partialMeta: { params: {} },
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentRequestId: requestId,
        trigger: trigger === 'auto' ? 'auto' : 'manual',
      };
    }
    if (trigger === 'auto' && session.completedSources.length === 0 && Number(cooldowns[tabId] || 0) > Date.now()) {
      session = null;
      return;
    }
    sessions[tabId] = session;
    await writeSyncSessions(sessions);
    activePortalRuns.set(tabId, { requestId, documentId });
  });

  if (session === undefined) return { requestId, skipped: true, reason: 'running' };
  if (!session) return { requestId, skipped: true, reason: 'cooldown' };
  const runtime = buildRunnerRuntime(requestId, state.settings, session.completedSources);

  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.pendingSyncRequest]: false });
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (value) => { window.__USTUDY_PORTAL_SYNC_RUNTIME__ = value; },
      args: [runtime],
    });
  } catch (error) {
    if (activePortalRuns.get(tabId)?.requestId === requestId) activePortalRuns.delete(tabId);
    throw error;
  }
  void chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    files: ['portal-runner.js'],
  }).catch(async (error) => {
    if (activePortalRuns.get(tabId)?.requestId === requestId) activePortalRuns.delete(tabId);
    await chrome.tabs.sendMessage(tabId, {
      type: 'USTUDY_RUNNER_ERROR',
      requestId,
      message: error?.message || 'Không thể khởi chạy bộ đồng bộ.',
    }).catch(() => undefined);
  });

  return {
    requestId,
    resumed: session.completedSources.length > 0,
    completed: session.completedSources.length,
    total: session.selectedSources.length,
  };
}

async function saveSourceCheckpoint(sender, requestId, payload) {
  if (!sender.tab?.id || !isPortalUrl(sender.tab.url)) throw new Error('Nguồn checkpoint không hợp lệ.');
  const tabId = sender.tab.id;
  const source = payload?.source;
  if (!['grades', 'tuition', 'exams', 'courses', 'registrations'].includes(source)) {
    throw new Error('Nhóm dữ liệu checkpoint không hợp lệ.');
  }

  return enqueueStorageMutation(async () => {
    const sessions = await readSyncSessions();
    const session = sessions[tabId];
    if (!session || session.currentRequestId !== requestId || !session.selectedSources.includes(source)) {
      return { ignored: true };
    }
    if (source === 'grades' && session.studentId && payload.rawPatch?.studentId && session.studentId !== payload.rawPatch.studentId) {
      throw new Error('Tài khoản Portal đã thay đổi. Hãy đồng bộ lại.');
    }
    session.partialRaw = { ...session.partialRaw, ...(payload.rawPatch || {}) };
    session.partialMeta = {
      ...session.partialMeta,
      ...(payload.metaPatch || {}),
      params: { ...(session.partialMeta?.params || {}), ...(payload.metaPatch?.params || {}) },
    };
    const capturedAt = new Date().toISOString();
    session.partialMeta.sourceUpdatedAt = { ...session.partialMeta.sourceUpdatedAt, [source]: capturedAt,
      ...(source === 'grades' ? { profile: capturedAt } : {}) };
    if (!session.completedSources.includes(source)) session.completedSources.push(source);
    session.updatedAt = new Date().toISOString();
    sessions[tabId] = session;
    await writeSyncSessions(sessions);
    return { completed: session.completedSources.length, total: session.selectedSources.length };
  });
}

async function touchSyncSession(sender, requestId) {
  if (!sender.tab?.id) return { ignored: true };
  const tabId = sender.tab.id;
  return enqueueStorageMutation(async () => {
    const sessions = await readSyncSessions();
    const session = sessions[tabId];
    if (!session || session.currentRequestId !== requestId) return { ignored: true };
    session.updatedAt = new Date().toISOString();
    sessions[tabId] = session;
    await writeSyncSessions(sessions);
    return { touched: true };
  });
}

async function storeSyncResult(packet, trigger = 'manual', tabId, requestId) {
  const { pendingImport, stats, openApp } = await enqueueStorageMutation(async () => {
    const sessions = await readSyncSessions();
    const session = sessions[tabId];
    if (!session || session.currentRequestId !== requestId) {
      throw new Error('Phiên đồng bộ đã thay đổi. Hãy đồng bộ lại.');
    }
    if (session.studentId && packet?.raw?.studentId && session.studentId !== packet.raw.studentId) {
      throw new Error('Tài khoản Portal đã thay đổi. Hãy đồng bộ lại.');
    }
    const finalPacket = {
      ...packet,
      raw: { ...(packet?.raw || {}), ...(session.partialRaw || {}), ...(session.studentId ? { studentId: session.studentId } : {}) },
      meta: {
        ...(packet?.meta || {}),
        ...(session.partialMeta || {}),
        params: { ...(packet?.meta?.params || {}), ...(session.partialMeta?.params || {}) },
      },
    };
    if (!Array.isArray(finalPacket.raw.grades)) throw new Error('Gói dữ liệu Portal không hợp lệ.');

    const state = await getStoredState();
    const createdAt = new Date().toISOString();
    const id = session.id;
    const pending = await readPendingImports();
    if (!pending.some((entry) => entry.id === id)) {
      pending.push({ id, createdAt, trigger: trigger === 'auto' ? 'auto' : 'manual', packet: finalPacket });
      await writePendingImports(pending);
    }

    const storedStats = state.stats;
    const stats = {
      ...storedStats,
      successfulSyncs: storedStats.successfulSyncs + Number(storedStats.lastCompletedSessionId !== id),
      lastSyncedAt: createdAt,
      lastCompletedSessionId: id,
      lastError: null,
    };
    await chrome.storage.local.set({ [STORAGE_KEYS.stats]: stats });
    if (trigger === 'auto' || state.settings.mode === 'auto') {
      const cooldowns = await readAutoCooldowns();
      cooldowns[tabId] = Date.now() + state.settings.cooldownMinutes * 60 * 1000;
      await chrome.storage.session.set({ [STORAGE_KEYS.autoCooldowns]: cooldowns });
    }
    delete sessions[tabId];
    await writeSyncSessions(sessions);
    activePortalRuns.delete(tabId);
    await chrome.action.setBadgeBackgroundColor({ color: '#004A98' });
    await chrome.action.setBadgeText({ text: String(pending.length) });
    return { pendingImport: { id, createdAt }, stats, openApp: state.settings.openAppAfterSync };
  });

  if (openApp) await openOrFocusApp();
  else await notifyAppTabs();
  return { pendingImport, stats };
}

async function handleMessage(message, sender) {
  assertAuthorizedSender(message, sender);
  switch (message?.action) {
    case 'GET_STATE':
      return getStateForSender(sender);
    case 'SAVE_SETTINGS':
      return saveSettings(message.payload);
    case 'OPEN_PORTAL':
      await openPortalAndRequestSync();
      return { opened: true };
    case 'RUN_PORTAL_SYNC':
      return runPortalSync(sender, message.requestId || crypto.randomUUID(), message.trigger, message.documentInstanceId, message.studentId);
    case 'SYNC_SOURCE_COMPLETE':
      return saveSourceCheckpoint(sender, message.requestId, message.payload);
    case 'SYNC_HEARTBEAT':
      return touchSyncSession(sender, message.requestId);
    case 'SYNC_COMPLETE':
      if (!isPortalReadyUrl(sender.tab?.url)) throw new Error('Nguồn đồng bộ không hợp lệ.');
      return storeSyncResult(message.payload, message.trigger, sender.tab?.id, message.requestId);
    case 'SYNC_FAILED': {
      return enqueueStorageMutation(async () => {
        if (sender.tab?.id && activePortalRuns.get(sender.tab.id)?.requestId === message.requestId) {
          activePortalRuns.delete(sender.tab.id);
        }
        const state = await getStoredState();
        await chrome.storage.local.set({
          [STORAGE_KEYS.stats]: { ...state.stats, lastError: String(message.message || 'Đồng bộ thất bại.') },
        });
        return { recorded: true };
      });
    }
    case 'GET_PENDING_IMPORT':
      return readPendingImport(message.payload?.ignoredIds);
    case 'ACK_PENDING_IMPORT': {
      const acknowledged = await enqueueStorageMutation(async () => {
        const pending = await readPendingImports();
        const remaining = pending.filter(({ id }) => id !== message.payload?.id);
        if (remaining.length === pending.length) return false;
        await writePendingImports(remaining);
        await chrome.action.setBadgeText({ text: remaining.length ? String(remaining.length) : '' });
        return true;
      });
      if (acknowledged) await notifyAppTabs();
      return { acknowledged };
    }
    default:
      throw new Error('Yêu cầu extension không được hỗ trợ.');
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await enqueueStorageMutation(async () => {
    const state = await getStoredState();
    await chrome.storage.local.set({
      [STORAGE_KEYS.settings]: state.settings,
      [STORAGE_KEYS.stats]: state.stats,
    });
    const pending = await readPendingImports();
    await writePendingImports(pending);
    await chrome.action.setBadgeText({ text: pending.length ? String(pending.length) : '' });
  });
  await injectAppBridgeIntoOpenTabs();
});

chrome.runtime.onStartup.addListener(() => {
  void injectAppBridgeIntoOpenTabs();
});

void injectAppBridgeIntoOpenTabs();

chrome.tabs.onRemoved.addListener((tabId) => {
  activePortalRuns.delete(tabId);
  void removeSyncSession(tabId);
  void removeAutoCooldown(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: error?.message || String(error) }));
  return true;
});
