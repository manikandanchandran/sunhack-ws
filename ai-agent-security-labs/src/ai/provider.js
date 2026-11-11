import OpenAI from 'openai';
import { settings } from '../config/settings.js';
import { TOOL_DEFINITIONS } from './toolDefinitions.js';

/**
 * Fixture provider for deterministic unit tests / instructor fallback.
 * Clearly labeled — never silently replaces live model behavior.
 */
export function createFixtureProvider() {
  return {
    mode: 'fixture',
    async chatCompletions({ messages }) {
      // After local tool execution, always finalize — do not re-emit tool calls.
      const lastTool = [...messages].reverse().find((m) => m.role === 'tool');
      if (lastTool) {
        let parsed;
        try {
          parsed = JSON.parse(lastTool.content);
        } catch {
          parsed = { raw: lastTool.content };
        }
        return {
          id: 'fixture-final',
          model: 'fixture-model',
          choices: [{
            message: {
              role: 'assistant',
              content: `FIXTURE_FINAL_RESPONSE: observed tool result ${JSON.stringify(parsed).slice(0, 500)}`,
            },
            finish_reason: 'stop',
          }],
        };
      }

      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      const content = String(lastUser?.content || '');
      const lower = content.toLowerCase();

      // Tool-call fixtures for protocol tests
      if (lower.includes('__fixture_tool_get_customer__')) {
        return {
          id: 'fixture-tool-1',
          model: 'fixture-model',
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_fixture_1',
                type: 'function',
                function: {
                  name: 'getCustomerDetails',
                  arguments: JSON.stringify({ customerId: 'C-2001' }),
                },
              }],
            },
            finish_reason: 'tool_calls',
          }],
        };
      }

      if (lower.includes('__fixture_tool_refund__')) {
        return {
          id: 'fixture-tool-2',
          model: 'fixture-model',
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_fixture_2',
                type: 'function',
                function: {
                  name: 'processRefund',
                  arguments: JSON.stringify({ orderId: 104, amount: 5000 }),
                },
              }],
            },
            finish_reason: 'tool_calls',
          }],
        };
      }

      if (lower.includes('__fixture_tool_admin__')) {
        return {
          id: 'fixture-tool-3',
          model: 'fixture-model',
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_fixture_3',
                type: 'function',
                function: {
                  name: 'queryBusinessData',
                  arguments: JSON.stringify({ resource: 'admin_records', filters: {} }),
                },
              }],
            },
            finish_reason: 'tool_calls',
          }],
        };
      }

      if (lower.includes('__fixture_tool_kb__')) {
        return {
          id: 'fixture-tool-4',
          model: 'fixture-model',
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_fixture_4',
                type: 'function',
                function: {
                  name: 'searchKnowledgeBase',
                  arguments: JSON.stringify({ query: 'refund' }),
                },
              }],
            },
            finish_reason: 'tool_calls',
          }],
        };
      }

      return {
        id: 'fixture-chat',
        model: 'fixture-model',
        choices: [{
          message: {
            role: 'assistant',
            content: `FIXTURE MODE RESPONSE (not a live model): I can help with synthetic orders and policies. You said: "${content.slice(0, 200)}"`,
          },
          finish_reason: 'stop',
        }],
      };
    },
  };
}

export function createOpenAIProvider() {
  if (!settings.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is missing. Add it to the .env file and restart the app.');
  }

  const client = new OpenAI({ apiKey: settings.openaiApiKey });

  return {
    mode: 'openai',
    async chatCompletions({ messages, tools = TOOL_DEFINITIONS }) {
      const response = await client.chat.completions.create({
        model: settings.aiModel,
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.2,
      });
      return response;
    },
  };
}

export function createProvider({ forceFixture = false } = {}) {
  if (forceFixture || settings.fixtureMode || settings.aiMode === 'fixture') {
    return createFixtureProvider();
  }
  return createOpenAIProvider();
}

export default { createProvider, createFixtureProvider, createOpenAIProvider };
