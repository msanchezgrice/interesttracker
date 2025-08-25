type Session = { url: string; title?: string; startedAt: number; ms: number; lastBeat: number; scrollMax: number };
const S = new Map<number, Session>();
let systemIdle: 'active'|'idle'|'locked' = 'active';

chrome.idle.setDetectionInterval?.(60);
chrome.idle.onStateChanged.addListener((s) => { systemIdle = s; });

// Set up hourly automatic sync
chrome.alarms.create('hourlySync', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'hourlySync') {
    console.log('[Background] Hourly sync triggered');
    flushAll();
  }
});

// Ensure clicking the toolbar icon opens the side panel
chrome.runtime.onInstalled.addListener(() => {
  // Set default side panel behavior
  try {
    // @ts-ignore - Chrome 114+
    chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true });
  } catch (e) {
    console.log('setPanelBehavior not supported, using fallback');
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked, opening side panel');
  try {
    if (!tab.id) return;
    // @ts-ignore - Chrome 114+
    await chrome.sidePanel?.open?.({ tabId: tab.id });
    console.log('Side panel opened');
  } catch (e) {
    console.error('Failed to open side panel:', e);
    // Fallback: try setting options first
    try {
      // @ts-ignore
      await chrome.sidePanel?.setOptions?.({ 
        tabId: tab.id, 
        path: 'sidepanel.html', 
        enabled: true 
      });
      // @ts-ignore
      await chrome.sidePanel?.open?.({ tabId: tab.id });
    } catch (e2) {
      console.error('Fallback also failed:', e2);
    }
  }
});

chrome.webNavigation.onCommitted.addListener(({tabId, frameId, url}) => {
  if (frameId !== 0) return;
  finalize(tabId);
  S.set(tabId, { url, startedAt: Date.now(), ms: 0, lastBeat: 0, scrollMax: 0 });
});

chrome.tabs.onRemoved.addListener((tabId) => finalize(tabId));
chrome.runtime.onSuspend.addListener(async () => { await flushAll(); });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  console.log('🔍 Background received message:', msg.type, 'from tab:', tabId);
  
  if (msg.type === 'test') {
    sendResponse({ ok: true, timestamp: Date.now() });
    return;
  }
  
  if (msg.type === 'flush') {
    console.log('🔍 Flush requested from side panel');
    flushAll().then(() => {
      console.log('🔍 Flush completed');
      sendResponse({ ok: true });
    }).catch(e => {
      console.error('🔍 Flush failed:', e);
      sendResponse({ error: e.message });
    });
    return true;
  }
  
  if (!tabId) return;
  if (msg.type === 'heartbeat') {
    const st = S.get(tabId) ?? { url: msg.url, startedAt: Date.now(), ms: 0, lastBeat: 0, scrollMax: 0 };
    const now = Date.now();
    const engaged = msg.visible && systemIdle === 'active' && msg.userActive;
    
    console.log('🔍 Engagement check:', { 
      visible: msg.visible, 
      systemIdle, 
      userActive: msg.userActive, 
      engaged,
      timeSinceLastBeat: st.lastBeat ? now - st.lastBeat : 'first beat'
    });
    
    if (engaged && st.lastBeat && (now - st.lastBeat) <= 20000) {
      st.ms += 15000;
      console.log('🔍 Awarded 15s, total:', st.ms / 1000 + 's');
    }
    
    st.lastBeat = now;
    st.title = msg.title;
    st.scrollMax = Math.max(st.scrollMax, msg.scrollDepth ?? 0);
    st.url = msg.url;
    S.set(tabId, st);
    sendResponse({ ok: true });
  } else if (msg.type === 'finalize') {
    finalize(tabId).then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function finalize(tabId: number) {
  const st = S.get(tabId);
  if (!st) return;
  const rec = {
    url: st.url, title: st.title, ms: st.ms, scrollDepth: st.scrollMax,
    tsStart: st.startedAt, tsEnd: Date.now()
  };
  console.log('Finalizing session:', rec);
  S.delete(tabId);
  const { buffer = [] } = await chrome.storage.local.get('buffer');
  buffer.push(rec);
  await chrome.storage.local.set({ buffer });
  console.log('Added to buffer, total events:', buffer.length);
}

async function flushAll() {
  const { buffer = [], deviceKey, ingestUrl } = await chrome.storage.local.get(['buffer','deviceKey','ingestUrl']);
  console.log('FlushAll:', { bufferCount: buffer.length, hasDeviceKey: !!deviceKey, ingestUrl });
  
  if (!buffer.length) {
    console.log('No events to flush');
    return;
  }
  if (!ingestUrl || !deviceKey) {
    console.log('Missing config:', { ingestUrl: !!ingestUrl, deviceKey: !!deviceKey });
    return;
  }
  
  try {
    console.log('Sending events:', buffer);
    const response = await fetch(ingestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-device-key': deviceKey },
      body: JSON.stringify({ events: buffer })
    });
    const result = await response.json();
    console.log('Flush response:', response.status, result);
    
    if (response.ok) {
      await chrome.storage.local.set({ buffer: [] });
      console.log('Buffer cleared');
    }
  } catch (e) {
    console.error('Flush error:', e);
    // Keep buffer; retry on next suspend
  }
}