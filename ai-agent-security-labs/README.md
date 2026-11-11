# Build, Break, Defend — AI Agent Security Labs

**FOR LOCAL EDUCATIONAL USE ONLY.** This application contains intentionally vulnerable business-logic integrations for a university cybersecurity workshop. It binds to `127.0.0.1` and must not be deployed publicly.

## Workshop title

**Build, Break, Defend: Securing AI Agents with the OWASP GenAI Top 10**

## What this repo is

Student Phase 1 starter: a local Express app with a real OpenAI-compatible agent loop, in-memory SQLite, six OWASP-mapped labs, and disabled application guardrails.

Natural-language chat uses a **real LLM** (OpenAI). The instructor shares a temporary, spend-limited API key during the session. Students do **not** need their own OpenAI account.

## Requirements

- Node.js **24 LTS or newer**
- The temporary OpenAI API key shared by your instructor
- Internet access to `api.openai.com`

No Docker, local LLM, MySQL/Postgres/Mongo, or cloud account is required.

## Quick start

```bash
git clone <repo-url>
cd ai-agent-security-labs
cp .env.example .env
# paste the instructor's key after OPENAI_API_KEY= in .env
npm ci
npm start
```

Open [http://localhost:3000](http://localhost:3000). The key stays in `.env` on your laptop; the app never sends it to the browser. Never commit `.env`.

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Run student app on `127.0.0.1:3000` |
| `npm test` | Deterministic unit/lab tests |
| `npm run test:lab1` … `test:lab6` | Per-lab tests |
| `npm run test:integration` | Opt-in live model test (`RUN_OPENAI_INTEGRATION=true`) |

## Architecture (Phase 1)

- Chat UI → local Express server → OpenAI Chat Completions, using the key in `.env`
- Tool execution is **always local** to this student app
- In-memory SQLite reseeds on every process start
- Security pass-through hooks exist but return `status: 'DISABLED'`

## Labs (OWASP Top 10 for LLM Applications 2026)

1. **Lab 1** — `LLM01:2026` Prompt Injection
2. **Lab 2** — `LLM02:2026` Sensitive Information Disclosure
3. **Lab 3** — `LLM05:2026` Data and Model Poisoning
4. **Lab 4** — `LLM03:2026` Excessive Agency
5. **Lab 5** — Unsafe tool usage (`LLM03:2026` / ASI02 Tool Misuse)
6. **Lab 6** — `LLM10:2026` Improper Output Handling

Handouts: [`docs/student-guide.md`](docs/student-guide.md) and [`docs/labs/`](docs/labs/).

## Fixture mode

Set `AI_FIXTURE_MODE=true` only for deterministic local tests or instructor fallback. Fixture responses are clearly labeled and must not be treated as live model behavior.

## Phase 2 hooks (not implemented yet)

Wired pass-throughs in `src/security/*`:

- `checkInput`, `checkRetrievedContext`, `checkToolCall`, `checkOutput`
- `authorizeCustomerAccess`, `authorizeRefund`

Do not install `@openai/guardrails` until Phase 2 instructions are issued.

## Safety boundaries

- Listen address: `127.0.0.1`
- Synthetic data only
- No arbitrary SQL, shell, filesystem, or open network-fetch tools
- Lab 6 HTML demo runs only in a sandboxed iframe (`allow-scripts`, no same-origin)

## Warning

Intentionally vulnerable software. **Do not expose to the public internet.**
