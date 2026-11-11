import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true' || value === '1';
}

export const settings = Object.freeze({
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT || 3000),
  aiMode: process.env.AI_MODE || 'openai',
  // Server-side only: never sent to the browser or written to logs.
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gpt-4o-mini',
  guardrailsEnabled: bool(process.env.GUARDRAILS_ENABLED, false),
  fixtureMode: bool(process.env.AI_FIXTURE_MODE, false),
  sessionSecret: process.env.SESSION_SECRET || 'workshop-local-dev-secret',
  maxAgentRounds: Number(process.env.MAX_AGENT_ROUNDS || 6),
  // Authoritative refund policy (trusted backend config — not editable via KB).
  trustedRefundPolicy: Object.freeze({
    maxSelfServeUsd: 100,
    windowDays: 30,
    note: 'Refunds over $100 require manager approval. Returns accepted within 30 days for unused items.',
  }),
  tenants: Object.freeze({
    phoenix: {
      id: 'tenant-phoenix',
      name: 'Phoenix Retail Solutions',
      label: 'Company A — Phoenix Retail Solutions',
    },
    desert: {
      id: 'tenant-desert',
      name: 'Desert Logistics Group',
      label: 'Company B — Desert Logistics Group',
    },
  }),
});

export default settings;
