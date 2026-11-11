/**
 * Phase 1: pass-through output guardrail.
 * Phase 2 TODO: prefer textContent for chat responses; apply restrictive
 * sanitization only when HTML is explicitly required.
 */
export async function checkOutput(response, context = {}) {
  // TODO(Phase 2): sanitize / neutralize untrusted HTML and markers.
  return {
    allowed: true,
    status: 'DISABLED',
    reason: 'Output guardrails disabled in Phase 1',
    responsePreview: String(response || '').slice(0, 120),
    context: { labId: context.labId || null },
  };
}

export default { checkOutput };
