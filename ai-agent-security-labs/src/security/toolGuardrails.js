/**
 * Phase 1: pass-through tool-call guardrail.
 * Phase 2 TODO: Zod schema validation, resource allowlisting, and
 * tenant permission enforcement before tool execution.
 */
export async function checkToolCall(toolName, args, context = {}) {
  // TODO(Phase 2): validate args and deny disallowed resources/actions.
  return {
    allowed: true,
    status: 'DISABLED',
    reason: 'Tool guardrails disabled in Phase 1',
    toolName,
    args,
    context: { labId: context.labId || null, sessionTenantId: context.tenantId || null },
  };
}

export default { checkToolCall };
