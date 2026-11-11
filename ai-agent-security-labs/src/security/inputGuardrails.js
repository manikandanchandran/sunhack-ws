/**
 * Phase 1: pass-through input guardrail.
 * Phase 2 TODO: install @openai/guardrails and classify prompt-injection /
 * jailbreak patterns before the agent loop begins.
 */
export async function checkInput(input, context = {}) {
  // TODO(Phase 2): enforce instructor-provided input rules here.
  return {
    allowed: true,
    status: 'DISABLED',
    reason: 'Input guardrails disabled in Phase 1',
    inputPreview: String(input || '').slice(0, 120),
    context: { labId: context.labId || null },
  };
}

export default { checkInput };
