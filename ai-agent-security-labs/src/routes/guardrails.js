import { Router } from 'express';
import {
  listPolicies,
  getPolicyText,
  setPolicyOverride,
  resetPolicy,
  resetAllPolicies,
  POLICY_FILES,
} from '../security/policyStore.js';
import { evaluatePolicy } from '../security/evaluatePolicy.js';
import { settings } from '../config/settings.js';

const router = Router();

router.get('/api/guardrails/policies', (_req, res) => {
  const policies = listPolicies().map((p) => ({
    ...p,
    text: getPolicyText(p.name),
  }));
  res.json({
    policies,
    note: 'Editing policy text changes LLM policy evaluation only. Backend authorization cannot be disabled from this playground.',
    guardrailsEnabled: settings.guardrailsEnabled,
  });
});

router.get('/api/guardrails/policies/:name', (req, res) => {
  if (!POLICY_FILES[req.params.name]) {
    return res.status(404).json({ error: 'Unknown policy' });
  }
  res.json({
    name: req.params.name,
    text: getPolicyText(req.params.name),
    file: POLICY_FILES[req.params.name],
  });
});

router.put('/api/guardrails/policies/:name', (req, res) => {
  if (!POLICY_FILES[req.params.name]) {
    return res.status(404).json({ error: 'Unknown policy' });
  }
  const text = String(req.body?.text ?? '');
  const saved = setPolicyOverride(req.params.name, text);
  res.json({
    ok: true,
    name: req.params.name,
    text: saved,
    warning: 'Policy text edits do not disable backend authorization, schema validation, or safe rendering.',
  });
});

router.post('/api/guardrails/policies/:name/reset', (req, res) => {
  if (!POLICY_FILES[req.params.name]) {
    return res.status(404).json({ error: 'Unknown policy' });
  }
  res.json({
    ok: true,
    name: req.params.name,
    text: resetPolicy(req.params.name),
  });
});

router.post('/api/guardrails/policies/reset-all', (_req, res) => {
  res.json({ ok: true, policies: resetAllPolicies() });
});

router.post('/api/guardrails/evaluate', async (req, res) => {
  const policyName = String(req.body?.policyName || '');
  const content = String(req.body?.content || '');
  if (!POLICY_FILES[policyName]) {
    return res.status(400).json({ error: 'Unknown policyName' });
  }
  if (!content.trim()) {
    return res.status(400).json({ error: 'content required' });
  }

  const forceHeuristic = Boolean(req.body?.forceHeuristic);
  const result = await evaluatePolicy(policyName, content, {
    labId: 'playground',
    forceHeuristic,
    tenantId: req.session.tenantId,
    customerId: req.session.customerId,
  });

  res.json({
    result,
    disclaimer: [
      'This playground runs real policy evaluation when a model key is available.',
      'Decisions are probabilistic when evaluator is LLM_GUARDRAIL or CUSTOM_GATEWAY_LLM_EVAL.',
      'Changing policy text cannot disable backend authorization.',
    ].join(' '),
  });
});

export default router;
