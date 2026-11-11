import { getDb } from '../database/sqlite.js';
import { authorizeCustomerAccess } from '../security/authorization.js';
import { checkToolCall } from '../security/toolGuardrails.js';
import { settings } from '../config/settings.js';

export async function getCustomerDetails(customerId, context = {}) {
  const guard = await checkToolCall('getCustomerDetails', { customerId }, context);
  if (!guard.allowed) {
    return { error: 'TOOL_BLOCKED', guard };
  }

  const auth = await authorizeCustomerAccess(customerId, context);
  if (!auth.allowed) {
    return {
      error: 'AUTHZ_DENIED',
      auth,
      guard,
      meta: {
        crossTenant: auth.reason?.includes('Cross-tenant') || false,
        note: 'Backend authorization blocked customer access before data reached the LLM',
      },
    };
  }

  const db = getDb();
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  if (!row) {
    return { error: 'NOT_FOUND', customerId, auth, guard };
  }

  const crossTenant =
    context.tenantId && row.tenant_id && context.tenantId !== row.tenant_id;

  return {
    customer: row,
    auth,
    guard,
    meta: {
      crossTenant: Boolean(crossTenant),
      note: settings.guardrailsEnabled
        ? 'Authorized same-identity customer lookup'
        : (crossTenant
          ? 'Phase 1 vulnerability: returned customer outside session tenant'
          : 'same-tenant or no session tenant set'),
    },
  };
}

export async function updateCustomerRecord(customerId, data = {}, context = {}) {
  const guard = await checkToolCall('updateCustomerRecord', { customerId, data }, context);
  if (!guard.allowed) {
    return { error: 'TOOL_BLOCKED', guard };
  }

  const auth = await authorizeCustomerAccess(customerId, context);
  if (!auth.allowed) {
    return { error: 'AUTHZ_DENIED', customerId, auth, guard };
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  if (!existing) {
    return { error: 'NOT_FOUND', customerId, auth, guard };
  }

  const allowedFields = ['name', 'email', 'account_type', 'account_balance'];
  const updates = [];
  const values = [];
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (updates.length === 0) {
    return { error: 'NO_VALID_FIELDS', auth, guard };
  }

  values.push(customerId);
  db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  return { customer: updated, auth, guard, updated: true };
}

export default { getCustomerDetails, updateCustomerRecord };
