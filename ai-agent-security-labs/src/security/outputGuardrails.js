import sanitizeHtml from 'sanitize-html';
import { settings } from '../config/settings.js';
import { evaluatePolicy } from './evaluatePolicy.js';
import { EVALUATORS, makeResult } from './resultFormat.js';
import { looksLikeUnsafeOutput, stripExecutableMarkup } from './heuristicPatterns.js';

/**
 * Restrictive sanitizer used only when HTML is explicitly required.
 * Normal chat should prefer plain text (textContent on the client).
 */
export function sanitizeRichHtml(html) {
  return sanitizeHtml(String(html || ''), {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}

export async function checkOutput(response, context = {}) {
  const text = String(response || '');

  if (!settings.guardrailsEnabled) {
    return makeResult({
      policy: 'output',
      decision: 'ALLOW',
      reason: 'Output guardrails disabled in Phase 1',
      evaluator: EVALUATORS.SAFE_RENDERING,
      allowed: true,
      status: 'DISABLED',
      details: {
        responsePreview: text.slice(0, 120),
        labId: context.labId || null,
      },
    });
  }

  // Hard safe-rendering boundary — never rely solely on the LLM check.
  if (looksLikeUnsafeOutput(text) || /<script/i.test(text)) {
    const safeText = stripExecutableMarkup(text);
    return makeResult({
      policy: 'output',
      decision: 'BLOCK',
      reason: 'Executable HTML/JavaScript markers neutralized for safe rendering',
      evaluator: EVALUATORS.SAFE_RENDERING,
      allowed: false,
      status: 'SAFE OUTPUT RENDERED',
      details: {
        responsePreview: text.slice(0, 120),
        safeText,
        sanitizedHtml: sanitizeRichHtml(text),
        renderMode: 'text',
        labId: context.labId || null,
      },
    });
  }

  const llm = await evaluatePolicy('output', text, context);
  if (llm.decision === 'BLOCK' || llm.decision === 'ERROR') {
    return {
      ...llm,
      allowed: false,
      status: llm.decision === 'ERROR' ? 'ERROR' : 'SAFE OUTPUT RENDERED',
      evaluator: llm.decision === 'ERROR' ? EVALUATORS.SAFE_RENDERING : llm.evaluator,
      details: {
        ...(llm.details || {}),
        safeText: stripExecutableMarkup(text),
        renderMode: 'text',
        responsePreview: text.slice(0, 120),
      },
    };
  }

  return makeResult({
    policy: 'output',
    decision: 'ALLOW',
    reason: 'Output accepted for plain-text rendering',
    evaluator: EVALUATORS.SAFE_RENDERING,
    allowed: true,
    status: 'SAFE OUTPUT RENDERED',
    usage: llm.usage,
    details: {
      responsePreview: text.slice(0, 120),
      renderMode: 'text',
      llm,
      labId: context.labId || null,
    },
  });
}

export default { checkOutput, sanitizeRichHtml };
