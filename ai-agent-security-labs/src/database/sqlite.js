import { DatabaseSync } from 'node:sqlite';
import { SCHEMA_SQL } from './schema.js';
import { seedDatabase, SEED_CUSTOMERS, SEED_ORDERS, SEED_REFUNDS, SEED_KNOWLEDGE, SEED_ADMIN_RECORDS } from './seed.js';
import { loadPhase1Observations } from './phase1Observations.js';

let dbInstance = null;

export function createDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA_SQL);
  seedDatabase(db);
  seedPhase1CompareRows(db);
  return db;
}

function seedPhase1CompareRows(db) {
  const rows = loadPhase1Observations();
  const insert = db.prepare(`
    INSERT INTO compare_observations (
      phase, lab_id, prompt, identity_json, model, retrieved_json, tool_calls_json,
      database_effects_json, guardrail_decisions_json, final_result, security_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const row of rows) {
    insert.run(
      'phase1',
      row.labId,
      row.prompt,
      JSON.stringify(row.identity || {}),
      row.model || 'gpt-4o-mini',
      JSON.stringify(row.retrieved || []),
      JSON.stringify(row.toolCalls || []),
      JSON.stringify(row.databaseEffects || []),
      JSON.stringify(row.guardrailDecisions || { note: 'Phase 1 pass-through / disabled' }),
      row.finalResult || '',
      row.securityStatus || 'GUARDRAILS DISABLED',
      row.createdAt || '2026-03-01T12:00:00.000Z',
    );
  }
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = createDatabase();
  }
  return dbInstance;
}

export function resetDatabase() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore close errors on in-memory db
    }
  }
  dbInstance = createDatabase();
  return dbInstance;
}

export function resetLabData(labId) {
  const db = getDb();
  db.prepare('DELETE FROM agent_logs WHERE lab_id = ?').run(labId);

  db.exec('DELETE FROM refunds;');
  db.exec('DELETE FROM orders;');
  db.exec('DELETE FROM customers;');
  db.exec('DELETE FROM knowledge_base;');
  db.exec('DELETE FROM admin_records;');
  db.exec('DELETE FROM manager_approvals;');
  try {
    db.exec(`DELETE FROM sqlite_sequence WHERE name = 'refunds';`);
    db.exec(`DELETE FROM sqlite_sequence WHERE name = 'manager_approvals';`);
  } catch {
    // ignore if sqlite_sequence is absent
  }

  seedDatabase(db);
  return { ok: true, labId };
}

export function logAgentEvent({
  labId,
  sessionId,
  userPrompt,
  agentResponse,
  toolName,
  toolArguments,
  securityStatus,
}) {
  const db = getDb();
  // Keep logs free of secrets / unnecessary synthetic PII dumps.
  const scrubbedPrompt = String(userPrompt || '').replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED_KEY]');
  const scrubbedResponse = String(agentResponse || '').replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED_KEY]');
  db.prepare(`
    INSERT INTO agent_logs (
      lab_id, session_id, user_prompt, agent_response, tool_name, tool_arguments, security_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    labId || null,
    sessionId || null,
    scrubbedPrompt || null,
    scrubbedResponse || null,
    toolName || null,
    typeof toolArguments === 'string' ? toolArguments : JSON.stringify(toolArguments ?? null),
    securityStatus || null,
    new Date().toISOString(),
  );
}

export function getRecentLogs(limit = 50) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM agent_logs ORDER BY id DESC LIMIT ?
  `).all(limit);
}

function countStatus(fragment) {
  const db = getDb();
  return db.prepare(`
    SELECT COUNT(*) AS c FROM agent_logs WHERE security_status LIKE ?
  `).get(`%${fragment}%`).c;
}

export function getDashboardStats() {
  const db = getDb();
  const totals = db.prepare('SELECT COUNT(*) AS c FROM agent_logs').get().c;
  const toolEvents = db.prepare(`
    SELECT COUNT(*) AS c FROM agent_logs WHERE tool_name IS NOT NULL AND tool_name != ''
  `).get().c;
  const refunds = db.prepare('SELECT COUNT(*) AS c FROM refunds').get().c;
  const seedRefundCount = SEED_REFUNDS.length;
  const simulatedRefunds = Math.max(0, refunds - seedRefundCount);
  const crossTenant = countStatus('CROSS_TENANT') + countStatus('ATTACK OBSERVED');

  const allowed = countStatus('GUARDRAILS ENABLED') - countStatus('AI POLICY BLOCK') - countStatus('BACKEND AUTHORIZATION BLOCK');
  const blocked = countStatus('AI POLICY BLOCK')
    + countStatus('BACKEND AUTHORIZATION BLOCK')
    + countStatus('TOOL ARGUMENT REJECTION')
    + countStatus('REFUND APPROVAL BLOCK');

  return {
    totalAttempts: totals,
    toolEvents,
    simulatedRefunds,
    crossTenantAttempts: crossTenant,
    allowedRequests: Math.max(0, allowed),
    blockedRequests: blocked,
    aiPolicyViolations: countStatus('AI POLICY BLOCK'),
    toolAuthorizationFailures: countStatus('BACKEND AUTHORIZATION BLOCK') + countStatus('TOOL ARGUMENT REJECTION'),
    refundApprovalBlocks: countStatus('REFUND APPROVAL BLOCK'),
    promptInjectionDetections: countStatus('PROMPT INJECTION DETECTION') + countStatus('AI POLICY BLOCK'),
    safeOutputEvents: countStatus('SAFE OUTPUT RENDERED'),
    modelRefusals: countStatus('MODEL REFUSAL'),
    toolSecurityDenials: countStatus('TOOL ARGUMENT REJECTION') + countStatus('BACKEND AUTHORIZATION BLOCK'),
    recent: getRecentLogs(20),
    seedCounts: {
      customers: SEED_CUSTOMERS.length,
      orders: SEED_ORDERS.length,
      refunds: SEED_REFUNDS.length,
      knowledge: SEED_KNOWLEDGE.length,
      adminRecords: SEED_ADMIN_RECORDS.length,
    },
  };
}

export function saveCompareObservation(observation) {
  const db = getDb();
  db.prepare(`
    INSERT INTO compare_observations (
      phase, lab_id, prompt, identity_json, model, retrieved_json, tool_calls_json,
      database_effects_json, guardrail_decisions_json, final_result, security_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    observation.phase || 'phase2',
    observation.labId || null,
    observation.prompt || null,
    JSON.stringify(observation.identity || {}),
    observation.model || null,
    JSON.stringify(observation.retrieved || []),
    JSON.stringify(observation.toolCalls || []),
    JSON.stringify(observation.databaseEffects || []),
    JSON.stringify(observation.guardrailDecisions || {}),
    observation.finalResult || null,
    observation.securityStatus || null,
    new Date().toISOString(),
  );
}

