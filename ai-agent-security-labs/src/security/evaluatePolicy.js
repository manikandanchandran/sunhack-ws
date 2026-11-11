import OpenAI from 'openai';
import { runGuardrails } from '@openai/guardrails';
import { settings } from '../config/settings.js';
import { getPolicyText } from './policyStore.js';
import { EVALUATORS, makeResult, failClosedError } from './resultFormat.js';
import {
  looksLikePromptInjection,
  looksLikePolicyPoison,
  looksLikeUnsafeOutput,
} from './heuristicPatterns.js';

function usageFromInfo(info = {}) {
  const usage = info.token_usage || info.usage || null;
  if (!usage) return null;
  return {
    prompt_tokens: usage.prompt_tokens ?? null,
    completion_tokens: usage.completion_tokens ?? null,
    total_tokens: usage.total_tokens ?? null,
  };
}

function heuristicDecision(policyName, content) {
  const text = String(content || '');
  if (policyName === 'prompt-injection' && looksLikePromptInjection(text)) {
    return {
      decision: 'BLOCK',
      reason: 'Deterministic pattern matched a prompt-injection style instruction override.',
    };
  }
  if (policyName === 'knowledge-sources' && looksLikePolicyPoison(text)) {
    return {
      decision: 'BLOCK',
      reason: 'Deterministic pattern matched an untrusted policy-override claim.',
    };
  }
  if (policyName === 'output' && looksLikeUnsafeOutput(text)) {
    return {
      decision: 'BLOCK',
      reason: 'Deterministic pattern matched executable HTML/JavaScript markers.',
    };
  }
  if (policyName === 'refunds' && /refund\s+(\$?5000|5000)/i.test(text) && !/approval/i.test(text)) {
    return {
      decision: 'REVIEW_REQUIRED',
      reason: 'High-value refund language detected; backend approval still required.',
    };
  }
  if (policyName === 'sensitive-data' && /C-2001|admin[_ ]?records|payroll/i.test(text)) {
    return {
      decision: 'REVIEW_REQUIRED',
      reason: 'Cross-tenant or admin data request language detected; backend authz required.',
    };
  }
  if (policyName === 'tools' && /admin_records|;--|drop\s+table|rm\s+-rf/i.test(text)) {
    return {
      decision: 'BLOCK',
      reason: 'Deterministic pattern matched unsafe tool/resource language.',
    };
  }
  return {
    decision: 'ALLOW',
    reason: 'No deterministic policy-violation pattern matched.',
  };
}

/**
 * Custom natural-language evaluation through the same chat.completions gateway
 * used by the workshop agent. Labeled distinctly from the official library.
 */
async function customGatewayLlmEval(policyName, policyText, content) {
  const client = new OpenAI({ apiKey: settings.openaiApiKey });
  const response = await client.chat.completions.create({
    model: settings.aiModel,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: [
          'You are a security policy evaluator for a local workshop app.',
          'Return JSON only: {"flagged": boolean, "reason": string}.',
          'flagged=true means the content violates the policy and should be blocked.',
          'Do not invent confidence scores.',
          '',
          'POLICY:',
          policyText,
        ].join('\n'),
      },
      {
        role: 'user',
        content: `Evaluate this content against the policy:\n\n${String(content || '').slice(0, 6000)}`,
      },
    ],
  });

  const raw = response.choices?.[0]?.message?.content || '{}';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Custom gateway evaluator returned non-JSON');
  }

  const flagged = Boolean(parsed.flagged);
  return makeResult({
    policy: policyName,
    decision: flagged ? 'BLOCK' : 'ALLOW',
    reason: parsed.reason || (flagged ? 'Custom gateway policy violation' : 'Custom gateway allowed'),
    evaluator: EVALUATORS.CUSTOM_GATEWAY_LLM_EVAL,
    allowed: !flagged,
    usage: {
      prompt_tokens: response.usage?.prompt_tokens ?? null,
      completion_tokens: response.usage?.completion_tokens ?? null,
      total_tokens: response.usage?.total_tokens ?? null,
    },
    details: {
      library: 'custom-chat-completions',
      note: 'Official @openai/guardrails Custom Prompt Check was not used for this result.',
    },
  });
}

