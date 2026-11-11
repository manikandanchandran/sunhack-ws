import { settings } from '../config/settings.js';
import { evaluatePolicy } from './evaluatePolicy.js';
import { EVALUATORS, makeResult } from './resultFormat.js';

/**
 * Input policy evaluation before the agent loop begins.
 */
export async function checkInput(input, context = {}) {
  if (!settings.guardrailsEnabled) {
    return makeResult({
      policy: 'prompt-injection',
      decision: 'ALLOW',
      reason: 'Input guardrails disabled in Phase 1',
      evaluator: EVALUATORS.LLM_GUARDRAIL,
      allowed: true,
      status: 'DISABLED',
      details: {
        inputPreview: String(input || '').slice(0, 120),
        labId: context.labId || null,
      },
    });
  }

  const result = await evaluatePolicy('prompt-injection', input, context);
  // Direct user chat jailbreaks: BLOCK only when clearly flagged.
  // REVIEW_REQUIRED remains allowed for chat routing; backend still enforces mutations.
  if (result.decision === 'ERROR') {
    // Input evaluation errors are logged but do not alone authorize anything.
    // Fail open for ordinary chat availability; sensitive tools still fail closed.
    return {
      ...result,
      allowed: true,
      decision: 'REVIEW_REQUIRED',
      reason: `${result.reason} (input check error treated as REVIEW_REQUIRED; backend authz still enforced)`,
      status: 'REVIEW_REQUIRED',
    };
  }

  if (result.decision === 'BLOCK') {
    return {
      ...result,
      status: 'AI POLICY BLOCK',
      details: {
        ...(result.details || {}),
        inputPreview: String(input || '').slice(0, 120),
        labId: context.labId || null,
      },
    };
  }

  return {
    ...result,
    details: {
      ...(result.details || {}),
      inputPreview: String(input || '').slice(0, 120),
      labId: context.labId || null,
    },
  };
}

export default { checkInput };
