import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Import after mocking
import { processedEmailsService } from '../processedEmailsService';

describe('ProcessedEmailsService', () => {
    beforeEach(() => {
        localStorage.clear();
        // Reset service state
        (processedEmailsService as any).processedIds = new Set();
        (processedEmailsService as any).initialized = false;
    });

    describe('init', () => {
        it('should initialize with empty set when no stored data', async () => {
            await processedEmailsService.init();
            expect(processedEmailsService.getProcessedCount()).toBe(0);
        });

        it('should load stored email IDs on init', async () => {
            localStorage.setItem('zano_processed_emails', JSON.stringify([
                { emailId: 'email1', processedAt: '2024-01-01' },
                { emailId: 'email2', processedAt: '2024-01-02' },
            ]));

            await processedEmailsService.init();
            expect(processedEmailsService.getProcessedCount()).toBe(2);
            expect(processedEmailsService.isProcessed('email1')).toBe(true);
            expect(processedEmailsService.isProcessed('email2')).toBe(true);
        });
    });

    describe('isProcessed', () => {
        beforeEach(async () => {
            await processedEmailsService.init();
        });

        it('should return false for unprocessed email', () => {
            expect(processedEmailsService.isProcessed('unknown')).toBe(false);
        });

        it('should return true for processed email', () => {
            processedEmailsService.markProcessed('test-email');
            expect(processedEmailsService.isProcessed('test-email')).toBe(true);
        });
    });

    describe('markProcessed', () => {
        beforeEach(async () => {
            await processedEmailsService.init();
        });

        it('should add email to processed set', () => {
            processedEmailsService.markProcessed('email1');
            expect(processedEmailsService.isProcessed('email1')).toBe(true);
        });

        it('should persist to localStorage', () => {
            processedEmailsService.markProcessed('email1');
            const stored = JSON.parse(localStorage.getItem('zano_processed_emails') || '[]');
            expect(stored.length).toBe(1);
            expect(stored[0].emailId).toBe('email1');
        });
    });

    describe('markManyProcessed', () => {
        beforeEach(async () => {
            await processedEmailsService.init();
        });

        it('should add multiple emails at once', () => {
            processedEmailsService.markManyProcessed(['email1', 'email2', 'email3']);
            expect(processedEmailsService.getProcessedCount()).toBe(3);
            expect(processedEmailsService.isProcessed('email1')).toBe(true);
            expect(processedEmailsService.isProcessed('email2')).toBe(true);
            expect(processedEmailsService.isProcessed('email3')).toBe(true);
        });
    });

    describe('clearAll', () => {
        beforeEach(async () => {
            await processedEmailsService.init();
        });

        it('should clear all processed emails', () => {
            processedEmailsService.markManyProcessed(['email1', 'email2']);
            expect(processedEmailsService.getProcessedCount()).toBe(2);

            processedEmailsService.clearAll();
            expect(processedEmailsService.getProcessedCount()).toBe(0);
        });
    });

    describe('getProcessedIds', () => {
        beforeEach(async () => {
            await processedEmailsService.init();
        });

        it('should return array of all processed IDs', () => {
            processedEmailsService.markManyProcessed(['email1', 'email2']);
            const ids = processedEmailsService.getProcessedIds();
            expect(ids).toContain('email1');
            expect(ids).toContain('email2');
            expect(ids.length).toBe(2);
        });
    });
});