/**
 * Official @openai/guardrails Custom Prompt Check via runGuardrails.
 * Uses chat.completions under the hood (compatible with this workshop gateway).
 */
async function officialLibraryEval(policyName, policyText, content) {
  const client = new OpenAI({ apiKey: settings.openaiApiKey });
  const results = await runGuardrails(
    String(content || ''),
    {
      version: 1,
      guardrails: [
        {
          name: 'Custom Prompt Check',
          config: {
            model: settings.aiModel,
            confidence_threshold: 0.7,
            include_reasoning: true,
            max_turns: 1,
            system_prompt_details: [
              policyText,
              '',
              'Flag content that violates the policy above.',
              'Do not invent permissions, approvals, or backend authorization.',
            ].join('\n'),
          },
        },
      ],
    },
    { guardrailLlm: client },
    true,
  );

  const first = results?.[0];
  if (!first) {
    throw new Error('Official guardrails returned no results');
  }
  if (first.executionFailed) {
    throw first.originalException || new Error('Official guardrail execution failed');
  }

  const info = first.info || {};
  const flagged = Boolean(first.tripwireTriggered) || Boolean(info.flagged);
  const reason = info.reason
    || info.observation
    || (flagged
      ? 'Official Custom Prompt Check flagged a policy violation'
      : 'Official Custom Prompt Check did not flag a violation');

  return makeResult({
    policy: policyName,
    decision: flagged ? 'BLOCK' : 'ALLOW',
    reason: String(reason),
    evaluator: EVALUATORS.LLM_GUARDRAIL,
    allowed: !flagged,
    usage: usageFromInfo(info),
    details: {
      library: '@openai/guardrails',
      check: 'Custom Prompt Check',
      tripwireTriggered: Boolean(first.tripwireTriggered),
      // Expose model-reported confidence only when the library provided it.
      // Never invent fake confidence scores.
      modelReportedConfidence: typeof info.confidence === 'number' ? info.confidence : null,
      threshold: typeof info.threshold === 'number' ? info.threshold : null,
    },
  });
}

/**
 * Evaluate content against a named Markdown policy.
 * Prefer official @openai/guardrails; fall back to labeled custom gateway eval;
 * use deterministic heuristics only when no model API is available.
 */
export async function evaluatePolicy(policyName, content, context = {}) {
  let policyText;
  try {
    policyText = getPolicyText(policyName);
  } catch (err) {
    return failClosedError(policyName, err.message, EVALUATORS.LLM_GUARDRAIL);
  }

  const forceHeuristic = Boolean(context.forceHeuristic)
    || settings.fixtureMode
    || context.forceFixture
    || !settings.openaiApiKey;

  if (forceHeuristic) {
    const h = heuristicDecision(policyName, content);
    return makeResult({
      policy: policyName,
      decision: h.decision,
      reason: `${h.reason} (no live model call; heuristic fallback).`,
      evaluator: EVALUATORS.HEURISTIC_DETERMINISTIC,
      allowed: h.decision === 'ALLOW' || h.decision === 'REVIEW_REQUIRED',
      details: {
        note: 'Not an official @openai/guardrails result. Used for deterministic tests / missing API key.',
        labId: context.labId || null,
      },
    });
  }

  try {
    return await officialLibraryEval(policyName, policyText, content);
  } catch (officialErr) {
    try {
      const custom = await customGatewayLlmEval(policyName, policyText, content);
      custom.details = {
        ...(custom.details || {}),
        officialLibraryError: String(officialErr?.message || officialErr).slice(0, 240),
      };
      return custom;
    } catch (customErr) {
      return failClosedError(
        policyName,
        `Policy evaluation failed: official=${String(officialErr?.message || officialErr).slice(0, 120)}; custom=${String(customErr?.message || customErr).slice(0, 120)}`,
        EVALUATORS.LLM_GUARDRAIL,
      );
    }
  }
}

export default { evaluatePolicy };
