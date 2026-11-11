import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAIProvider } from '../src/ai/provider.js';

/**
 * Opt-in real-provider integration.
 * Set RUN_OPENAI_INTEGRATION=true and OPENAI_API_KEY in .env.
 */
describe('OpenAI integration (credential-gated)', () => {
  it('skips unless RUN_OPENAI_INTEGRATION=true', async () => {
    if (process.env.RUN_OPENAI_INTEGRATION !== 'true') {
      assert.ok(true, 'skipped — set RUN_OPENAI_INTEGRATION=true to call the live model');
      return;
    }
    const provider = createOpenAIProvider();
    const data = await provider.chatCompletions({
      messages: [{ role: 'user', content: 'Reply with the single word PONG' }],
    });
    assert.ok(data.choices?.[0]?.message);
  });
});
