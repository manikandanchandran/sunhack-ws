async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'same-origin',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function statusPill(text) {
  const el = document.createElement('span');
  el.className = 'pill';
  const t = String(text || '');
  if (/ATTACK OBSERVED|CROSS_TENANT|POISONED/i.test(t)) el.classList.add('danger');
  else if (/REFUSAL|UNSUCCESSFUL|DENIAL/i.test(t)) el.classList.add('warn');
  else if (/VERIFIED|OK/i.test(t)) el.classList.add('ok');
  else el.classList.add('warn');
  el.textContent = t;
  return el;
}

export async function loadSession() {
  return api('/api/session');
}

export async function setIdentity(tenantKey, customerId) {
  return api('/api/session/identity', {
    method: 'POST',
    body: JSON.stringify({ tenantKey, customerId }),
  });
}

export async function fetchLabs() {
  return api('/api/labs');
}

export async function fetchLab(labId) {
  return api(`/api/labs/${labId}`);
}

export async function sendChat(labId, message, { forceFixture = false } = {}) {
  return api(`/api/chat/${labId}`, {
    method: 'POST',
    body: JSON.stringify({ message, forceFixture }),
  });
}

export async function clearChat(labId) {
  return api(`/api/chat/${labId}/history`, { method: 'DELETE' });
}

export async function getHistory(labId) {
  return api(`/api/chat/${labId}/history`);
}

export async function resetAllData() {
  return api('/api/reset', { method: 'POST', body: '{}' });
}

function wireHeaderReset() {
  const btn = document.querySelector('#btn-reset-all');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (!confirm('Reset all lab data and chats back to the original state?')) return;
    btn.disabled = true;
    try {
      await resetAllData();
      window.location.reload();
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
      btn.disabled = false;
    }
  });
}

if (typeof document !== 'undefined') wireHeaderReset();

export async function resetLab(labId) {
  return api(`/api/labs/${labId}/reset`, { method: 'POST', body: '{}' });
}

export async function updateArticle(labId, articleId, content) {
  return api(`/api/labs/${labId}/knowledge/${articleId}`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function directReplay(labId) {
  return api(`/api/labs/${labId}/direct-replay`, {
    method: 'POST',
    body: '{}',
  });
}

export async function fetchDashboard() {
  return api('/api/dashboard');
}

export function renderStatusStack(container, statusText) {
  container.innerHTML = '';
  String(statusText || 'GUARDRAILS DISABLED')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => container.appendChild(statusPill(s)));
}

export function appendBubble(logEl, role, content) {
  const div = document.createElement('div');
  div.className = `bubble ${role}`;
  div.innerHTML = `<div class="role">${role}</div>`;
  const body = document.createElement('div');
  body.textContent = content; // inert text in main UI
  div.appendChild(body);
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

export function copyText(text) {
  return navigator.clipboard.writeText(text);
}

window.WorkshopAPI = {
  api,
  loadSession,
  setIdentity,
  fetchLabs,
  fetchLab,
  sendChat,
  clearChat,
  getHistory,
  resetLab,
  updateArticle,
  directReplay,
  fetchDashboard,
  renderStatusStack,
  appendBubble,
  copyText,
};
