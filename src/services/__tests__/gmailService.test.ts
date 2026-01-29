import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gmailService } from '../gmailService';
import { authService } from '../authService';

// Mock dependencies
vi.mock('../authService', () => ({
    authService: {
        handleAuthError: vi.fn(),
    }
}));

vi.mock('../errorService', () => ({
    errorService: {
        handleError: vi.fn(),
    }
}));

describe('GmailService', () => {
    const mockAccessToken = 'mock-access-token';

    // Setup global fetch mock
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    beforeEach(() => {
        vi.resetAllMocks();
        gmailService.setAccessToken(mockAccessToken);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getRecentEmails', () => {
        it('should fetch and parse emails correctly', async () => {
            // Mock list response
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    messages: [{ id: 'msg1', threadId: 'thread1' }],
                    nextPageToken: 'next-token'
                })
            });

            // Mock message details response
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'msg1',
                    threadId: 'thread1',
                    internalDate: '1672531200000', // 2023-01-01
                    snippet: 'Hello world',
                    payload: {
                        headers: [
                            { name: 'From', value: 'Sender Name <sender@example.com>' },
                            { name: 'Subject', value: 'Test Subject' },
                            { name: 'Date', value: 'Sun, 01 Jan 2023 00:00:00 GMT' }
                        ],
                        parts: [
                            {
                                filename: 'document.pdf',
                                mimeType: 'application/pdf',
                                body: { attachmentId: 'att1', size: 20000 }
                            }
                        ]
                    }
                })
            });

            const result = await gmailService.getRecentEmails(10);

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: 'msg1',
                senderName: 'Sender Name',
                senderEmail: 'sender@example.com',
                subject: 'Test Subject',
                snippet: 'Hello world',
            });

            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it('should handle empty response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ messages: [] })
            });

            const result = await gmailService.getRecentEmails(10);
            expect(result).toHaveLength(0);
        });

        it('should handle rate limiting errors internally', async () => {
            // Mock 429 error then success
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 429,
                json: async () => ({ error: { message: 'Too Many Requests' } })
            });

            // Retry success (list)
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ messages: [] })
            });

            const result = await gmailService.getRecentEmails(10);
            expect(result).toHaveLength(0);
            expect(fetchMock).toHaveBeenCalledTimes(2); // Initial + Retry
        });

        it('should trigger auth flow on 401 error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ error: { message: 'Unauthorized' } })
            });

            await expect(gmailService.getRecentEmails(10)).rejects.toThrow('Authentication expired');
            expect(authService.handleAuthError).toHaveBeenCalled();
        });
    });

    describe('searchBySupplierWithAttachments', () => {
        it('should parse attachments correctly', async () => {
            // Mock list response
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ messages: [{ id: 'msg1' }] })
            });

            // Mock message with attachment
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'msg1',
                    internalDate: '1672531200000',
                    snippet: 'Invoice attached',
                    payload: {
                        headers: [{ name: 'From', value: 'Vendor <vendor@test.com>' }],
                        parts: [
                            {
                                filename: 'invoice.pdf',
                                mimeType: 'application/pdf',
                                body: { attachmentId: 'att1', size: 1024 }
                            }
                        ]
                    }
                })
            });

            const result = await gmailService.searchBySupplierWithAttachments('query');

            expect(result).toHaveLength(1);
            expect(result[0].hasAttachment).toBe(true);
            expect(result[0].attachments).toHaveLength(1);
            expect(result[0].attachments![0].filename).toBe('invoice.pdf');
        });
    });
});
