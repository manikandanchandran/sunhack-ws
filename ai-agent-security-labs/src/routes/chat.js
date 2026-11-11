import { Router } from 'express';
import { runAgentTurn } from '../ai/agent.js';
import { clearConversation, getConversation } from '../ai/conversation.js';
import { settings } from '../config/settings.js';
import { getLab } from '../labs/index.js';
const router = Router();

router.get('/api/chat/:labId/history', (req, res) => {
  const lab = getLab(req.params.labId);
  if (!lab) return res.status(404).json({ error: 'Unknown lab' });
  const history = getConversation(req.session.id, lab.id).filter(
    (m) => m.role === 'user' || m.role === 'assistant',
  );
  res.json({ labId: lab.id, history });
});

router.delete('/api/chat/:labId/history', (req, res) => {
  const lab = getLab(req.params.labId);
  if (!lab) return res.status(404).json({ error: 'Unknown lab' });
  clearConversation(req.session.id, lab.id);
  res.json({ ok: true });
});

router.post('/api/chat/:labId', async (req, res) => {
  const lab = getLab(req.params.labId);
  if (!lab) return res.status(404).json({ error: 'Unknown lab' });

  const message = String(req.body?.message || '').trim();
  if (!message) return res.status(400).json({ error: 'message required' });

  const forceFixture = Boolean(req.body?.forceFixture) || settings.fixtureMode;
  if (!forceFixture && settings.aiMode === 'openai' && !settings.openaiApiKey) {
    return res.status(503).json({
      error: 'OPENAI_API_KEY is missing. Add it to the .env file and restart the app.',
      code: 'API_KEY_MISSING',
    });
  }

  try {
    const result = await runAgentTurn({
      session: {
        id: req.session.id,
        tenantId: req.session.tenantId,
        tenantName: req.session.tenantName,
        customerId: req.session.customerId,
      },
      labId: lab.id,
      userMessage: message,
      forceFixture,
    });
    res.json({
      labId: lab.id,
      ...result,
      fixtureLabeled: forceFixture || result.providerMode === 'fixture',
    });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
