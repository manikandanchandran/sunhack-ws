import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const POLICIES_DIR = path.resolve(__dirname, '../../policies');

export const POLICY_FILES = Object.freeze({
  'prompt-injection': 'prompt-injection.md',
  'sensitive-data': 'sensitive-data.md',
  'knowledge-sources': 'knowledge-sources.md',
  refunds: 'refunds.md',
  tools: 'tools.md',
  output: 'output.md',
});

/** In-memory overrides for the guardrails playground (never disables backend authz). */
const runtimeOverrides = new Map();

export function listPolicies() {
  return Object.keys(POLICY_FILES).map((name) => ({
    name,
    file: POLICY_FILES[name],
    overridden: runtimeOverrides.has(name),
  }));
}

export function readPolicyFile(policyName) {
  const file = POLICY_FILES[policyName];
  if (!file) {
    throw new Error(`Unknown policy: ${policyName}`);
  }
  const full = path.join(POLICIES_DIR, file);
  return fs.readFileSync(full, 'utf8');
}

export function getPolicyText(policyName) {
  if (runtimeOverrides.has(policyName)) {
    return runtimeOverrides.get(policyName);
  }
  return readPolicyFile(policyName);
}

export function setPolicyOverride(policyName, text) {
  if (!POLICY_FILES[policyName]) {
    throw new Error(`Unknown policy: ${policyName}`);
  }
  runtimeOverrides.set(policyName, String(text ?? ''));
  return getPolicyText(policyName);
}

export function resetPolicy(policyName) {
  if (!POLICY_FILES[policyName]) {
    throw new Error(`Unknown policy: ${policyName}`);
  }
  runtimeOverrides.delete(policyName);
  return readPolicyFile(policyName);
}

export function resetAllPolicies() {
  runtimeOverrides.clear();
  return listPolicies().map((p) => ({
    name: p.name,
    text: readPolicyFile(p.name),
  }));
}

export default {
  POLICIES_DIR,
  POLICY_FILES,
  listPolicies,
  readPolicyFile,
  getPolicyText,
  setPolicyOverride,
  resetPolicy,
  resetAllPolicies,
};
