import { Email } from '../types';
import { withRetry } from './retryHelper';
import { authService } from './authService';
import { errorService } from './errorService';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export interface GmailAttachment {
    attachmentId: string;
    filename: string;
    mimeType: string;
    size?: number;
}

export interface EmailWithAttachments extends Email {
    attachments?: GmailAttachment[];
}

interface GmailPart {
    mimeType: string;
    filename: string;
    body: { attachmentId?: string; data?: string; size?: number };
    parts?: GmailPart[];
    headers?: Array<{ name: string; value: string }>;
}

export interface GmailMessage {
    id: string;
    threadId: string;
    snippet: string;
    payload: {
        headers: Array<{ name: string; value: string }>;
        mimeType?: string;
        body?: { attachmentId?: string; data?: string; size?: number };
        parts?: GmailPart[];
    };
    internalDate: string;
}

class ApiError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
        super(message);
        this.status = status;
    }
}

class GmailService {
    private accessToken: string | null = null;

    setAccessToken(token: string) {
        this.accessToken = token;
    }

    private async fetchWithAuth(url: string, options: RequestInit = {}) {
        if (!this.accessToken) {
            throw new Error('No access token available. Please sign in first.');
        }

        // Wrap fetch in retry logic for transient errors
        return withRetry(async () => {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            // Handle auth errors specially
            if (response.status === 401) {
                authService.handleAuthError();
                const error = new ApiError('Authentication expired. Please sign in again.', 401);
                throw error;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error = new ApiError(errorData.error?.message || `Gmail API error: ${response.status}`, response.status);
                throw error;
            }

            return response.json();
        }, {
            maxAttempts: 3,
            baseDelayMs: 1000,
            retryableErrors: [408, 429, 500, 502, 503, 504]
        }).catch(error => {
            // Report non-retryable errors to error service
            if (error.status !== 401) {
                errorService.handleError(error, 'Gmail API');
            }
            throw error;
        });
    }

    async getRecentEmails(maxResults: number = 500): Promise<Email[]> {
        const result = await this.getRecentEmailsPaginated(maxResults);
        return result.emails;
    }

    async getRecentEmailsPaginated(maxResults: number = 100, pageToken?: string): Promise<{ emails: Email[], nextPageToken?: string }> {
        // Get recent emails with pagination support - only from Primary tab with attachments
        // This filters out social/promotional emails and focuses on emails with documents
        let url = `${GMAIL_API_BASE}/messages?maxResults=${maxResults}&q=${encodeURIComponent('category:primary has:attachment')}`;
        if (pageToken) {
            url += `&pageToken=${pageToken}`;
        }

        const listResponse = await this.fetchWithAuth(url);

        if (!listResponse.messages || listResponse.messages.length === 0) {
            return { emails: [], nextPageToken: undefined };
        }

        const emails: Email[] = [];

        // Process messages with concurrency limit to avoid rate limiting while improving speed
        const CONCURRENCY_LIMIT = 5;
        const chunks = [];

        for (let i = 0; i < listResponse.messages.length; i += CONCURRENCY_LIMIT) {
            chunks.push(listResponse.messages.slice(i, i + CONCURRENCY_LIMIT));
        }

        for (const chunk of chunks) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await Promise.all(chunk.map(async (msg: any) => {
                try {
                    const fullMessage: GmailMessage = await this.fetchWithAuth(
                        `${GMAIL_API_BASE}/messages/${msg.id}?format=full`
                    );

                    // Use the smarter parsing that filters out logos/signatures
                    const email = this.parseGmailMessageWithAttachments(fullMessage);
                    // Only include if it has actual document attachments (not just logos)
                    if (email && email.attachments && email.attachments.length > 0) {
                        emails.push(email);
                    }
                } catch (error) {
                    console.error(`Failed to fetch message ${msg.id}:`, error);
                }
            }));

            // Small delay between chunks to be nice to the API
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return {
            emails,
            nextPageToken: listResponse.nextPageToken
        };
    }

    async searchBySupplier(query: string, maxResults: number = 100): Promise<Email[]> {
        const listResponse = await this.fetchWithAuth(
            `${GMAIL_API_BASE}/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`
        );

        if (!listResponse.messages || listResponse.messages.length === 0) {
            return [];
        }

        const emails: Email[] = [];

        // Fetch all messages (up to maxResults) for comprehensive financial year coverage
        for (const msg of listResponse.messages) {
            try {
                const fullMessage: GmailMessage = await this.fetchWithAuth(
                    `${GMAIL_API_BASE}/messages/${msg.id}?format=full`
                );

                const email = this.parseGmailMessage(fullMessage);
                if (email) {
                    emails.push(email);
                }
            } catch (error) {
                console.error(`Failed to fetch message ${msg.id}:`, error);
            }
        }

        return emails;
    }

