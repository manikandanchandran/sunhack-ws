/**
 * In-memory conversation store isolated by sessionId + labId.
 */
const conversations = new Map();

function key(sessionId, labId) {
  return `${sessionId}::${labId}`;
}

export function getConversation(sessionId, labId) {
  const k = key(sessionId, labId);
  if (!conversations.has(k)) {
    conversations.set(k, []);
  }
  return conversations.get(k);
}

export function appendMessage(sessionId, labId, message) {
  const history = getConversation(sessionId, labId);
  history.push({
    ...message,
    ts: new Date().toISOString(),
  });
  return history;
}

export function clearConversation(sessionId, labId) {
  conversations.set(key(sessionId, labId), []);
  return [];
}

export function clearAllForSession(sessionId) {
  for (const k of [...conversations.keys()]) {
    if (k.startsWith(`${sessionId}::`)) conversations.delete(k);
  }
}

export function resetLabConversations(labId) {
  for (const k of [...conversations.keys()]) {
    if (k.endsWith(`::${labId}`)) conversations.delete(k);
  }
}

export function getAllConversationsSnapshot() {
  const out = {};
  for (const [k, v] of conversations.entries()) out[k] = v;
  return out;
}

export default {
  getConversation,
  appendMessage,
  clearConversation,
  clearAllForSession,
  resetLabConversations,
  getAllConversationsSnapshot,
};
