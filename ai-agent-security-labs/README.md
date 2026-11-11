# Build, Break, Defend — AI Agent Security Labs (Phase 2 / Guardrail branch)

**FOR LOCAL EDUCATIONAL USE ONLY.** Instructor defense solution for the university cybersecurity workshop. Binds to `127.0.0.1` and must not be deployed publicly.

Keep this branch **private / unpublished** relative to the student starter. Students should not receive the complete defend solution before the event.

## Workshop title

**Build, Break, Defend: Securing AI Agents with the OWASP GenAI Top 10**

## What this branch is

Phase 2 instructor solution on top of the Phase 1 Build & Break app:

- Same six labs, same LLM gateway, same local tools, same seeded SQLite dataset
- Plain-English policies in `policies/`
- Real enforcement: input/context/tool/output checks + backend authorization
- `/guardrails` playground, `/compare` before/after view, extended `/dashboard`
- Official `@openai/guardrails` Custom Prompt Check where compatible; labeled custom gateway fallback otherwise

## Requirements

- Node.js **24 LTS or newer**
- Instructor workshop API key in `.env` (`OPENAI_API_KEY`)
- `GUARDRAILS_ENABLED=true`

## Quick start

```bash
cd ai-agent-security-labs
cp .env.example .env   # if needed
# paste the instructor key after OPENAI_API_KEY=
npm install --legacy-peer-deps
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Run Phase 2 app on `127.0.0.1:3000` |
| `npm test` | Full deterministic suite |
| `npm run test:security` | Authorization / validation regressions |
| `npm run test:guardrails` | Policy playground + evaluation tests |
| `npm run test:integration` | Opt-in live model + guardrail gateway tests |

## Defense layers

`user input → checkInput → real model → checkRetrievedContext → tool call → checkToolCall + backend authz → local tool → checkOutput → safe text rendering`

Evaluator types: `LLM_GUARDRAIL`, `CUSTOM_GATEWAY_LLM_EVAL`, `HEURISTIC_DETERMINISTIC`, `BACKEND_AUTHZ`, `SCHEMA_VALIDATION`, `TRUSTED_SOURCE_CHECK`, `SAFE_RENDERING`.

Student-facing defend walkthrough: [`docs/defense-guide.md`](docs/defense-guide.md).

## Safety boundaries

- Listen address: `127.0.0.1`
- Synthetic data only; simulated refunds only
- No arbitrary SQL, shell, filesystem, or open network-fetch tools
- Never commit `.env` or instructor credentials
- Vulnerable Lab 6 HTML sandbox is isolated behind `?demo=1` for comparison only
