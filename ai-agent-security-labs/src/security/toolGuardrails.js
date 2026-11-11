import { settings } from '../config/settings.js';
import {
  ALLOWED_RESOURCES,
  RESTRICTED_RESOURCES,
  isAllowedToolName,
  toolArgSchemas,
} from './schemas/toolSchemas.js';
import { EVALUATORS, makeResult } from './resultFormat.js';

/**
 * Zod schema validation + resource allowlisting before tool execution.
 * LLM guardrails are never the sole authorization mechanism here.
 */
export async function checkToolCall(toolName, args, context = {}) {
  if (!settings.guardrailsEnabled) {
    return makeResult({
      policy: 'tools',
      decision: 'ALLOW',
      reason: 'Tool guardrails disabled in Phase 1',
      evaluator: EVALUATORS.SCHEMA_VALIDATION,
      allowed: true,
      status: 'DISABLED',
      details: {
        toolName,
        args,
        labId: context.labId || null,
        sessionTenantId: context.tenantId || null,
      },
    });
  }

  if (!isAllowedToolName(toolName)) {
    return makeResult({
      policy: 'tools',
      decision: 'BLOCK',
      reason: `Unknown or disallowed tool: ${toolName}`,
      evaluator: EVALUATORS.SCHEMA_VALIDATION,
      allowed: false,
      status: 'TOOL ARGUMENT REJECTION',
      details: { toolName },
    });
  }

  if (args && typeof args === 'object' && args._parseError) {
    return makeResult({
      policy: 'tools',
      decision: 'BLOCK',
      reason: 'Tool arguments were not valid JSON',
      evaluator: EVALUATORS.SCHEMA_VALIDATION,
      allowed: false,
      status: 'TOOL ARGUMENT REJECTION',
      details: { toolName },
    });
  }

  const schema = toolArgSchemas[toolName];
  if (!schema) {
    return makeResult({
      policy: 'tools',
      decision: 'BLOCK',
      reason: `No schema registered for tool ${toolName}`,
      evaluator: EVALUATORS.SCHEMA_VALIDATION,
      allowed: false,
      status: 'TOOL ARGUMENT REJECTION',
    });
  }

  const parsed = schema.safeParse(args || {});
  if (!parsed.success) {
    return makeResult({
      policy: 'tools',
      decision: 'BLOCK',
      reason: 'Tool arguments failed schema validation',
      evaluator: EVALUATORS.SCHEMA_VALIDATION,
      allowed: false,
      status: 'TOOL ARGUMENT REJECTION',
      details: {
        toolName,
        issues: parsed.error.issues?.map((i) => ({
          path: i.path?.join('.') || '',
          message: i.message,
        })) || [],
      },
    });
  }

  if (toolName === 'queryBusinessData') {
    const resource = parsed.data.resource;
    if (RESTRICTED_RESOURCES.includes(resource)) {
      return makeResult({
        policy: 'tools',
        decision: 'BLOCK',
        reason: 'admin_records is not authorized for shopper sessions',
        evaluator: EVALUATORS.BACKEND_AUTHZ,
        allowed: false,
        status: 'BACKEND AUTHORIZATION BLOCK',
        details: { resource },
      });
    }
    if (!ALLOWED_RESOURCES.includes(resource)) {
      return makeResult({
        policy: 'tools',
        decision: 'BLOCK',
        reason: `Unsupported resource: ${resource}`,
        evaluator: EVALUATORS.SCHEMA_VALIDATION,
        allowed: false,
        status: 'TOOL ARGUMENT REJECTION',
        details: {
          resource,
          allowedResources: [...ALLOWED_RESOURCES],
        },
      });
    }
  }

  return makeResult({
    policy: 'tools',
    decision: 'ALLOW',
    reason: 'Tool name and arguments passed schema/allowlist checks',
    evaluator: EVALUATORS.SCHEMA_VALIDATION,
    allowed: true,
    status: 'ALLOW',
    details: {
      toolName,
      normalizedArgs: parsed.data,
      labId: context.labId || null,
      sessionTenantId: context.tenantId || null,
    },
  });
}

export default { checkToolCall };
