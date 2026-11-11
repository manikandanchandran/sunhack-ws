import { Router } from 'express';
import { labs, getLab } from '../labs/index.js';
import { resetLabData, resetDatabase, getDb } from '../database/sqlite.js';
import { resetLabConversations } from '../ai/conversation.js';
import { directToolReplay } from '../ai/agent.js';
import { updateKnowledgeArticle, getKnowledgeArticle } from '../tools/knowledge.js';
import { settings } from '../config/settings.js';

const router = Router();

router.get('/api/labs', (_req, res) => {
  res.json({
    labs: labs.map((l) => ({
      id: l.id,
      route: l.route,
      title: l.title,
      owasp: l.owasp,
      objective: l.objective,
      status: settings.guardrailsEnabled ? 'GUARDRAILS ENABLED' : 'GUARDRAILS DISABLED',
    })),
  });
});

router.get('/api/labs/:labId', (req, res) => {
  const lab = getLab(req.params.labId);
  if (!lab) return res.status(404).json({ error: 'Unknown lab' });
  const payload = { ...lab, guardrailsEnabled: settings.guardrailsEnabled };
  if (lab.editableArticleId) {
    payload.editableArticle = getKnowledgeArticle(lab.editableArticleId);
  }
  payload.trustedRefundPolicy = settings.trustedRefundPolicy;
  res.json(payload);
});

router.post('/api/reset', (_req, res) => {
  resetDatabase();
  for (const l of labs) resetLabConversations(l.id);
  res.json({ ok: true, message: 'All lab data, chats, and logs restored.' });
});

router.post('/api/labs/:labId/reset', (req, res) => {
  const lab = getLab(req.params.labId);
  if (!lab) return res.status(404).json({ error: 'Unknown lab' });
  resetLabData(lab.id);
  resetLabConversations(lab.id);
  res.json({ ok: true, labId: lab.id, message: 'Lab records, chats, and logs restored.' });
});

router.post('/api/labs/:labId/knowledge/:articleId', (req, res) => {
  const lab = getLab(req.params.labId);
  if (!lab) return res.status(404).json({ error: 'Unknown lab' });
  const articleId = Number(req.params.articleId);
  if (lab.editableArticleId && lab.editableArticleId !== articleId) {
    return res.status(403).json({ error: 'Article not editable in this lab' });
  }
  const content = String(req.body?.content || '');
  const result = updateKnowledgeArticle(articleId, content);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

router.post('/api/labs/:labId/direct-replay', async (req, res) => {
  const lab = getLab(req.params.labId);
  if (!lab) return res.status(404).json({ error: 'Unknown lab' });
  if (!lab.directReplay) {
    return res.status(400).json({ error: 'This lab has no direct tool replay demo' });
  }

  const toolName = req.body?.toolName || lab.directReplay.toolName;
  const args = req.body?.args || lab.directReplay.args;
  const result = await directToolReplay(toolName, args, {
    id: req.session.id,
    tenantId: req.session.tenantId,
    tenantName: req.session.tenantName,
    customerId: req.session.customerId,
  }, lab.id);

  res.json(result);
});

router.get('/api/labs/:labId/sandbox-html', (req, res) => {
  const lab = getLab(req.params.labId);
  if (!lab || lab.id !== 'lab6') return res.status(404).json({ error: 'Not available' });
  const html = String(req.query.payload || lab.seededHtmlPayload);
  // Intentionally vulnerable demo document — served only for iframe sandbox consumption.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy', "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'");
  res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Sandbox</title></head><body>${html}</body></html>`);
});

router.get('/api/data/preview', (_req, res) => {
  const db = getDb();
  res.json({
    customers: db.prepare('SELECT id, name, tenant_id FROM customers ORDER BY id').all(),
    ordersSample: db.prepare('SELECT id, customer_id, product_name, amount, status FROM orders ORDER BY id LIMIT 8').all(),
  });
});

export default router;
