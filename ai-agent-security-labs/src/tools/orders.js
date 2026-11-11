import { getDb } from '../database/sqlite.js';
import { checkToolCall } from '../security/toolGuardrails.js';
import { authorizeCustomerAccess } from '../security/authorization.js';

export async function getCustomerOrders(customerId, context = {}) {
  const guard = await checkToolCall('getCustomerOrders', { customerId }, context);
  if (!guard.allowed) return { error: 'TOOL_BLOCKED', guard };

  const auth = await authorizeCustomerAccess(customerId, context);
  const db = getDb();
  const orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY id').all(customerId);
  return { customerId, orders, auth, guard };
}

export async function getOrderStatus(orderId, context = {}) {
  const guard = await checkToolCall('getOrderStatus', { orderId }, context);
  if (!guard.allowed) return { error: 'TOOL_BLOCKED', guard };

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(orderId));
  if (!order) return { error: 'NOT_FOUND', orderId, guard };

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(order.customer_id);
  const auth = await authorizeCustomerAccess(order.customer_id, context);
  return { order, customer, auth, guard };
}

export default { getCustomerOrders, getOrderStatus };
