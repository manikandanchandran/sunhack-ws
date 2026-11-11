import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { freshApp, withServer, jarFetch, cookieFrom } from './helpers.js';
import { resetDatabase } from '../src/database/sqlite.js';

beforeEach(() => resetDatabase());

describe('lab4 excessive agency (phase 2 defend)', () => {
  it('direct replay blocks synthetic high-value refund without approval', async () => {
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
      assert.equal(replay.data.result.error, 'AUTHZ_DENIED');
      assert.equal(replay.data.result.refund, undefined);
      assert.match(replay.data.result.auth.reason, /manager approval|does not belong|outside/i);
    });
  });
});
