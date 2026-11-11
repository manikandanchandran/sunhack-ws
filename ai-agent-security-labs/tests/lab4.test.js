import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { freshApp, withServer, jarFetch, cookieFrom } from './helpers.js';
import { resetDatabase } from '../src/database/sqlite.js';

beforeEach(() => resetDatabase());

describe('lab4 excessive agency', () => {
  it('direct replay creates synthetic high-value refund', async () => {
    const app = freshApp();
    await withServer(app, async (base) => {
      const { data } = await jarFetch(base, '/api/labs/lab4');
      assert.equal(data.owasp.id, 'LLM03:2026');
      const s = await jarFetch(base, '/api/session');
      const cookie = cookieFrom(s.setCookie);
      const replay = await jarFetch(base, '/api/labs/lab4/direct-replay', {
        method: 'POST',
        cookie,
        body: {},
      });
      assert.equal(replay.data.result.refund.amount, 5000);
      assert.equal(replay.data.result.meta.synthetic, true);
    });
  });
});
