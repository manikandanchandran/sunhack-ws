import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { freshApp, withServer, jarFetch, cookieFrom } from './helpers.js';
import { settings } from '../src/config/settings.js';

describe('core routes', () => {
  it('health, labs list, dashboard, reset', async () => {
    const app = freshApp();
    await withServer(app, async (base) => {
      const health = await jarFetch(base, '/health');
      assert.equal(health.data.ok, true);

      const labs = await jarFetch(base, '/api/labs');
      assert.equal(labs.data.labs.length, 6);

      const dash = await jarFetch(base, '/api/dashboard');
      assert.ok(typeof dash.data.totalAttempts === 'number');

      const s = await jarFetch(base, '/api/session');
      const cookie = cookieFrom(s.setCookie);
      const reset = await jarFetch(base, '/api/labs/lab1/reset', {
        method: 'POST',
        cookie,
        body: {},
      });
      assert.equal(reset.data.ok, true);

      if (!settings.openaiApiKey) {
        const chatDenied = await jarFetch(base, '/api/chat/lab1', {
          method: 'POST',
          cookie,
          body: { message: 'hi' },
        });
        assert.equal(chatDenied.res.status, 503);
        assert.equal(chatDenied.data.code, 'API_KEY_MISSING');
      }
    });
  });
});
