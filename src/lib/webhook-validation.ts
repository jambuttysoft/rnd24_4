import { z } from 'zod';
import { WebhookValidationError } from './errors';
import crypto from 'crypto';

// Схема для валидации webhook payload от Aurinko
const AurinkoWebhookPayloadSchema = z.object({
  subscription: z.number().positive('Subscription ID must be a positive number'),
  resource: z.string().min(1, 'Resource cannot be empty'),
  accountId: z.number().positive('Account ID must be a positive number'),
  error: z.string().optional(),
  lifecycleEvent: z.string().optional(),
  payloads: z.array(
    z.object({
      id: z.string().min(1, 'Payload ID cannot be empty'),
      changeType: z.enum(['created', 'updated', 'deleted'], {
        errorMap: () => ({ message: 'Change type must be created, updated, or deleted' })
      }),
      attributes: z.object({
        threadId: z.string().min(1, 'Thread ID cannot be empty')
      }).optional()
    })
  ).min(0, 'Payloads must be an array').optional()
});

// Схема для валидации заголовков webhook
const WebhookHeadersSchema = z.object({
  'x-aurinko-request-timestamp': z.string().min(1, 'Timestamp header is required'),
  'x-aurinko-signature': z.string().min(1, 'Signature header is required')
});

export type AurinkoWebhookPayload = z.infer<typeof AurinkoWebhookPayloadSchema>;
export type WebhookHeaders = z.infer<typeof WebhookHeadersSchema>;

export function validateWebhookPayload(payload: unknown): AurinkoWebhookPayload {
  try {
    return AurinkoWebhookPayloadSchema.parse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      if (firstError) {
        throw new WebhookValidationError(
          firstError.message,
          firstError.path.join('.')
        );
      }
    }
    throw new WebhookValidationError('Invalid payload format');
  }
}

export function validateWebhookHeaders(headers: Record<string, string | undefined>): WebhookHeaders {
  try {
    // Преобразуем заголовки в нижний регистр для проверки
    const normalizedHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        normalizedHeaders[key.toLowerCase()] = value;
      }
    });
    
    return WebhookHeadersSchema.parse(normalizedHeaders);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      if (firstError) {
        throw new WebhookValidationError(
          `Invalid header: ${firstError.message}`,
          firstError.path.join('.')
        );
      }
    }
    throw new WebhookValidationError('Invalid headers format');
  }
}

// Валидация подписи webhook
export function validateWebhookSignature(
  body: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    throw new WebhookValidationError('Webhook signing secret is not configured');
  }
  
  const basestring = `v0:${timestamp}:${body}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(basestring)
    .digest('hex');
  
  return signature === expectedSignature;
}