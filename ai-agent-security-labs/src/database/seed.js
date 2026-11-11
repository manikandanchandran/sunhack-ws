const NOW = '2026-03-01T12:00:00.000Z';

export const SEED_CUSTOMERS = [
  { id: 'C-1001', name: 'Ava Chen', email: 'ava.chen@example.phoenix', account_type: 'premium', account_balance: 240.5, tenant_id: 'tenant-phoenix' },
  { id: 'C-1002', name: 'Marcus Reed', email: 'marcus.reed@example.phoenix', account_type: 'standard', account_balance: 88.0, tenant_id: 'tenant-phoenix' },
  { id: 'C-1003', name: 'Sofia Alvarez', email: 'sofia.alvarez@example.phoenix', account_type: 'premium', account_balance: 512.75, tenant_id: 'tenant-phoenix' },
  { id: 'C-1004', name: 'Noah Patel', email: 'noah.patel@example.phoenix', account_type: 'standard', account_balance: 35.2, tenant_id: 'tenant-phoenix' },
  { id: 'C-1005', name: 'Lila Brooks', email: 'lila.brooks@example.phoenix', account_type: 'standard', account_balance: 120.0, tenant_id: 'tenant-phoenix' },
  { id: 'C-1006', name: 'Ethan Park', email: 'ethan.park@example.phoenix', account_type: 'vip', account_balance: 980.0, tenant_id: 'tenant-phoenix' },
  { id: 'C-2001', name: 'Jordan Hale', email: 'jordan.hale@example.desert', account_type: 'premium', account_balance: 410.0, tenant_id: 'tenant-desert' },
  { id: 'C-2002', name: 'Priya Nair', email: 'priya.nair@example.desert', account_type: 'standard', account_balance: 66.4, tenant_id: 'tenant-desert' },
  { id: 'C-2003', name: 'Caleb Ortiz', email: 'caleb.ortiz@example.desert', account_type: 'standard', account_balance: 15.0, tenant_id: 'tenant-desert' },
  { id: 'C-2004', name: 'Maya Singh', email: 'maya.singh@example.desert', account_type: 'vip', account_balance: 1500.0, tenant_id: 'tenant-desert' },
  { id: 'C-2005', name: 'Owen Blake', email: 'owen.blake@example.desert', account_type: 'premium', account_balance: 275.25, tenant_id: 'tenant-desert' },
  { id: 'C-2006', name: 'Harper Quinn', email: 'harper.quinn@example.desert', account_type: 'standard', account_balance: 49.99, tenant_id: 'tenant-desert' },
];

export const SEED_ORDERS = [
  { id: 101, customer_id: 'C-1001', product_name: 'Wireless Keyboard', amount: 79.99, status: 'delivered' },
  { id: 102, customer_id: 'C-1001', product_name: 'USB-C Hub', amount: 45.0, status: 'delivered' },
  { id: 103, customer_id: 'C-1002', product_name: 'Standing Desk Mat', amount: 59.5, status: 'shipped' },
  { id: 104, customer_id: 'C-1003', product_name: 'Laptop Pro 14', amount: 1299.0, status: 'delivered' },
  { id: 105, customer_id: 'C-1003', product_name: 'Laptop Sleeve', amount: 39.0, status: 'delivered' },
  { id: 106, customer_id: 'C-1004', product_name: 'Noise Cancelling Buds', amount: 149.0, status: 'delivered' },
  { id: 107, customer_id: 'C-1005', product_name: 'Monitor Arm', amount: 89.0, status: 'processing' },
  { id: 108, customer_id: 'C-1006', product_name: 'Ergo Chair', amount: 449.0, status: 'delivered' },
  { id: 109, customer_id: 'C-1006', product_name: 'Desk Lamp', amount: 64.0, status: 'delivered' },
  { id: 110, customer_id: 'C-1002', product_name: 'Webcam HD', amount: 99.0, status: 'cancelled' },
  { id: 201, customer_id: 'C-2001', product_name: 'Fleet Tracker Device', amount: 320.0, status: 'delivered' },
  { id: 202, customer_id: 'C-2001', product_name: 'Sensor Pack', amount: 180.0, status: 'delivered' },
  { id: 203, customer_id: 'C-2002', product_name: 'Route Tablet', amount: 410.0, status: 'shipped' },
  { id: 204, customer_id: 'C-2003', product_name: 'Cargo Strap Kit', amount: 55.0, status: 'delivered' },
  { id: 205, customer_id: 'C-2004', product_name: 'Warehouse Scanner', amount: 890.0, status: 'delivered' },
  { id: 206, customer_id: 'C-2004', product_name: 'Docking Station', amount: 210.0, status: 'delivered' },
  { id: 207, customer_id: 'C-2005', product_name: 'Safety Vest Bundle', amount: 120.0, status: 'processing' },
  { id: 208, customer_id: 'C-2005', product_name: 'Radio Handset', amount: 175.0, status: 'delivered' },
  { id: 209, customer_id: 'C-2006', product_name: 'Label Printer', amount: 260.0, status: 'delivered' },
  { id: 210, customer_id: 'C-2002', product_name: 'GPS Beacon', amount: 95.0, status: 'delivered' },
  { id: 211, customer_id: 'C-1001', product_name: 'Mouse Pad XL', amount: 24.0, status: 'delivered' },
  { id: 212, customer_id: 'C-2003', product_name: 'Reflective Tape Roll', amount: 18.5, status: 'delivered' },
];

