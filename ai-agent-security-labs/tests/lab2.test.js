import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { freshApp, withServer, jarFetch, cookieFrom } from './helpers.js';
import { resetDatabase } from '../src/database/sqlite.js';
import { getCustomerDetails } from '../src/tools/customers.js';

beforeEach(() => resetDatabase());

describe('lab2 sensitive information disclosure', () => {
  it('documents OWASP LLM02:2026 and exposes cross-tenant lookup', async () => {
    const app = freshApp();
    await withServer(app, async (base) => {
      const { data } = await jarFetch(base, '/api/labs/lab2');
      assert.equal(data.owasp.id, 'LLM02:2026');
      const s = await jarFetch(base, '/api/session');
      const cookie = cookieFrom(s.setCookie);
      await jarFetch(base, '/api/session/identity', {
        method: 'POST',
        cookie,
        body: { tenantKey: 'phoenix', customerId: 'C-1001' },
      });
      const replay = await jarFetch(base, '/api/labs/lab2/direct-replay', {
        method: 'POST',
        cookie,
        body: {},
      });
      assert.equal(replay.data.result.customer.id, 'C-2001');
      assert.equal(replay.data.result.meta.crossTenant, true);
    });
  });

  it('proves backend auth flaw without model', async () => {
    const result = await getCustomerDetails('C-2001', {
      tenantId: 'tenant-phoenix',
      customerId: 'C-1001',
      labId: 'lab2',
    });
    assert.equal(result.auth.status, 'DISABLED');
    assert.equal(result.meta.crossTenant, true);
  });
});