    async searchBySupplierWithAttachments(query: string, maxResults: number = 500): Promise<EmailWithAttachments[]> {
        const emails: EmailWithAttachments[] = [];
        let pageToken: string | undefined;
        const PAGE_SIZE = 100; // Gmail API max per page
        const MAX_PAGES = 10; // Safety limit to prevent infinite loops
        let pageCount = 0;

        // Paginate through all results
        do {
            let url = `${GMAIL_API_BASE}/messages?maxResults=${Math.min(PAGE_SIZE, maxResults - emails.length)}&q=${encodeURIComponent(query)}`;
            if (pageToken) {
                url += `&pageToken=${pageToken}`;
            }

            const listResponse = await this.fetchWithAuth(url);

            if (!listResponse.messages || listResponse.messages.length === 0) {
                break;
            }

            // Process this page's messages
            const CONCURRENCY_LIMIT = 5;
            const chunks = [];

            for (let i = 0; i < listResponse.messages.length; i += CONCURRENCY_LIMIT) {
                chunks.push(listResponse.messages.slice(i, i + CONCURRENCY_LIMIT));
            }

            for (const chunk of chunks) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await Promise.all(chunk.map(async (msg: any) => {
                    try {
                        const fullMessage: GmailMessage = await this.fetchWithAuth(
                            `${GMAIL_API_BASE}/messages/${msg.id}?format=full`
                        );

                        const email = this.parseGmailMessageWithAttachments(fullMessage);
                        if (email) {
                            emails.push(email);
                        }
                    } catch (error) {
                        console.error(`Failed to fetch message ${msg.id}:`, error);
                    }
                }));
                // Small delay between chunks
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            pageToken = listResponse.nextPageToken;
            pageCount++;

            // Stop if we've collected enough emails or hit page limit
            if (emails.length >= maxResults || pageCount >= MAX_PAGES) {
                break;
            }

        } while (pageToken);

        if (import.meta.env.DEV) console.log(`[Gmail] Fetched ${emails.length} emails across ${pageCount} page(s)`);
        return emails;
    }

    private parseGmailMessageWithAttachments(message: GmailMessage): EmailWithAttachments | null {
        const headers = message.payload.headers;
        const getHeader = (name: string) =>
            headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const from = getHeader('From');
        const subject = getHeader('Subject');

        const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/) || [null, from, from];
        const senderName = fromMatch[1]?.trim().replace(/"/g, '') || from;
        const senderEmail = fromMatch[2]?.trim() || from;

        // Extract all attachments with their IDs
        const attachments: GmailAttachment[] = [];
        this.extractAttachments(message.payload.parts || [], attachments);

        return {
            id: message.id,
            senderName,
            senderEmail,
            subject,
            date: new Date(parseInt(message.internalDate)).toISOString(),
            snippet: message.snippet,
            hasAttachment: attachments.length > 0,
            attachmentName: attachments[0]?.filename,
            isProcessed: false,
            attachments: attachments.length > 0 ? attachments : undefined
        };
    }

    private extractAttachments(parts: GmailPart[], attachments: GmailAttachment[]) {
        // File extensions that are likely actual documents (not logos/signatures)
        const DOCUMENT_EXTENSIONS = [
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
            '.txt', '.rtf', '.odt', '.ods', '.ppt', '.pptx',
            '.zip', '.rar', '.7z'
        ];

        // Minimum file size (10KB) - smaller files are usually logos/tracking pixels
        const MIN_FILE_SIZE = 10 * 1024; // 10KB

        for (const part of parts) {
            if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
                const filename = part.filename.toLowerCase();
                const mimeType = part.mimeType?.toLowerCase() || '';
                const size = part.body.size || 0;

                // Check if it's a document we care about
                const isDocument = DOCUMENT_EXTENSIONS.some(ext => filename.endsWith(ext));

                // Check if it's inline (Content-Disposition: inline) - these are usually logos
                const contentDisposition = part.headers?.find(
                    (h) => h.name.toLowerCase() === 'content-disposition'
                )?.value || '';
                const isInline = contentDisposition.toLowerCase().includes('inline');

                // Skip if:
                // 1. It's an inline image (logo in signature)
                // 2. It's a small image file (tracking pixel or tiny logo)
                // 3. It's an image that's not a document type
                const isImage = mimeType.startsWith('image/');
                const isTooSmall = size > 0 && size < MIN_FILE_SIZE;

                // Accept if: it's a document OR (it's not inline AND not too small AND not a tiny image)
                if (isDocument || (!isInline && !isTooSmall && !(isImage && size < MIN_FILE_SIZE * 2))) {
                    // Additional skip for common logo/signature filenames
                    const skipPatterns = [
                        'logo', 'signature', 'banner', 'footer', 'header',
                        'icon', 'avatar', 'profile', 'linkedin', 'facebook',
                        'twitter', 'instagram', 'youtube', 'email-sig'
                    ];
                    const hasLogoName = skipPatterns.some(pattern => filename.includes(pattern));

                    if (!hasLogoName || isDocument) {
                        attachments.push({
                            attachmentId: part.body.attachmentId,
                            filename: part.filename,
                            mimeType: part.mimeType,
                            size: part.body.size
                        });
                    }
                }
            }
            // Recursively check nested parts
            if (part.parts) {
                this.extractAttachments(part.parts, attachments);
            }
        }
    }

    private parseGmailMessage(message: GmailMessage): Email | null {
        const headers = message.payload.headers;
        const getHeader = (name: string) =>
            headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const from = getHeader('From');
        const subject = getHeader('Subject');
        const date = getHeader('Date');

        // Extract sender name and email
        const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/) || [null, from, from];
        const senderName = fromMatch[1]?.trim().replace(/"/g, '') || from;
        const senderEmail = fromMatch[2]?.trim() || from;

        // Check for attachments
        const attachments = message.payload.parts?.filter(
            part => part.filename && part.filename.length > 0
        ) || [];

        const hasAttachment = attachments.length > 0;
        const attachmentName = attachments[0]?.filename;

        return {
            id: message.id,
            senderName,
            senderEmail,
            subject,
            date: new Date(parseInt(message.internalDate)).toISOString(),
            snippet: message.snippet,
            hasAttachment,
            attachmentName,
            isProcessed: false,
        };
    }

    async getAttachment(messageId: string, attachmentId: string): Promise<Blob> {
        const response = await this.fetchWithAuth(
            `${GMAIL_API_BASE}/messages/${messageId}/attachments/${attachmentId}`
        );

        // Decode base64url encoded data
        const base64Data = response.data.replace(/-/g, '+').replace(/_/g, '/');
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return new Blob([bytes]);
    }
}

export const gmailService = new GmailService();
