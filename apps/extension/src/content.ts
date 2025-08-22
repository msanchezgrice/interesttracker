const HEARTBEAT_MS = 15000;
let lastUserEvent = Date.now();
let timer: number | null = null;

const visible = () => !document.hidden && document.hasFocus();
const userActive = () => Date.now() - lastUserEvent < 20000;
const scrollDepth = () => {
  const h = document.documentElement;
  const s = (window.scrollY + window.innerHeight) / (h.scrollHeight || 1);
  return Math.max(0, Math.min(1, s));
};

['mousemove','keydown','scroll','click','touchstart'].forEach(ev =>
  window.addEventListener(ev, () => (lastUserEvent = Date.now()), { passive: true })
);

async function beat() {
  const { paused = false, allowlist = [] } = await chrome.storage.local.get(['paused','allowlist']);
  if (paused) {
    console.log('Paused, skipping beat');
    return;
  }
  
  try {
    const host = location.hostname.replace(/^www\./,'');
    if (Array.isArray(allowlist) && allowlist.length) {
      const allowed = allowlist.some((d: string) => host.endsWith(d));
      if (!allowed) {
        console.log('Host not in allowlist:', host, 'allowlist:', allowlist);
        return;
      }
    }
  } catch {}
  
  const beatData = {
    type: 'heartbeat',
    url: location.href,
    title: document.title,
    visible: visible(),
    userActive: userActive(),
    scrollDepth: scrollDepth()
  };
  console.log('Sending heartbeat:', beatData);
  try {
    chrome.runtime.sendMessage(beatData, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Heartbeat error:', chrome.runtime.lastError);
      } else {
        console.log('Heartbeat response:', response);
      }
    });
  } catch (e) {
    console.error('Failed to send heartbeat:', e);
  }
}

function start() { if (timer) clearInterval(timer); beat(); timer = window.setInterval(beat, HEARTBEAT_MS); }

document.addEventListener('visibilitychange', () => { if (visible()) start(); });
window.addEventListener('beforeunload', () => {
  try {
    chrome.runtime.sendMessage({ type: 'finalize' });
  } catch (e) {
    console.error('Failed to send finalize:', e);
  }
});

// Add a visible indicator that the script loaded
console.log('🔍 MakerPulse content script loaded on:', location.href);
console.log('🔍 Document ready state:', document.readyState);
console.log('🔍 Current time:', new Date().toISOString());

// Test chrome.runtime connection
try {
  chrome.runtime.sendMessage({ type: 'test' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('🔍 Runtime connection failed:', chrome.runtime.lastError);
    } else {
      console.log('🔍 Runtime connection OK:', response);
    }
  });
} catch (e) {
  console.error('🔍 Runtime sendMessage failed:', e);
}

start();


