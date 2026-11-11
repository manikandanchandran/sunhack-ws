import { Router } from 'express';
import { getDashboardStats, getRecentLogs } from '../database/sqlite.js';

const router = Router();

router.get('/api/events/recent', (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), 200);
  res.json({ events: getRecentLogs(limit) });
});

router.get('/api/dashboard', (_req, res) => {
  res.json(getDashboardStats());
});

export default router;
