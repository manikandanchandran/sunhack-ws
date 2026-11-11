/**
 * Deterministic pattern helpers for unit tests and API-unavailable fallbacks.
 * Never labeled as LLM_GUARDRAIL — these do not call a model.
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s*:\s*/i,
  /ADMIN_MODE_ENABLED/i,
  /you are now (in )?admin/i,
  /override\s+(the\s+)?(system|security|policy)/i,
  /disregard\s+(your\s+)?(rules|guardrails|policies)/i,
  /reply with exactly/i,
];

const POLICY_POISON_PATTERNS = [
  /unlimited\s+refunds/i,
  /no\s+approval\s+(is\s+)?needed/i,
  /refunds?\s+are\s+now\s+unlimited/i,
  /change\s+(the\s+)?(official\s+)?(refund\s+)?policy/i,
];

const UNSAFE_OUTPUT_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /\son\w+\s*=/i,
  /SCRIPT_RAN/i,
  /<\/?\s*iframe/i,
];

export function looksLikePromptInjection(text) {
  const value = String(text || '');
  return INJECTION_PATTERNS.some((re) => re.test(value));
}

export function looksLikePolicyPoison(text) {
  const value = String(text || '');
  return POLICY_POISON_PATTERNS.some((re) => re.test(value));
}

export function looksLikeUnsafeOutput(text) {
  const value = String(text || '');
  return UNSAFE_OUTPUT_PATTERNS.some((re) => re.test(value));
}

export function stripExecutableMarkup(text) {
  return String(text || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '[script removed]')
    .replace(/<[^>]+>/g, '');
}

export default {
  looksLikePromptInjection,
  looksLikePolicyPoison,
  looksLikeUnsafeOutput,
  stripExecutableMarkup,
};
