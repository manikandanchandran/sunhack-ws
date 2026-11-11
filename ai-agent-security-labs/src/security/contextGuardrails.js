import { settings } from '../config/settings.js';
import { evaluatePolicy } from './evaluatePolicy.js';
import { EVALUATORS, makeResult } from './resultFormat.js';
import { looksLikePromptInjection, looksLikePolicyPoison } from './heuristicPatterns.js';

/**
 * Retrieved-context guardrail. Untrusted documents are DATA, never permission grants.
 */
export async function checkRetrievedContext(document, context = {}) {
  if (!settings.guardrailsEnabled) {
    return makeResult({
      policy: 'prompt-injection',
      decision: 'ALLOW',
      reason: 'Retrieved-context guardrails disabled in Phase 1',
      evaluator: EVALUATORS.LLM_GUARDRAIL,
      allowed: true,
      status: 'DISABLED',
      details: {
        documentId: document?.id ?? null,
        trusted: document?.trusted ?? null,
        labId: context.labId || null,
      },
    });
  }

  const trusted = Boolean(Number(document?.trusted));
  if (trusted) {
    return makeResult({
      policy: 'knowledge-sources',
      decision: 'ALLOW',
      reason: 'Trusted authoritative source metadata',
      evaluator: EVALUATORS.TRUSTED_SOURCE_CHECK,
      allowed: true,
      status: 'ALLOW',
      details: {
        documentId: document?.id ?? null,
        source: document?.source ?? null,
        trusted: true,
      },
    });
  }

  const content = String(document?.content || '');
  // Hard backend boundary: documents never grant permissions even if LLM says allow.
  if (looksLikePromptInjection(content) || looksLikePolicyPoison(content)) {
    return makeResult({
      policy: 'prompt-injection',
      decision: 'BLOCK',
      reason: 'Retrieved content attempted to override trusted instructions or business rules',
      evaluator: EVALUATORS.TRUSTED_SOURCE_CHECK,
      allowed: false,
      status: 'AI POLICY BLOCK',
      details: {
        documentId: document?.id ?? null,
        trusted: false,
        quarantined: true,
        labId: context.labId || null,
      },
    });
  }

  const llm = await evaluatePolicy('prompt-injection', content, context);
  const knowledge = await evaluatePolicy('knowledge-sources', content, context);

  const blocked = [llm, knowledge].find((r) => r.decision === 'BLOCK' || r.decision === 'ERROR');
  if (blocked) {
    return {
      ...blocked,
      allowed: false,
      status: blocked.decision === 'ERROR' ? 'ERROR' : 'AI POLICY BLOCK',
      details: {
        ...(blocked.details || {}),
        documentId: document?.id ?? null,
        trusted: false,
        quarantined: true,
        relatedChecks: { llm, knowledge },
      },
    };
  }

  return makeResult({
    policy: 'prompt-injection',
    decision: 'ALLOW',
    reason: 'Untrusted document accepted as data only; cannot grant permissions',
    evaluator: llm.evaluator || EVALUATORS.LLM_GUARDRAIL,
    allowed: true,
    status: 'ALLOW',
    usage: llm.usage,
    details: {
      documentId: document?.id ?? null,
      trusted: false,
      presentationMode: 'DATA_ONLY',
      llm,
      knowledge,
    },
  });
}

export default { checkRetrievedContext };
