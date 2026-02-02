import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geminiService } from '../geminiService';
import { DocType } from '../../types';

// Mock @google/genai
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn(function () {
        return {
            models: {
                generateContent: mockGenerateContent
            }
        };
    }),
    Type: { OBJECT: 'OBJECT', STRING: 'STRING' }
}));

vi.mock('../errorService', () => ({
    errorService: {
        handleError: vi.fn((err) => ({ userMessage: err.message })),
    }
}));

vi.mock('../retryHelper', () => ({
    withRetry: vi.fn(async (fn) => await fn())
}));

describe('GeminiService', () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('classifyEmailContent', () => {
        it('should use proxy when configured (default for test environment might vary)', async () => {
            // Force useProxy to true for this test
            (geminiService as any).useProxy = true;

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    type: DocType.INVOICE,
                    vendorName: 'Test Vendor',
                    confidence: 95
                })
            });

            const result = await geminiService.classifyEmailContent('Subject', 'Snippet');

            expect(result).toEqual({
                type: DocType.INVOICE,
                vendorName: 'Test Vendor',
                confidence: 95
            });
            expect(fetchMock).toHaveBeenCalledWith('/api/classify', expect.any(Object));
        });

        it('should use direct API when proxy is disabled', async () => {
            // Force useProxy to false
            (geminiService as any).useProxy = false;
            vi.stubEnv('GEMINI_API_KEY', 'test-api-key');

            // Mock Gemini Response
            mockGenerateContent.mockResolvedValueOnce({
                text: JSON.stringify({
                    type: DocType.RECEIPT,
                    vendorName: 'Direct Vendor',
                    confidence: 88
                })
            });

            const result = await geminiService.classifyEmailContent('Subject', 'Snippet');

            expect(result).toEqual({
                type: DocType.RECEIPT,
                vendorName: 'Direct Vendor',
                confidence: 88
            });
            expect(mockGenerateContent).toHaveBeenCalled();
            vi.unstubAllEnvs();
        });

        it('should handle API errors gracefully', async () => {
            (geminiService as any).useProxy = true;

            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({})
            });

            const result = await geminiService.classifyEmailContent('Subject', 'Snippet');
            expect(result).toBeNull();
        });

        it('should return confidence score when provided by API', async () => {
            (geminiService as any).useProxy = true;

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    type: DocType.INVOICE,
                    vendorName: 'Test Vendor',
                    confidence: 72
                })
            });

            const result = await geminiService.classifyEmailContent('Invoice from Vendor', 'Payment details');

            expect(result).toHaveProperty('confidence', 72);
            expect(result?.confidence).toBeLessThan(85); // Below default threshold
        });
    });
});

