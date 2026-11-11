/**
 * Structured security evaluation results used across Phase 2 defenses.
 */

export const DECISIONS = Object.freeze(['ALLOW', 'BLOCK', 'REVIEW_REQUIRED', 'ERROR']);

export const EVALUATORS = Object.freeze({
  LLM_GUARDRAIL: 'LLM_GUARDRAIL',
  CUSTOM_GATEWAY_LLM_EVAL: 'CUSTOM_GATEWAY_LLM_EVAL',
  HEURISTIC_DETERMINISTIC: 'HEURISTIC_DETERMINISTIC',
  BACKEND_AUTHZ: 'BACKEND_AUTHZ',
  SCHEMA_VALIDATION: 'SCHEMA_VALIDATION',
  TRUSTED_SOURCE_CHECK: 'TRUSTED_SOURCE_CHECK',
  SAFE_RENDERING: 'SAFE_RENDERING',
});

export const RESULT_LABELS = Object.freeze({
  MODEL_REFUSAL: 'MODEL REFUSAL',
  AI_POLICY_BLOCK: 'AI POLICY BLOCK',
  BACKEND_AUTHORIZATION_BLOCK: 'BACKEND AUTHORIZATION BLOCK',
  TOOL_ARGUMENT_REJECTION: 'TOOL ARGUMENT REJECTION',
  SAFE_OUTPUT_RENDERED: 'SAFE OUTPUT RENDERED',
});

export function makeResult({
  policy,
  decision,
  reason,
  evaluator,
  allowed,
  usage = null,
  details = null,
  status = null,
}) {
  const normalized = DECISIONS.includes(decision) ? decision : 'ERROR';
  const isAllowed = typeof allowed === 'boolean'
    ? allowed
    : normalized === 'ALLOW';

  return {
    policy: policy || null,
    decision: normalized,
    reason: String(reason || ''),
    evaluator: evaluator || null,
    allowed: isAllowed,
    status: status || normalized,
    usage,
    details,
  };
}

export function failClosedError(policy, reason, evaluator = EVALUATORS.LLM_GUARDRAIL) {
  return makeResult({
    policy,
    decision: 'ERROR',
    reason,
    evaluator,
    allowed: false,
    status: 'ERROR',
  });
}

export default {
  DECISIONS,
  EVALUATORS,
  RESULT_LABELS,
  makeResult,
  failClosedError,
};
