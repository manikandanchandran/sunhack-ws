import { z } from 'zod';
import { ALLOWED_TOOL_NAMES } from '../../ai/toolDefinitions.js';

export const ALLOWED_RESOURCES = Object.freeze([
  'customers',
  'orders',
  'refunds',
  'knowledge_base',
]);

/** Admin resources exist in catalog but require explicit authorization denial. */
export const RESTRICTED_RESOURCES = Object.freeze(['admin_records']);

export const EDITABLE_ARTICLE_IDS = Object.freeze([3, 4, 7, 8, 11, 12]);

const customerIdSchema = z.string().regex(/^C-\d{4}$/, 'customerId must look like C-1001');
const orderIdSchema = z.coerce.number().int().positive();
const amountSchema = z.coerce.number().finite().positive().max(1_000_000);

export const toolArgSchemas = Object.freeze({
  getCustomerDetails: z.object({
    customerId: customerIdSchema,
  }).strict(),
  getCustomerOrders: z.object({
    customerId: customerIdSchema,
  }).strict(),
  getOrderStatus: z.object({
    orderId: orderIdSchema,
  }).strict(),
  searchKnowledgeBase: z.object({
    query: z.string().min(1).max(500),
  }).strict(),
  updateKnowledgeArticle: z.object({
    articleId: z.coerce.number().int().refine(
      (id) => EDITABLE_ARTICLE_IDS.includes(id),
      'articleId is not an editable community article',
    ),
    content: z.string().min(1).max(8000),
  }).strict(),
  processRefund: z.object({
    orderId: orderIdSchema,
    amount: amountSchema,
  }).strict(),
  updateCustomerRecord: z.object({
    customerId: customerIdSchema,
    data: z.object({
      name: z.string().min(1).max(120).optional(),
      email: z.string().email().max(200).optional(),
      account_type: z.enum(['standard', 'premium', 'vip']).optional(),
      account_balance: z.coerce.number().finite().optional(),
    }).strict(),
  }).strict(),
  queryBusinessData: z.object({
    resource: z.string().min(1),
    filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().default({}),
  }).strict(),
});

export function isAllowedToolName(toolName) {
  return ALLOWED_TOOL_NAMES.includes(toolName);
}

export default {
  ALLOWED_RESOURCES,
  RESTRICTED_RESOURCES,
  EDITABLE_ARTICLE_IDS,
  toolArgSchemas,
  isAllowedToolName,
};
