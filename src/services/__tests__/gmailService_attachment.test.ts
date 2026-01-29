import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase config to avoid env var checks
vi.mock('../../config/firebase', () => ({
    firebaseApp: {},
    auth: {},
    db: {},
    googleProvider: {},
    storage: {}
}));

import { gmailService } from '../gmailService';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

function readBlobText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
    });
}

describe('gmailService getAttachment', () => {
    const mockAccessToken = 'mock-access-token';
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    beforeEach(() => {
        vi.resetAllMocks();
        gmailService.setAccessToken(mockAccessToken);
    });

    it('should correctly decode and return attachment as Blob', async () => {
        // Base64 for "Hello World" -> SGVsbG8gV29ybGQ=
        // Base64URL for "Hello World" -> SGVsbG8gV29ybGQ
        const mockBase64Url = 'SGVsbG8gV29ybGQ';
        const expectedText = 'Hello World';

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: mockBase64Url
            })
        });

        const blob = await gmailService.getAttachment('msg1', 'att1');

        expect(blob).toBeInstanceOf(Blob);
        const text = await readBlobText(blob);
        expect(text).toBe(expectedText);
        expect(fetchMock).toHaveBeenCalledWith(
            `${GMAIL_API_BASE}/messages/msg1/attachments/att1`,
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': `Bearer ${mockAccessToken}`
                })
            })
        );
    });

    it('should handle large attachments', async () => {
        // Create a larger fake base64 string
        // 'a' * 1000
        const originalString = 'a'.repeat(1000);
        // We can use Buffer in test env to create base64
        const base64 = Buffer.from(originalString).toString('base64');
        const base64Url = base64.replace(/\+/g, '-').replace(/\//g, '_');

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: base64Url
            })
        });

        const blob = await gmailService.getAttachment('msg1', 'att1');
        const text = await readBlobText(blob);
        expect(text).toBe(originalString);
    });
});
