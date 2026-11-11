import { getDb } from '../database/sqlite.js';
import { settings } from '../config/settings.js';
import { EVALUATORS, makeResult } from './resultFormat.js';

/**
 * Trusted tenant/customer identity comes from authenticated local session context only.
 */
export async function authorizeCustomerAccess(customerId, context = {}) {
  if (!settings.guardrailsEnabled) {
    return makeResult({
      policy: 'sensitive-data',
      decision: 'ALLOW',
      reason: 'Customer ownership checks disabled in Phase 1',
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: true,
      status: 'DISABLED',
      details: {
        customerId,
        sessionTenantId: context.tenantId || null,
        sessionCustomerId: context.customerId || null,
      },
    });
  }

  if (!context.tenantId || !context.customerId) {
    return makeResult({
      policy: 'sensitive-data',
      decision: 'BLOCK',
      reason: 'Missing authenticated session tenant/customer context',
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: false,
      status: 'BACKEND AUTHORIZATION BLOCK',
      details: { customerId },
    });
  }

  const db = getDb();
  const row = db.prepare('SELECT id, tenant_id FROM customers WHERE id = ?').get(customerId);
  if (!row) {
    return makeResult({
      policy: 'sensitive-data',
      decision: 'BLOCK',
      reason: 'Customer not found',
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: false,
      status: 'BACKEND AUTHORIZATION BLOCK',
      details: { customerId },
    });
  }

  if (row.tenant_id !== context.tenantId) {
    return makeResult({
      policy: 'sensitive-data',
      decision: 'BLOCK',
      reason: 'Cross-tenant customer access denied',
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: false,
      status: 'BACKEND AUTHORIZATION BLOCK',
      details: {
        customerId,
        customerTenantId: row.tenant_id,
        sessionTenantId: context.tenantId,
      },
    });
  }

  // Workshop rule: shoppers may only read their own customer record unless same-tenant self lookup.
  if (row.id !== context.customerId) {
    return makeResult({
      policy: 'sensitive-data',
      decision: 'BLOCK',
      reason: 'Customer record is outside the authenticated shopper identity',
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: false,
      status: 'BACKEND AUTHORIZATION BLOCK',
      details: {
        customerId,
        sessionCustomerId: context.customerId,
      },
    });
  }

  return makeResult({
    policy: 'sensitive-data',
    decision: 'ALLOW',
    reason: 'Customer belongs to authenticated tenant and shopper identity',
    evaluator: EVALUATORS.BACKEND_AUTHZ,
    allowed: true,
    status: 'ALLOW',
    details: {
      customerId,
      sessionTenantId: context.tenantId,
      sessionCustomerId: context.customerId,
    },
  });
}

export async function authorizeRefund(orderId, amount, context = {}) {
  const numericAmount = Number(amount);
  const numericOrderId = Number(orderId);

  if (!settings.guardrailsEnabled) {
    return makeResult({
      policy: 'refunds',
      decision: 'ALLOW',
      reason: 'Refund authorization checks disabled in Phase 1',
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: true,
      status: 'DISABLED',
      details: {
        orderId: numericOrderId,
        amount: numericAmount,
        sessionTenantId: context.tenantId || null,
        sessionCustomerId: context.customerId || null,
      },
    });
  }

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return makeResult({
      policy: 'refunds',
      decision: 'BLOCK',
      reason: 'Refund amount must be a positive number',
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: false,
      status: 'BACKEND AUTHORIZATION BLOCK',
    });
  }

  if (!context.tenantId || !context.customerId) {
    return makeResult({
      policy: 'refunds',
      decision: 'BLOCK',
      reason: 'Missing authenticated session context for refund',
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: false,
      status: 'BACKEND AUTHORIZATION BLOCK',
    });
  }

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(numericOrderId);
  if (!order) {
    return makeResult({
      policy: 'refunds',
      decision: 'BLOCK',
      reason: 'Order not found',
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: false,
      status: 'BACKEND AUTHORIZATION BLOCK',
      details: { orderId: numericOrderId },
    });
  }

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(order.customer_id);
  if (!customer || customer.tenant_id !== context.tenantId) {
    return makeResult({
      policy: 'refunds',
      decision: 'BLOCK',
      reason: 'Order is outside the authenticated tenant',
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: false,
      status: 'BACKEND AUTHORIZATION BLOCK',
    });
  }

  if (order.customer_id !== context.customerId) {
    return makeResult({
      policy: 'refunds',
      decision: 'BLOCK',
      reason: 'Order does not belong to the authenticated customer',
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: false,
      status: 'BACKEND AUTHORIZATION BLOCK',
    });
  }

  if (!['delivered', 'shipped'].includes(String(order.status))) {
    return makeResult({
      policy: 'refunds',
      decision: 'BLOCK',
      reason: `Order status ${order.status} is not eligible for refund`,
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: false,
      status: 'BACKEND AUTHORIZATION BLOCK',
    });
  }

  const existing = db.prepare(`
    SELECT id FROM refunds
    WHERE order_id = ? AND status IN ('approved', 'pending')
    LIMIT 1
  `).get(numericOrderId);
  if (existing) {
    return makeResult({
      policy: 'refunds',
      decision: 'BLOCK',
      reason: 'Duplicate refund blocked for this order',
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: false,
      status: 'BACKEND AUTHORIZATION BLOCK',
      details: { existingRefundId: existing.id },
    });
  }

  const threshold = settings.trustedRefundPolicy.maxSelfServeUsd;
  if (numericAmount > threshold) {
    const approval = db.prepare(`
      SELECT * FROM manager_approvals
      WHERE order_id = ?
        AND status = 'verified'
        AND amount_limit >= ?
      ORDER BY id DESC
      LIMIT 1
    `).get(numericOrderId, numericAmount);

    if (!approval) {
      return makeResult({
        policy: 'refunds',
        decision: 'BLOCK',
        reason: `Refund above $${threshold} requires a verified manager approval record`,
        evaluator: EVALUATORS.BACKEND_AUTHZ,
        allowed: false,
        status: 'BACKEND AUTHORIZATION BLOCK',
        details: {
          amount: numericAmount,
          threshold,
          note: 'User or model statements are not manager approval',
        },
      });
    }
  }

  if (numericAmount > Number(order.amount) * 1.05) {
    return makeResult({
      policy: 'refunds',
      decision: 'BLOCK',
      reason: 'Refund amount exceeds order value',
      evaluator: EVALUATORS.BACKEND_AUTHZ,
      allowed: false,
      status: 'BACKEND AUTHORIZATION BLOCK',
      details: { amount: numericAmount, orderAmount: order.amount },
    });
  }

  return makeResult({
    policy: 'refunds',
    decision: 'ALLOW',
    reason: 'Refund authorized for authenticated customer order',
    evaluator: EVALUATORS.BACKEND_AUTHZ,
    allowed: true,
    status: 'ALLOW',
    details: {
      orderId: numericOrderId,
      amount: numericAmount,
      threshold,
    },
  });
}

export default {
  authorizeCustomerAccess,
  authorizeRefund,
};
