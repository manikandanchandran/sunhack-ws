/**
 * Phase 1: pass-through retrieved-context guardrail.
 * Phase 2 TODO: isolate untrusted documents as DATA, strip instruction-like
 * content, and prevent document-granted permissions.
 */
export async function checkRetrievedContext(document, context = {}) {
  // TODO(Phase 2): classify injection in retrieved KB content and quarantine.
  return {
    allowed: true,
    status: 'DISABLED',
    reason: 'Retrieved-context guardrails disabled in Phase 1',
    documentId: document?.id ?? null,
    trusted: document?.trusted ?? null,
    context: { labId: context.labId || null },
  };
}

export default { checkRetrievedContext };
