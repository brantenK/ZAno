/**
 * Retry Helper - Provides exponential backoff retry logic for API calls
 */

export interface RetryConfig {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    retryableErrors?: number[]; // HTTP status codes to retry
}

const DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    retryableErrors: [408, 429, 500, 502, 503, 504] // Timeout, rate limit, server errors
};

export class RetryError extends Error {
    public readonly attempts: number;
    public readonly lastError: Error;

    constructor(message: string, attempts: number, lastError: Error) {
        super(message);
        this.name = 'RetryError';
        this.attempts = attempts;
        this.lastError = lastError;
    }
}

/**
 * Execute a function with exponential backoff retry
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    const { maxAttempts, baseDelayMs, maxDelayMs, retryableErrors } = {
        ...DEFAULT_CONFIG,
        ...config
    };

    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Check if this is the last attempt
            if (attempt === maxAttempts) {
                throw new RetryError(
                    `Failed after ${maxAttempts} attempts: ${error.message}`,
                    attempt,
                    error
                );
            }

            // Check if error is retryable
            const statusCode = error.status || error.statusCode;
            if (statusCode && retryableErrors && !retryableErrors.includes(statusCode)) {
                // Non-retryable error (like 401, 403, 404)
                throw error;
            }

            // Calculate delay with exponential backoff + jitter
            const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
            const jitter = Math.random() * 1000;
            const delay = Math.min(exponentialDelay + jitter, maxDelayMs);

            if (import.meta.env.DEV) console.log(`Retry attempt ${attempt}/${maxAttempts} after ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Wrap a fetch call with retry logic
 */
export async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retryConfig: Partial<RetryConfig> = {}
): Promise<Response> {
    return withRetry(async () => {
        const response = await fetch(url, options);

        // Throw on server errors so they get retried
        if (response.status >= 500) {
            const error = new Error(`Server error: ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }

        // Rate limiting - retry these
        if (response.status === 429) {
            const error = new Error('Rate limited');
            (error as any).status = 429;
            throw error;
        }

        return response;
    }, retryConfig);
}
