/**
 * Phase 1: intentionally permissive authorization helpers.
 * Phase 2 TODO: enforce ownership, tenant boundaries, refund eligibility,
 * amount thresholds, and repeat-refund checks on the server.
 */

export async function authorizeCustomerAccess(customerId, context = {}) {
  // TODO(Phase 2): deny when customer.tenant_id !== context.tenantId
  // and when customer is not owned by the selected identity.
  return {
    allowed: true,
    status: 'DISABLED',
    reason: 'Customer ownership checks disabled in Phase 1',
    customerId,
    sessionTenantId: context.tenantId || null,
    sessionCustomerId: context.customerId || null,
  };
}

export async function authorizeRefund(orderId, amount, context = {}) {
  // TODO(Phase 2): require ownership, eligibility, amount <= threshold,
  // manager approval record, and no duplicate refunds.
  return {
    allowed: true,
    status: 'DISABLED',
    reason: 'Refund authorization checks disabled in Phase 1',
    orderId,
    amount,
    sessionTenantId: context.tenantId || null,
    sessionCustomerId: context.customerId || null,
  };
}

export default {
  authorizeCustomerAccess,
  authorizeRefund,
};