export function getCompareObservations({ labId = null, limit = 50 } = {}) {
  const db = getDb();
  const rows = labId
    ? db.prepare(`
        SELECT * FROM compare_observations
        WHERE lab_id = ?
        ORDER BY id DESC LIMIT ?
      `).all(labId, limit)
    : db.prepare(`
        SELECT * FROM compare_observations
        ORDER BY id DESC LIMIT ?
      `).all(limit);

  return rows.map((row) => ({
    id: row.id,
    phase: row.phase,
    labId: row.lab_id,
    prompt: row.prompt,
    identity: safeJson(row.identity_json, {}),
    model: row.model,
    retrieved: safeJson(row.retrieved_json, []),
    toolCalls: safeJson(row.tool_calls_json, []),
    databaseEffects: safeJson(row.database_effects_json, []),
    guardrailDecisions: safeJson(row.guardrail_decisions_json, {}),
    finalResult: row.final_result,
    securityStatus: row.security_status,
    createdAt: row.created_at,
  }));
}

function safeJson(value, fallback) {
  try {
    return JSON.parse(value || '');
  } catch {
    return fallback;
  }
}

export default {
  createDatabase,
  getDb,
  resetDatabase,
  resetLabData,
  logAgentEvent,
  getRecentLogs,
  getDashboardStats,
  saveCompareObservation,
  getCompareObservations,
};
