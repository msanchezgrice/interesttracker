function $(id: string) { return document.getElementById(id) as HTMLInputElement; }

const DEFAULT_BASE = 'https://interesttracker.vercel.app';

async function load() {
  const { deviceKey = '', ingestUrl = '', paused = false } = await chrome.storage.local.get([
    'deviceKey','ingestUrl','paused'
  ]);
  $('deviceKey').value = deviceKey;
  const fallbackIngest = `${DEFAULT_BASE}/api/ingest`;
  $('ingestUrl').value = ingestUrl || fallbackIngest;
  $('paused').checked = !!paused;
  
  // Update tracking status display
  updateTrackingStatus();
}

async function save() {
  const deviceKey = $('deviceKey').value.trim();
  const ingestUrl = $('ingestUrl').value.trim();
  const paused = $('paused').checked;
  await chrome.storage.local.set({ deviceKey, ingestUrl, paused });
  setStatus('Configuration saved', 'success');
  updateTrackingStatus();
}

async function flush() {
  setStatus('Syncing...', 'info');
  await chrome.runtime.sendMessage({ type: 'flush' });
  setStatus('Data synced successfully', 'success');
}

function setStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const el = document.getElementById('status');
  if (el) {
    el.textContent = message;
    el.className = `status ${type}`;
    
    // Clear status after 3 seconds
    if (type !== 'error') {
      setTimeout(() => {
        el.textContent = '';
        el.className = 'status';
      }, 3000);
    }
  }
}

function updateTrackingStatus() {
  const statusEl = document.getElementById('trackingStatus');
  const valueEl = document.getElementById('trackingValue');
  const paused = $('paused').checked;
  const deviceKey = $('deviceKey').value.trim();
  
  if (!statusEl || !valueEl) return;
  
  if (!deviceKey) {
    statusEl.className = 'tracking-status';
    valueEl.textContent = 'Not configured';
  } else if (paused) {
    statusEl.className = 'tracking-status paused';
    valueEl.textContent = 'Paused';
  } else {
    statusEl.className = 'tracking-status active';
    valueEl.textContent = 'Tracking';
  }
}

document.getElementById('save')?.addEventListener('click', save);
document.getElementById('flush')?.addEventListener('click', flush);
document.getElementById('paused')?.addEventListener('change', updateTrackingStatus);
document.getElementById('openDashboard')?.addEventListener('click', async () => {
  const { ingestUrl = '' } = await chrome.storage.local.get(['ingestUrl']);
  const url = ingestUrl || `${DEFAULT_BASE}/api/ingest`;
  try {
    const u = new URL(url);
    const base = `${u.protocol}//${u.host}`;
    chrome.tabs.create({ url: `${base}/dashboard` });
  } catch (e) {
    setStatus('Invalid ingest URL', 'error');
  }
});

load();


