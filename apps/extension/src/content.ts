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
  chrome.runtime.sendMessage(beatData);
}

function start() { if (timer) clearInterval(timer); beat(); timer = window.setInterval(beat, HEARTBEAT_MS); }

document.addEventListener('visibilitychange', () => { if (visible()) start(); });
window.addEventListener('beforeunload', () => chrome.runtime.sendMessage({ type: 'finalize' }));
start();


