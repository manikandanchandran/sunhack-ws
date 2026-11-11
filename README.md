# Sunhacks — AI Agent Security Workshop (Phase 1)

Two separately deployable projects:

| Directory | Audience | Visibility |
|---|---|---|
| `ai-agent-security-labs/` | Students | Public later |
| `ai-workshop-gateway/` | Instructors | **Private** |

Do not publish the gateway repository with the student starter. Keep secrets and access-code plaintext files out of git.

## Quick instructor boot

```bash
# Terminal 1 — private gateway
cd ai-workshop-gateway
cp .env.example .env   # set OPENAI_API_KEY + OPENAI_MODEL
npm ci
npm run generate-codes
npm start

# Terminal 2 — student app
cd ai-agent-security-labs
cp .env.example .env   # set AI_GATEWAY_URL
npm ci
npm start
```

Open http://localhost:3000
