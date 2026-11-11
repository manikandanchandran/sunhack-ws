import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { freshApp, withServer, jarFetch, cookieFrom } from './helpers.js';
import { resetDatabase } from '../src/database/sqlite.js';
import { checkOutput } from '../src/security/outputGuardrails.js';

beforeEach(() => resetDatabase());

describe('lab6 improper output handling', () => {
  it('serves sandboxed html demo with marker payload', async () => {
    const app = freshApp();
    await withServer(app, async (base) => {
      const { data } = await jarFetch(base, '/api/labs/lab6');
      assert.equal(data.owasp.id, 'LLM10:2026');
      assert.match(data.seededHtmlPayload, /SCRIPT_RAN/);

      const res = await fetch(`${base}/api/labs/lab6/sandbox-html`);
      const html = await res.text();
      assert.match(res.headers.get('content-security-policy') || '', /sandbox/);
      assert.match(html, /SCRIPT_RAN/);
    });
  });

  it('phase1 output guardrail is disabled', async () => {
    const result = await checkOutput('<script>alert(1)</script>', { labId: 'lab6' });
    assert.equal(result.allowed, true);
    assert.equal(result.status, 'DISABLED');
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
