import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase, resetLabData, getDb, resetDatabase } from '../src/database/sqlite.js';
import { SEED_CUSTOMERS, SEED_ORDERS, SEED_REFUNDS, SEED_KNOWLEDGE } from '../src/database/seed.js';

describe('sqlite seed and reset', () => {
  it('seeds expected synthetic volumes', () => {
    const db = createDatabase();
    assert.ok(SEED_CUSTOMERS.length >= 10);
    assert.ok(SEED_ORDERS.length >= 20);
    assert.ok(SEED_REFUNDS.length >= 5);
    assert.ok(SEED_KNOWLEDGE.length >= 10);
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM customers').get().c, SEED_CUSTOMERS.length);
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM orders').get().c, SEED_ORDERS.length);
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM refunds').get().c, SEED_REFUNDS.length);
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM knowledge_base').get().c, SEED_KNOWLEDGE.length);
    const tenants = db.prepare('SELECT DISTINCT tenant_id FROM customers').all().map((r) => r.tenant_id);
    assert.ok(tenants.includes('tenant-phoenix'));
    assert.ok(tenants.includes('tenant-desert'));
    db.close();
  });

  it('resetLab restores mutated rows', () => {
    resetDatabase();
    const db = getDb();
    db.prepare(`UPDATE knowledge_base SET content = 'POISON' WHERE id = 4`).run();
    db.prepare(`INSERT INTO refunds (order_id, customer_id, amount, status, approved_by) VALUES (104, 'C-1003', 5000, 'approved', 'x')`).run();
    resetLabData('lab3');
    const article = db.prepare('SELECT content FROM knowledge_base WHERE id = 4').get();
    assert.notEqual(article.content, 'POISON');
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM refunds').get().c, SEED_REFUNDS.length);
  });
});
