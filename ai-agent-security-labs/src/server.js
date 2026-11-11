import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHmac } from 'node:crypto';
import { settings } from './config/settings.js';
import { getDb } from './database/sqlite.js';
import sessionRoutes, { ensureSession } from './routes/session.js';
import chatRoutes from './routes/chat.js';
import labsRoutes from './routes/labs.js';
import eventsRoutes from './routes/events.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

// Simple signed cookie session (server-side values only).
const sessions = new Map();

function readSessionId(req) {
  return req.cookies?.sid || null;
}

function sessionMiddleware(req, res, next) {
  let sid = readSessionId(req);
  if (!sid || !sessions.has(sid)) {
    sid = randomUUID();
    sessions.set(sid, { id: sid, createdAt: Date.now() });
    res.cookie('sid', sid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
  }
  req.session = sessions.get(sid);
  // Soft binding with HMAC so tampering is detectable in logs (local workshop).
  req.sessionFingerprint = createHmac('sha256', settings.sessionSecret)
    .update(sid)
    .digest('hex')
    .slice(0, 12);
  next();
}

export function createApp() {
  getDb(); // initialize in-memory sqlite + seed
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '256kb' }));
  app.use(cookieParser());
  app.use(sessionMiddleware);
  app.use(ensureSession);

  app.use((req, res, next) => {
    res.setHeader('X-Workshop-Warning', 'LOCAL-EDUCATIONAL-USE-ONLY');
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'ai-agent-security-labs',
      phase: 1,
      guardrailsEnabled: settings.guardrailsEnabled,
      bind: `${settings.host}:${settings.port}`,
    });
  });

  app.use(sessionRoutes);
  app.use(chatRoutes);
  app.use(labsRoutes);
  app.use(eventsRoutes);

  app.get('/', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
  app.get('/dashboard', (_req, res) => res.sendFile(path.join(publicDir, 'dashboard.html')));
  app.get('/lab:n', (req, res, next) => {
    const n = Number(req.params.n);
    if (n >= 1 && n <= 6) return res.sendFile(path.join(publicDir, 'lab.html'));
    return next();
  });

  app.use(express.static(publicDir));
  app.use('/docs', express.static(path.resolve(__dirname, '../docs')));

  app.use((err, _req, res, _next) => {
    console.error('[error]', err?.message || err);
    res.status(500).json({ error: 'Internal error' });
  });

  return app;
}

export function startServer() {
  const app = createApp();
  const server = app.listen(settings.port, settings.host, () => {
    console.log('============================================================');
    console.log(' AI Agent Security Labs — Phase 1 (Build & Break)');
    console.log(' FOR LOCAL EDUCATIONAL USE ONLY — bind is localhost');
    console.log(` Open http://localhost:${settings.port}`);
    console.log(` Listening on http://${settings.host}:${settings.port}`);
    console.log(` AI mode: ${settings.fixtureMode ? 'fixture' : settings.aiMode}`);
    console.log('============================================================');
  });
  return server;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  startServer();
}

export default { createApp, startServer };
