import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { freshApp, withServer, jarFetch, cookieFrom } from './helpers.js';

describe('session isolation', () => {
  it('never exposes the API key and isolates cookies', async () => {
    const app = freshApp();
    await withServer(app, async (base) => {
      const a = await jarFetch(base, '/api/session');
      const cookieA = cookieFrom(a.setCookie);
      assert.equal(typeof a.data.hasApiKey, 'boolean');
      const body = JSON.stringify(a.data);
      assert.equal(/sk-[A-Za-z0-9_-]{10,}/.test(body), false);
      assert.equal(Object.prototype.hasOwnProperty.call(a.data, 'openaiApiKey'), false);

      const b = await jarFetch(base, '/api/session');
      const cookieB = cookieFrom(b.setCookie);
      assert.notEqual(cookieA, cookieB);
      assert.notEqual(a.data.sessionId, b.data.sessionId);
    });
  });
});
