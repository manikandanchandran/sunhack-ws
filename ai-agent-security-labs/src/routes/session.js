import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { settings } from '../config/settings.js';

const router = Router();

const DEFAULT_IDENTITY = {
  tenantKey: 'phoenix',
  tenantId: settings.tenants.phoenix.id,
  tenantName: settings.tenants.phoenix.name,
  customerId: 'C-1001',
};

export function ensureSession(req, res, next) {
  if (!req.session) req.session = {};
  if (!req.session.id) {
    req.session.id = randomUUID();
  }
  if (!req.session.tenantId) {
    Object.assign(req.session, DEFAULT_IDENTITY);
  }
  next();
}

router.get('/api/session', (req, res) => {
  res.json({
    sessionId: req.session.id,
    hasApiKey: Boolean(settings.openaiApiKey),
    tenantId: req.session.tenantId,
    tenantName: req.session.tenantName,
    customerId: req.session.customerId,
    tenantKey: req.session.tenantKey,
    tenants: settings.tenants,
    aiMode: settings.fixtureMode ? 'fixture' : settings.aiMode,
    guardrailsEnabled: settings.guardrailsEnabled,
    warning: 'FOR LOCAL EDUCATIONAL USE ONLY — do not expose publicly',
  });
});

router.post('/api/session/identity', (req, res) => {
  const tenantKey = String(req.body?.tenantKey || 'phoenix');
  const customerId = String(req.body?.customerId || 'C-1001');
  const tenant = settings.tenants[tenantKey];
  if (!tenant) {
    return res.status(400).json({ error: 'Unknown tenant' });
  }
  req.session.tenantKey = tenantKey;
  req.session.tenantId = tenant.id;
  req.session.tenantName = tenant.name;
  req.session.customerId = customerId;
  res.json({
    ok: true,
    tenantId: req.session.tenantId,
    tenantName: req.session.tenantName,
    customerId: req.session.customerId,
    note: 'Identity is trusted local session context, not an LLM tool argument.',
  });
});

export default router;
