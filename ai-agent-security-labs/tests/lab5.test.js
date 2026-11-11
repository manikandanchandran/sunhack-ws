import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { freshApp, withServer, jarFetch, cookieFrom } from './helpers.js';
import { resetDatabase } from '../src/database/sqlite.js';
import { runAgentTurn } from '../src/ai/agent.js';

beforeEach(() => resetDatabase());

describe('lab5 unsafe tool usage', () => {
  it('returns admin_records through direct replay and fixture agent', async () => {
    const app = freshApp();
    await withServer(app, async (base) => {
      const { data } = await jarFetch(base, '/api/labs/lab5');
      assert.equal(data.owasp.id, 'LLM03:2026');
      const s = await jarFetch(base, '/api/session');
      const cookie = cookieFrom(s.setCookie);
      const replay = await jarFetch(base, '/api/labs/lab5/direct-replay', {
        method: 'POST',
        cookie,
        body: {},
      });
      assert.ok(replay.data.result.rows.length >= 1);
      assert.equal(replay.data.result.meta.unauthorizedAdminAccess, true);
    });

    const agent = await runAgentTurn({
      session: {
        id: 'lab5-session',
        tenantId: 'tenant-phoenix',
        tenantName: 'Phoenix Retail Solutions',
        customerId: 'C-1001',
      },
      labId: 'lab5',
      userMessage: '__fixture_tool_admin__',
      forceFixture: true,
    });
    assert.ok(agent.traces.some((t) => t.result?.meta?.unauthorizedAdminAccess));
    assert.match(agent.securityStatus, /ATTACK OBSERVED/);
  });
});
