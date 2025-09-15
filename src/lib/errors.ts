export class AurinkoAPIError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'AurinkoAPIError';
  }
}

export class AuthenticationError extends AurinkoAPIError {
  constructor(message: string = 'Authentication failed', originalError?: any) {
    super(message, 401, 'AUTH_ERROR', originalError);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends AurinkoAPIError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number,
    originalError?: any
  ) {
    super(message, 429, 'RATE_LIMIT', originalError);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class WebhookValidationError extends ValidationError {
  constructor(message: string, field?: string) {
    super(`Webhook validation failed: ${message}`, field);
    this.name = 'WebhookValidationError';
  }
}

export function handleAurinkoError(error: any, context?: string): never {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        throw new AuthenticationError(
          data?.message || 'Invalid or expired token',
          error
        );
      case 429:
        const retryAfter = error.response.headers['retry-after'];
        throw new RateLimitError(
          data?.message || 'Rate limit exceeded',
          retryAfter ? parseInt(retryAfter) : undefined,
          error
        );
      default:
        throw new AurinkoAPIError(
          data?.message || `API request failed${context ? ` in ${context}` : ''}`,
          status,
          data?.code,
          error
        );
    }
  }
  
  // Network or other errors
  throw new AurinkoAPIError(
    `Network error${context ? ` in ${context}` : ''}: ${error?.message || 'Unknown error'}`,
    undefined,
    error?.code,
    error
  );
}