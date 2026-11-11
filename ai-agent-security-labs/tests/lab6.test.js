import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { freshApp, withServer, jarFetch } from './helpers.js';
import { resetDatabase } from '../src/database/sqlite.js';
import { checkOutput } from '../src/security/outputGuardrails.js';

beforeEach(() => resetDatabase());

describe('lab6 improper output handling (phase 2 defend)', () => {
  it('keeps isolated vulnerable demo behind demo=1 only', async () => {
    const app = freshApp();
    await withServer(app, async (base) => {
      const { data } = await jarFetch(base, '/api/labs/lab6');
      assert.equal(data.owasp.id, 'LLM10:2026');
      assert.match(data.seededHtmlPayload, /SCRIPT_RAN/);

      const blocked = await fetch(`${base}/api/labs/lab6/sandbox-html`);
      assert.equal(blocked.status, 403);

      const res = await fetch(`${base}/api/labs/lab6/sandbox-html?demo=1`);
      const html = await res.text();
      assert.match(res.headers.get('content-security-policy') || '', /sandbox/);
      assert.match(html, /SCRIPT_RAN/);
    });
  });

  it('phase2 output guardrail neutralizes script markers', async () => {
    const result = await checkOutput('<script>alert(1)</script>', { labId: 'lab6' });
    assert.equal(result.allowed, false);
    assert.equal(result.evaluator, 'SAFE_RENDERING');
    assert.equal(result.status, 'SAFE OUTPUT RENDERED');
  });

  it('lab route html page is available', async () => {
    const app = freshApp();
    await withServer(app, async (base) => {
      const res = await fetch(`${base}/lab6`);
      assert.equal(res.status, 200);
      const text = await res.text();
      assert.match(text, /Live chat/);
    });
  });
});
