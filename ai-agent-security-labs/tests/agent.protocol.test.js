import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetDatabase } from '../src/database/sqlite.js';
import { runAgentTurn, directToolReplay } from '../src/ai/agent.js';
import { clearConversation } from '../src/ai/conversation.js';

beforeEach(() => {
  resetDatabase();
});

describe('agent tool-calling protocol (fixture, phase 2)', () => {
  const session = {
    id: 'test-session',
    tenantId: 'tenant-phoenix',
    tenantName: 'Phoenix Retail Solutions',
    customerId: 'C-1001',
  };

  it('executes tool calls then returns final fixture response', async () => {
    clearConversation(session.id, 'lab2');
    const result = await runAgentTurn({
      session,
      labId: 'lab2',
      userMessage: '__fixture_tool_get_customer__ please lookup',
      forceFixture: true,
    });
    assert.equal(result.providerMode, 'fixture');
    assert.ok(result.traces.some((t) => t.toolName === 'getCustomerDetails'));
    assert.ok(result.traces.some((t) => t.result?.error === 'AUTHZ_DENIED'));
    assert.match(result.reply, /FIXTURE_FINAL_RESPONSE/);
    assert.match(result.securityStatus, /TOOL CALL OBSERVED/);
    assert.match(result.securityStatus, /BACKEND AUTHORIZATION BLOCK|ATTACK UNSUCCESSFUL|GUARDRAILS ENABLED/);
  });

  it('supports labeled direct tool replay that is blocked by backend authz', async () => {
    const replay = await directToolReplay(
      'processRefund',
      { orderId: 104, amount: 5000 },
      session,
      'lab4',
    );
    assert.equal(replay.mode, 'DIRECT_LOCAL_TOOL_REPLAY');
    assert.equal(replay.result.error, 'AUTHZ_DENIED');
    assert.equal(replay.result.refund, undefined);
  });
});
