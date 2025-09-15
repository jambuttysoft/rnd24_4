export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

export class RetryableError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

const defaultRetryCondition = (error: any): boolean => {
  // Retry on network errors, timeouts, and 5xx server errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }
  
  if (error.response?.status >= 500) {
    return true;
  }
  
  // Retry on rate limiting
  if (error.response?.status === 429) {
    return true;
  }
  
  // Don't retry on 4xx errors (except 429)
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return false;
  }
  
  return true;
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryCondition = defaultRetryCondition
  } = options;

  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break;
      }
      
      // Check if error should be retried
      if (!retryCondition(error)) {
        throw new NonRetryableError(
          `Non-retryable error on attempt ${attempt}: ${error?.message || 'Unknown error'}`,
          error
        );
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );
      
      console.warn(
        `Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms:`,
        error?.message || 'Unknown error'
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new RetryableError(
    `All ${maxAttempts} attempts failed. Last error: ${lastError?.message || 'Unknown error'}`,
    lastError
  );
}

// Специализированная функция для API вызовов Aurinko
export async function withAurinkoRetry<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: (error) => {
      // Логирование для отладки
      if (context) {
        console.error(`Aurinko API error in ${context}:`, {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
      }
      
      return defaultRetryCondition(error);
    }
  });
}