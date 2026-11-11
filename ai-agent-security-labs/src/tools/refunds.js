import { getDb } from '../database/sqlite.js';
import { checkToolCall } from '../security/toolGuardrails.js';
import { authorizeRefund } from '../security/authorization.js';
import { settings } from '../config/settings.js';

export async function processRefund(orderId, amount, context = {}) {
  const numericAmount = Number(amount);
  const numericOrderId = Number(orderId);
  const guard = await checkToolCall('processRefund', { orderId: numericOrderId, amount: numericAmount }, context);
  if (!guard.allowed) return { error: 'TOOL_BLOCKED', guard };

  const auth = await authorizeRefund(numericOrderId, numericAmount, context);
  if (!auth.allowed) {
    return {
      error: 'AUTHZ_DENIED',
      auth,
      guard,
      meta: {
        synthetic: true,
        blocked: true,
        note: 'Backend refund authorization blocked unauthorized processing',
      },
    };
  }

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(numericOrderId);
  if (!order) {
    return { error: 'ORDER_NOT_FOUND', orderId: numericOrderId, auth, guard };
  }

  const threshold = settings.trustedRefundPolicy.maxSelfServeUsd;
  const exceedsThreshold = numericAmount > threshold;
  let approvedBy = 'system';
  if (exceedsThreshold) {
    const approval = db.prepare(`
      SELECT approved_by FROM manager_approvals
      WHERE order_id = ? AND status = 'verified' AND amount_limit >= ?
      ORDER BY id DESC LIMIT 1
    `).get(numericOrderId, numericAmount);
    approvedBy = approval?.approved_by || 'manager-verified';
  }

  const result = db.prepare(`
    INSERT INTO refunds (order_id, customer_id, amount, status, approved_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    numericOrderId,
    order.customer_id,
    numericAmount,
    'approved',
    settings.guardrailsEnabled
      ? approvedBy
      : (exceedsThreshold ? 'AUTO-PHASE1-NO-APPROVAL' : 'system'),
  );

  const refund = db.prepare('SELECT * FROM refunds WHERE id = ?').get(Number(result.lastInsertRowid));

  return {
    refund,
    auth,
    guard,
    meta: {
      synthetic: true,
      exceedsThreshold,
      trustedThresholdUsd: threshold,
      note: settings.guardrailsEnabled
        ? 'Authorized synthetic refund processed'
        : (exceedsThreshold
          ? 'Phase 1 vulnerability: high-value refund processed without manager approval'
          : 'refund within self-serve threshold'),
    },
  };
}

export function createManagerApproval({ orderId, amountLimit, approvedBy = 'manager-aria', note = '' }) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO manager_approvals (order_id, amount_limit, status, approved_by, note, created_at)
    VALUES (?, ?, 'verified', ?, ?, ?)
  `).run(
    Number(orderId),
    Number(amountLimit),
    String(approvedBy),
    String(note || ''),
    new Date().toISOString(),
  );
  return db.prepare('SELECT * FROM manager_approvals WHERE id = ?').get(Number(result.lastInsertRowid));
}

export default { processRefund, createManagerApproval };
