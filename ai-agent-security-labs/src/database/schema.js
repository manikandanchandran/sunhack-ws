export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_balance REAL NOT NULL DEFAULT 0,
  tenant_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  customer_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS refunds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  customer_id TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL,
  approved_by TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  trusted INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  editable INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS agent_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lab_id TEXT,
  session_id TEXT,
  user_prompt TEXT,
  agent_response TEXT,
  tool_name TEXT,
  tool_arguments TEXT,
  security_status TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_records (
  id INTEGER PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  title TEXT NOT NULL,
  payload TEXT NOT NULL,
  classification TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lab_state (
  lab_id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL
);
`;

export default SCHEMA_SQL;
