# Phase 2 Defend Guide

Beginner-friendly steps for hardening the Phase 1 Build & Break labs. This branch is the instructor defense solution. Students should receive policy files and TODO guidance when Defend begins — not a public copy of the finished solution before the event.

## 1. Install packages

```bash
npm install @openai/guardrails zod sanitize-html
# this branch includes .npmrc with legacy-peer-deps=true because
# openai@4 optionally wants zod@3 while @openai/guardrails@0.3 wants zod@4
```

Installed versions on this branch:

- `@openai/guardrails` — official Custom Prompt Check via `runGuardrails` / `chat.completions`
- `zod` — strict tool argument schemas
- `sanitize-html` — restrictive HTML sanitizer only when rich HTML is required

Verify docs before coding: [OpenAI Guardrails JS](https://openai.github.io/openai-guardrails-js/) and [Custom Prompt Check](https://openai.github.io/openai-guardrails-js/ref/checks/custom_prompt_check/).

Set in `.env` (server-side only, never in the browser):

```env
GUARDRAILS_ENABLED=true
OPENAI_API_KEY=...   # instructor workshop key / gateway credential
AI_MODEL=gpt-4o-mini
```

## 2. Read the plain-English policies

Open `policies/`:

| File | Purpose |
| --- | --- |
| `prompt-injection.md` | Documents/tool results are data, not commands |
| `sensitive-data.md` | Backend ownership before data reaches the model |
| `knowledge-sources.md` | Trusted rules beat wiki articles |
| `refunds.md` | >$100 needs verified manager approval |
| `tools.md` | Allowlisted tools + validated arguments |
| `output.md` | Never execute model HTML/JS |

## 3. Implement checks in the existing hooks

Wire real functions (not status toggles):

- `checkInput` → `src/security/inputGuardrails.js`
- `checkRetrievedContext` → `src/security/contextGuardrails.js`
- `checkToolCall` → `src/security/toolGuardrails.js`
- `checkOutput` → `src/security/outputGuardrails.js`
- `authorizeCustomerAccess` / `authorizeRefund` → `src/security/authorization.js`
- `evaluatePolicy(policyName, content, context)` → reads Markdown and runs evaluation

Structured result shape:

```js
{
  policy: 'prompt-injection',
  decision: 'BLOCK', // ALLOW | BLOCK | REVIEW_REQUIRED | ERROR
  reason: '...',
  evaluator: 'LLM_GUARDRAIL' // or BACKEND_AUTHZ, SCHEMA_VALIDATION, ...
}
```

Important labels to keep distinct:

- MODEL REFUSAL
- AI POLICY BLOCK
- BACKEND AUTHORIZATION BLOCK
- TOOL ARGUMENT REJECTION
- SAFE OUTPUT RENDERED

An LLM guardrail must never be the only control for database access, refunds, tool permissions, or browser code execution.

## 4. Lab defenses (same six attacks)

1. **Prompt injection** — quarantine instruction-like wiki text; trusted/untrusted boundaries; distinguish model refusal vs policy block.
2. **Sensitive data** — session tenant/customer checks before returning records.
3. **Knowledge poisoning** — cite authoritative backend refund policy; articles cannot rewrite limits.
4. **Excessive agency** — refund tool enforces >$100 verified approval, ownership, eligibility, no duplicates.
5. **Unsafe tools** — Zod schemas, resource allowlist, parameterized SQL only, deny `admin_records`.
6. **Improper output** — plain `textContent` chat; isolated `?demo=1` sandbox for before/after only.

## 5. Replay original attacks

Use the same Try Prompts on `/lab1`…`/lab6`, plus **Prove backend block** where available. Then open:

- `/guardrails` — edit policy text, run real evaluations
- `/compare` — Phase 1 saved observations vs Phase 2 outcomes
- `/dashboard` — allowed/blocked, authz failures, refund blocks, safe-output events

## 6. Run tests

```bash
npm test
npm run test:security
npm run test:guardrails
npm run test:integration   # opt-in; needs RUN_OPENAI_INTEGRATION=true
```

Deterministic unit tests must pass without a live model. Integration tests call the gateway only when explicitly enabled.

## 7. Release notes for instructors

- Keep this complete solution in a **private** repo or unpublished patch.
- Do not commit instructor credentials.
- Do not publish the finished defend branch to the public student starter before the event.
- Student starter should keep pass-through TODOs until Defend begins.