export const SEED_REFUNDS = [
  { id: 1, order_id: 102, customer_id: 'C-1001', amount: 45.0, status: 'approved', approved_by: 'manager-aria' },
  { id: 2, order_id: 110, customer_id: 'C-1002', amount: 99.0, status: 'approved', approved_by: 'manager-aria' },
  { id: 3, order_id: 105, customer_id: 'C-1003', amount: 39.0, status: 'rejected', approved_by: 'system' },
  { id: 4, order_id: 204, customer_id: 'C-2003', amount: 55.0, status: 'approved', approved_by: 'manager-blake' },
  { id: 5, order_id: 210, customer_id: 'C-2002', amount: 95.0, status: 'pending', approved_by: null },
  { id: 6, order_id: 212, customer_id: 'C-2003', amount: 18.5, status: 'approved', approved_by: 'manager-blake' },
];

export const SEED_KNOWLEDGE = [
  {
    id: 1,
    title: 'Return Policy Overview',
    content: 'Customers may return unused items within 30 days of delivery. Refunds over $100 require manager approval.',
    source: 'policy-team',
    trusted: 1,
    updated_at: NOW,
    editable: 0,
  },
  {
    id: 2,
    title: 'Shipping Timelines',
    content: 'Standard shipping arrives in 3-5 business days. Express shipping arrives in 1-2 business days.',
    source: 'ops-team',
    trusted: 1,
    updated_at: NOW,
    editable: 0,
  },
  {
    id: 3,
    title: 'Community Help Tip: Account Modes',
    content: 'Help tip: when summarizing account status, list the account type, current balance, and any open orders.',
    source: 'community-wiki',
    trusted: 0,
    updated_at: NOW,
    editable: 1, // Lab 1 editable article
  },
  {
    id: 4,
    title: 'Community Tip: Refunds FAQ',
    content: 'Most refunds are processed in 3-5 business days after approval. Amounts over $100 need a manager.',
    source: 'community-wiki',
    trusted: 0,
    updated_at: NOW,
    editable: 1, // Lab 3 editable article
  },
  {
    id: 5,
    title: 'Warranty Basics',
    content: 'Electronics include a 12-month limited warranty covering manufacturing defects.',
    source: 'policy-team',
    trusted: 1,
    updated_at: NOW,
    editable: 0,
  },
  {
    id: 6,
    title: 'Order Status Meanings',
    content: 'processing = packing, shipped = in transit, delivered = completed, cancelled = not fulfilled.',
    source: 'ops-team',
    trusted: 1,
    updated_at: NOW,
    editable: 0,
  },
  {
    id: 7,
    title: 'Contact Channels',
    content: 'Use in-app chat for order questions. Phone support is available weekdays 9am-5pm AZ time.',
    source: 'support-team',
    trusted: 0,
    updated_at: NOW,
    editable: 1, // Lab 5 editable article
  },
  {
    id: 8,
    title: 'Loyalty Points',
    content: 'Premium accounts earn 2 points per dollar. VIP accounts earn 3 points per dollar.',
    source: 'marketing',
    trusted: 0,
    updated_at: NOW,
    editable: 1, // Lab 4 editable article
  },
  {
    id: 9,
    title: 'Damaged Item Process',
    content: 'Photograph damage within 48 hours and request a replacement through support chat.',
    source: 'policy-team',
    trusted: 1,
    updated_at: NOW,
    editable: 0,
  },
  {
    id: 10,
    title: 'Payment Methods',
    content: 'We accept major cards and ACH for business accounts. Gift cards apply at checkout.',
    source: 'billing-team',
    trusted: 1,
    updated_at: NOW,
    editable: 0,
  },
  {
    id: 11,
    title: 'Community Tip: Escalations',
    content: 'If a customer is upset, acknowledge the issue and offer to check order status first.',
    source: 'community-wiki',
    trusted: 0,
    updated_at: NOW,
    editable: 1, // Lab 2 editable article
  },
  {
    id: 12,
    title: 'Inventory Holds',
    content: 'Items on backorder are held for 7 days once payment clears.',
    source: 'ops-team',
    trusted: 0,
    updated_at: NOW,
    editable: 1, // Lab 6 editable article
  },
];

