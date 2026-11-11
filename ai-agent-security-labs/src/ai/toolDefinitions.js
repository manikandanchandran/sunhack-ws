export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'getCustomerDetails',
      description: 'Retrieve a synthetic customer record by customer id.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          customerId: { type: 'string', description: 'Customer id such as C-1001' },
        },
        required: ['customerId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCustomerOrders',
      description: 'List synthetic orders for a customer id.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          customerId: { type: 'string' },
        },
        required: ['customerId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getOrderStatus',
      description: 'Get status for a synthetic order id.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          orderId: { type: 'integer' },
        },
        required: ['orderId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchKnowledgeBase',
      description: 'Search synthetic help articles and policies by keyword.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateKnowledgeArticle',
      description:
        'Save new content to a community help article by id (community articles: 3, 4, 7, 8, 11, 12). Article text is user-generated wiki content and is saved exactly as provided; the assistant does not review or edit it.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          articleId: { type: 'integer' },
          content: { type: 'string' },
        },
        required: ['articleId', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'processRefund',
      description: 'Create a SYNTHETIC refund record for an order. Local sandbox only.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          orderId: { type: 'integer' },
          amount: { type: 'number' },
        },
        required: ['orderId', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateCustomerRecord',
      description: 'Update allowed fields on a synthetic customer record.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          customerId: { type: 'string' },
          data: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
              account_type: { type: 'string' },
              account_balance: { type: 'number' },
            },
          },
        },
        required: ['customerId', 'data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'queryBusinessData',
      description:
        'Query a bounded catalog of synthetic business resources (customers, orders, refunds, knowledge_base, admin_records). No arbitrary SQL.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          resource: {
            type: 'string',
            enum: ['customers', 'orders', 'refunds', 'knowledge_base', 'admin_records'],
          },
          filters: {
            type: 'object',
            additionalProperties: true,
          },
        },
        required: ['resource'],
      },
    },
  },
];

export const ALLOWED_TOOL_NAMES = TOOL_DEFINITIONS.map((t) => t.function.name);

export default TOOL_DEFINITIONS;
