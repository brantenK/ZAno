/**
 * Error Service - Centralized error handling and user notification
 */

export enum ErrorType {
    AUTH_EXPIRED = 'AUTH_EXPIRED',
    NETWORK = 'NETWORK',
    RATE_LIMITED = 'RATE_LIMITED',
    API_ERROR = 'API_ERROR',
    CLASSIFICATION_FAILED = 'CLASSIFICATION_FAILED',
    STORAGE_FULL = 'STORAGE_FULL',
    UNKNOWN = 'UNKNOWN'
}

export interface AppError {
    type: ErrorType;
    message: string;
    userMessage: string;
    isRetryable: boolean;
    originalError?: Error;
    timestamp: string;
}

type ErrorCallback = (error: AppError) => void;

class ErrorService {
    private listeners: ErrorCallback[] = [];
    private errorHistory: AppError[] = [];
    private readonly MAX_HISTORY = 50;

    /**
     * Subscribe to error events
     */
    subscribe(callback: ErrorCallback): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Report an error to all listeners
     */
    report(error: AppError): void {
        this.errorHistory.unshift(error);
        if (this.errorHistory.length > this.MAX_HISTORY) {
            this.errorHistory.pop();
        }

        this.listeners.forEach(listener => {
            try {
                listener(error);
            } catch (e) {
                console.error('Error in error listener:', e);
            }
        });
    }

    /**
     * Classify and report an error from an exception
     */
    handleError(error: unknown, context?: string): AppError {
        const appError = this.classifyError(error, context);
        this.report(appError);
        return appError;
    }

    /**
     * Classify an error into an AppError
     */
    classifyError(error: unknown, context?: string): AppError {
        const timestamp = new Date().toISOString();

        let baseMessage = 'An unknown error occurred';
        let status: number | undefined;
        let originalError: Error | undefined;

        if (error instanceof Error) {
            baseMessage = error.message;
            originalError = error;
            // specific check for status property on error object if it exists
            if ('status' in error) {
                status = (error as any).status;
            }
        } else if (typeof error === 'string') {
            baseMessage = error;
        } else if (typeof error === 'object' && error !== null) {
            // Safely try to extract message or details
            if ('message' in error) {
                baseMessage = String((error as any).message);
            }
            if ('status' in error) {
                status = Number((error as any).status);
            }
        }

        // Auth expired (401)
        if (status === 401 || baseMessage.toLowerCase().includes('token') || baseMessage.toLowerCase().includes('auth')) {
            return {
                type: ErrorType.AUTH_EXPIRED,
                message: baseMessage,
                userMessage: 'Your session has expired. Please sign in again.',
                isRetryable: false,
                originalError,
                timestamp
            };
        }

        // Rate limited (429)
        if (status === 429 || baseMessage.toLowerCase().includes('rate') || baseMessage.toLowerCase().includes('quota')) {
            return {
                type: ErrorType.RATE_LIMITED,
                message: baseMessage,
                userMessage: 'Too many requests. Please wait a moment and try again.',
                isRetryable: true,
                originalError,
                timestamp
            };
        }

        // Network errors
        if (originalError?.name === 'TypeError' && baseMessage.includes('fetch')) {
            return {
                type: ErrorType.NETWORK,
                message: baseMessage,
                userMessage: 'Network connection lost. Please check your internet connection.',
                isRetryable: true,
                originalError,
                timestamp
            };
        }

        // Storage errors
        if (baseMessage.toLowerCase().includes('quota') || baseMessage.toLowerCase().includes('storage')) {
            return {
                type: ErrorType.STORAGE_FULL,
                message: baseMessage,
                userMessage: 'Storage is full. Some data may not be saved.',
                isRetryable: false,
                originalError,
                timestamp
            };
        }

        // Classification failures
        if (context?.toLowerCase().includes('classif') || baseMessage.includes('Gemini')) {
            return {
                type: ErrorType.CLASSIFICATION_FAILED,
                message: baseMessage,
                userMessage: 'Document classification failed. The document will be saved as "Other".',
                isRetryable: true,
                originalError,
                timestamp
            };
        }

        // API errors (5xx)
        if (status && status >= 500) {
            return {
                type: ErrorType.API_ERROR,
                message: baseMessage,
                userMessage: 'Server error. Please try again in a few moments.',
                isRetryable: true,
                originalError,
                timestamp
            };
        }

        // Unknown
        return {
            type: ErrorType.UNKNOWN,
            message: baseMessage,
            userMessage: context
                ? `Error in ${context}: ${baseMessage}`
                : `An error occurred: ${baseMessage}`,
            isRetryable: false,
            originalError,
            timestamp
        };
    }

    /**
     * Get error history
     */
    getHistory(): AppError[] {
        return [...this.errorHistory];
    }

    /**
     * Clear error history
     */
    clearHistory(): void {
        this.errorHistory = [];
    }
}

export const errorService = new ErrorService();
