import {
  loadSession,
  setIdentity,
  fetchLab,
  sendChat,
  clearChat,
  getHistory,
  directReplay,
  renderStatusStack,
  appendBubble,
} from './app.js';

function labIdFromPath() {
  const m = location.pathname.match(/\/lab(\d+)/i);
  return m ? `lab${m[1]}` : 'lab1';
}

const labId = labIdFromPath();
const els = {
  title: document.querySelector('#lab-title'),
  owasp: document.querySelector('#lab-owasp'),
  objective: document.querySelector('#lab-objective'),
  scenario: document.querySelector('#lab-scenario'),
  explain: document.querySelector('#lab-explain'),
  todos: document.querySelector('#lab-todos'),
  criteria: document.querySelector('#lab-criteria'),
  message: document.querySelector('#message'),
  chatLog: document.querySelector('#chat-log'),
  typing: document.querySelector('#typing'),
  status: document.querySelector('#status-stack'),
  traces: document.querySelector('#trace-panel'),
  sandboxWrap: document.querySelector('#sandbox-wrap'),
  sandboxFrame: document.querySelector('#sandbox-frame'),
  accessStatus: document.querySelector('#access-status'),
  identity: document.querySelector('#identity-select'),
  customerId: document.querySelector('#customer-id'),
  tryPrompts: document.querySelector('#try-prompts'),
};

let currentLab = null;

function renderTraces(traces = []) {
  els.traces.innerHTML = '';
  if (!traces.length) {
    els.traces.innerHTML = '<p class="muted">No tool calls in this turn.</p>';
    return;
  }
  for (const t of traces) {
    const item = document.createElement('div');
    item.className = 'trace-item';
    item.innerHTML = `<div><strong>${t.toolName}</strong></div>`;
    const args = document.createElement('pre');
    args.className = 'mono';
    args.textContent = `args: ${JSON.stringify(t.arguments, null, 2)}`;
    const result = document.createElement('pre');
    result.className = 'mono';
    result.textContent = `result: ${JSON.stringify(t.result, null, 2)}`;
    const g = document.createElement('div');
    g.className = 'muted';
    g.textContent = `guardrail: ${t.guardrailStatus || 'DISABLED'}`;
    item.append(args, result, g);
    els.traces.appendChild(item);
  }
}

async function hydrateHistory() {
  const { history } = await getHistory(labId);
  els.chatLog.innerHTML = '';
  for (const m of history) {
    if (m.role === 'user' || m.role === 'assistant') {
      appendBubble(els.chatLog, m.role, m.content || '');
    }
  }
}

async function init() {
  const session = await loadSession();
  if (!session.hasApiKey && session.aiMode !== 'fixture') {
    els.accessStatus.textContent = 'OPENAI_API_KEY is missing in .env — chat will not work.';
  }

  els.identity.innerHTML = Object.entries(session.tenants)
    .map(([key, t]) => `<option value="${key}" ${key === session.tenantKey ? 'selected' : ''}>${t.label}</option>`)
    .join('');
  els.customerId.value = session.customerId;

  currentLab = await fetchLab(labId);
  document.title = `${currentLab.title} — AI Agent Security Labs`;
  els.title.textContent = `Lab ${labId.replace('lab', '')}: ${currentLab.title}`;
  els.owasp.textContent = `${currentLab.owasp.id} ${currentLab.owasp.name}`;
  els.objective.textContent = currentLab.objective;
  els.scenario.textContent = currentLab.scenario;
  els.explain.textContent = currentLab.vulnerabilityExplain;
  els.criteria.textContent = currentLab.successCriteria;
  els.todos.innerHTML = (currentLab.phase2Todos || []).map((t) => `<li>${t}</li>`).join('');
  els.tryPrompts.innerHTML = '';
  for (const prompt of currentLab.tryPrompts || []) {
    const li = document.createElement('li');
    const label = document.createElement('strong');
    label.textContent = `${prompt.label}: `;
    li.append(label, document.createTextNode(prompt.text));
    els.tryPrompts.appendChild(li);
  }

  renderStatusStack(els.status, 'GUARDRAILS DISABLED');

  if (labId === 'lab6') els.sandboxWrap.hidden = false;
  if (currentLab.directReplay) {
    document.querySelector('#btn-direct-replay').hidden = false;
  }

  await hydrateHistory();
}

async function submitChat(message) {
  const trimmed = String(message || '').trim();
  if (!trimmed) return;

  appendBubble(els.chatLog, 'user', trimmed);
  els.message.value = '';
  els.typing.textContent = 'Model is working…';
  document.querySelector('#btn-send').disabled = true;

  try {
    const result = await sendChat(labId, trimmed);
    appendBubble(els.chatLog, 'assistant', result.reply || '(empty response)');
    renderStatusStack(els.status, result.securityStatus);
    renderTraces(result.traces || []);
    if (labId === 'lab6' && /<script|SCRIPT_RAN/i.test(result.reply || '')) {
      els.sandboxFrame.src = `/api/labs/lab6/sandbox-html?payload=${encodeURIComponent(result.reply)}`;
    }
  } catch (err) {
    appendBubble(els.chatLog, 'assistant', `Error: ${err.message}`);
    renderStatusStack(els.status, err.status === 401 ? 'BACKEND DENIAL' : 'ERROR');
  } finally {
    els.typing.textContent = '';
    document.querySelector('#btn-send').disabled = false;
  }
}

document.querySelector('#btn-identity')?.addEventListener('click', async () => {
  await setIdentity(els.identity.value, els.customerId.value.trim());
  alert('Identity updated.');
});

document.querySelector('#btn-clear')?.addEventListener('click', async () => {
  await clearChat(labId);
  els.chatLog.innerHTML = '';
});

document.querySelector('#btn-direct-replay')?.addEventListener('click', async () => {
  const result = await directReplay(labId);
  renderTraces([{
    toolName: result.toolName,
    arguments: result.arguments,
    result: result.result,
    guardrailStatus: result.result?.guard?.status || result.result?.auth?.status || 'DISABLED',
  }]);
  renderStatusStack(els.status, 'TOOL CALL OBSERVED | BACKEND DEMO');
  appendBubble(
    els.chatLog,
    'assistant',
    `Backend demo (no model):\n${JSON.stringify(result.result, null, 2)}`,
  );
});

document.querySelector('#chat-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  await submitChat(els.message.value);
});

init().catch((err) => {
  console.error(err);
  alert(`Failed to load lab: ${err.message}`);
});