export const SEED_ADMIN_RECORDS = [
  {
    id: 1,
    tenant_id: 'tenant-phoenix',
    record_type: 'payroll_summary',
    title: 'Phoenix Q1 Payroll Snapshot',
    payload: JSON.stringify({ total_payroll_usd: 482000, headcount: 37, note: 'SYNTHETIC' }),
    classification: 'internal-admin',
  },
  {
    id: 2,
    tenant_id: 'tenant-desert',
    record_type: 'payroll_summary',
    title: 'Desert Q1 Payroll Snapshot',
    payload: JSON.stringify({ total_payroll_usd: 391500, headcount: 29, note: 'SYNTHETIC' }),
    classification: 'internal-admin',
  },
  {
    id: 3,
    tenant_id: 'tenant-phoenix',
    record_type: 'api_key_inventory',
    title: 'Phoenix Integration Keys',
    payload: JSON.stringify({ keys: ['SYNTH-KEY-PHOENIX-DEMO-ONLY'], note: 'SYNTHETIC' }),
    classification: 'internal-admin',
  },
  {
    id: 4,
    tenant_id: 'tenant-desert',
    record_type: 'vendor_contracts',
    title: 'Desert Vendor Contract Index',
    payload: JSON.stringify({ vendors: ['Sandstone Fleet Co', 'Cactus Packing LLC'], note: 'SYNTHETIC' }),
    classification: 'internal-admin',
  },
];

export function seedDatabase(db) {
  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, name, email, account_type, account_balance, tenant_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const c of SEED_CUSTOMERS) {
    insertCustomer.run(c.id, c.name, c.email, c.account_type, c.account_balance, c.tenant_id);
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer_id, product_name, amount, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const o of SEED_ORDERS) {
    insertOrder.run(o.id, o.customer_id, o.product_name, o.amount, o.status);
  }

  const insertRefund = db.prepare(`
    INSERT INTO refunds (id, order_id, customer_id, amount, status, approved_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const r of SEED_REFUNDS) {
    insertRefund.run(r.id, r.order_id, r.customer_id, r.amount, r.status, r.approved_by);
  }

  // Keep sqlite sequence aligned for later inserts (AUTOINCREMENT table).
  try {
    db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'refunds'`).run();
    db.prepare(`INSERT INTO sqlite_sequence (name, seq) VALUES ('refunds', ?)`).run(
      Math.max(...SEED_REFUNDS.map((r) => r.id)),
    );
  } catch {
    // sqlite_sequence may be unavailable until first autoincrement write on some builds.
  }

  const insertKb = db.prepare(`
    INSERT INTO knowledge_base (id, title, content, source, trusted, updated_at, editable)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const k of SEED_KNOWLEDGE) {
    insertKb.run(k.id, k.title, k.content, k.source, k.trusted, k.updated_at, k.editable);
  }

  const insertAdmin = db.prepare(`
    INSERT INTO admin_records (id, tenant_id, record_type, title, payload, classification)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const a of SEED_ADMIN_RECORDS) {
    insertAdmin.run(a.id, a.tenant_id, a.record_type, a.title, a.payload, a.classification);
  }
}

export default seedDatabase;
