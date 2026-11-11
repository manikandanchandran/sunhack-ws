import { DatabaseSync } from 'node:sqlite';
import { SCHEMA_SQL } from './schema.js';
import { seedDatabase, SEED_CUSTOMERS, SEED_ORDERS, SEED_REFUNDS, SEED_KNOWLEDGE, SEED_ADMIN_RECORDS } from './seed.js';

let dbInstance = null;

export function createDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA_SQL);
  seedDatabase(db);
  return db;
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
  // Clear agent logs for the lab
  db.prepare('DELETE FROM agent_logs WHERE lab_id = ?').run(labId);

  // Restore mutable business tables to seed for lab-impacted data.
  // Full table restore keeps labs independent and deterministic.
  db.exec('DELETE FROM refunds;');
  db.exec('DELETE FROM orders;');
  db.exec('DELETE FROM customers;');
  db.exec('DELETE FROM knowledge_base;');
  db.exec('DELETE FROM admin_records;');
  try {
    db.exec(`DELETE FROM sqlite_sequence WHERE name = 'refunds';`);
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
  db.prepare(`
    INSERT INTO agent_logs (
      lab_id, session_id, user_prompt, agent_response, tool_name, tool_arguments, security_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    labId || null,
    sessionId || null,
    userPrompt || null,
    agentResponse || null,
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

export function getDashboardStats() {
  const db = getDb();
  const totals = db.prepare('SELECT COUNT(*) AS c FROM agent_logs').get().c;
  const toolEvents = db.prepare(`
    SELECT COUNT(*) AS c FROM agent_logs WHERE tool_name IS NOT NULL AND tool_name != ''
  `).get().c;
  const refunds = db.prepare('SELECT COUNT(*) AS c FROM refunds').get().c;
  const seedRefundCount = SEED_REFUNDS.length;
  const simulatedRefunds = Math.max(0, refunds - seedRefundCount);
  const crossTenant = db.prepare(`
    SELECT COUNT(*) AS c FROM agent_logs
    WHERE security_status LIKE '%CROSS_TENANT%' OR security_status LIKE '%ATTACK OBSERVED%'
  `).get().c;
  const recent = getRecentLogs(20);
  return {
    totalAttempts: totals,
    toolEvents,
    simulatedRefunds,
    crossTenantAttempts: crossTenant,
    recent,
    seedCounts: {
      customers: SEED_CUSTOMERS.length,
      orders: SEED_ORDERS.length,
      refunds: SEED_REFUNDS.length,
      knowledge: SEED_KNOWLEDGE.length,
      adminRecords: SEED_ADMIN_RECORDS.length,
    },
  };
}

export default {
  createDatabase,
  getDb,
  resetDatabase,
  resetLabData,
  logAgentEvent,
  getRecentLogs,
  getDashboardStats,
};
