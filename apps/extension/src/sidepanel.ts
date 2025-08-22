function $(id: string) { return document.getElementById(id) as HTMLInputElement; }

const DEFAULT_BASE = 'https://interesttracker.vercel.app';

async function load() {
  const { deviceKey = '', ingestUrl = '', paused = false, allowlist = [] } = await chrome.storage.local.get([
    'deviceKey','ingestUrl','paused','allowlist'
  ]);
  $('deviceKey').value = deviceKey;
  const fallbackIngest = `${DEFAULT_BASE}/api/ingest`;
  $('ingestUrl').value = ingestUrl || fallbackIngest;
  $('paused').checked = !!paused;
  $('allowlist').value = Array.isArray(allowlist) ? allowlist.join(', ') : '';
}

async function save() {
  const deviceKey = $('deviceKey').value.trim();
  const ingestUrl = $('ingestUrl').value.trim();
  const paused = $('paused').checked;
  const allowlist = $('allowlist').value.split(',').map(s => s.trim()).filter(Boolean);
  await chrome.storage.local.set({ deviceKey, ingestUrl, paused, allowlist });
  setStatus('Saved');
}

async function flush() {
  await chrome.runtime.sendMessage({ type: 'flush' });
  setStatus('Flush requested');
}

function setStatus(s: string) {
  const el = document.getElementById('status');
  if (el) el.textContent = s;
}

document.getElementById('save')?.addEventListener('click', save);
document.getElementById('flush')?.addEventListener('click', flush);
document.getElementById('openDashboard')?.addEventListener('click', async () => {
  const { ingestUrl = '' } = await chrome.storage.local.get(['ingestUrl']);
  const url = ingestUrl || `${DEFAULT_BASE}/api/ingest`;
  try {
    const u = new URL(url);
    const base = `${u.protocol}//${u.host}`;
    chrome.tabs.create({ url: base });
  } catch (e) {
    setStatus('Invalid ingest URL');
  }
});

load();


