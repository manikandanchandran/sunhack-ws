# Student Guide — Phase 1: Build & Break

## Goal

Break six intentionally vulnerable AI-agent integrations mapped to the OWASP Top 10 for LLM Applications **2026**, then prepare TODO hooks for Phase 2 defenses.

## Setup

1. `git clone <repo>`
2. `cd ai-agent-security-labs`
3. `cp .env.example .env` and paste the key your instructor shares after `OPENAI_API_KEY=`
4. `npm ci`
5. `npm start`
6. Open http://localhost:3000

The key is temporary and spend-limited. Keep it in `.env` only: don't paste it into chat, commit it, or share it.

## Rules

- Work only on localhost
- All customers/orders/refunds are synthetic
- If the model refuses an attack, that is a valid observation — use **Direct tool replay** where provided to inspect backend flaws
- Never deploy this app publicly

## Status labels

| Label | Meaning |
|---|---|
| GUARDRAILS DISABLED | Phase 1 application defenses are off |
| TOOL CALL OBSERVED | A local tool actually ran |
| ATTACK OBSERVED | Lab success criteria matched observed behavior |
| ATTACK UNSUCCESSFUL | Attack path exercised but goal not met |
| MODEL REFUSAL | Model declined / refused |
| BACKEND DENIAL | Server or OpenAI rejected the request (for example, rate or spend limit) |
| DEFENSE VERIFIED | Reserved for Phase 2 |

## Lab index

- [Lab 1 — Prompt Injection](labs/lab1.md)
- [Lab 2 — Sensitive Information Disclosure](labs/lab2.md)
- [Lab 3 — Knowledge Source Poisoning](labs/lab3.md)
- [Lab 4 — Excessive Agency](labs/lab4.md)
- [Lab 5 — Unsafe Tool Usage](labs/lab5.md)
- [Lab 6 — Improper Output Handling](labs/lab6.md)

## Reset

Each lab page has **Reset Lab**. It restores seed data, clears that lab’s chats, and clears related logs.
