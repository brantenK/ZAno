/**
 * Processed Emails Service - Tracks which emails have been processed
 * to avoid duplicate uploads to Google Drive
 */

const STORAGE_KEY = 'zano_processed_emails';

interface ProcessedEmail {
    emailId: string;
    processedAt: string;
    drivePath?: string;
}

class ProcessedEmailsService {
    private processedIds: Set<string> = new Set();
    private initialized: boolean = false;

    /**
     * Initialize from localStorage
     */
    async init(): Promise<void> {
        if (this.initialized) return;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data: ProcessedEmail[] = JSON.parse(stored);
                this.processedIds = new Set(data.map(e => e.emailId));
            }
            this.initialized = true;
        } catch (e) {
            console.warn('Failed to load processed emails:', e);
            this.processedIds = new Set();
            this.initialized = true;
        }
    }

    /**
     * Check if an email has been processed
     */
    isProcessed(emailId: string): boolean {
        return this.processedIds.has(emailId);
    }

    /**
     * Mark an email as processed
     */
    markProcessed(emailId: string, drivePath?: string): void {
        this.processedIds.add(emailId);
        this.save();
    }

    /**
     * Mark multiple emails as processed
     */
    markManyProcessed(emailIds: string[]): void {
        emailIds.forEach(id => this.processedIds.add(id));
        this.save();
    }

    /**
     * Get all processed email IDs
     */
    getProcessedIds(): string[] {
        return Array.from(this.processedIds);
    }

    /**
     * Get count of processed emails
     */
    getProcessedCount(): number {
        return this.processedIds.size;
    }

    /**
     * Clear a specific email from processed list
     */
    unmarkProcessed(emailId: string): void {
        this.processedIds.delete(emailId);
        this.save();
    }

    /**
     * Clear all processed emails (reset)
     */
    clearAll(): void {
        this.processedIds.clear();
        this.save();
    }

    /**
     * Save to localStorage
     */
    private save(): void {
        try {
            const data: ProcessedEmail[] = Array.from(this.processedIds).map(id => ({
                emailId: id,
                processedAt: new Date().toISOString(),
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save processed emails:', e);
        }
    }
}

export const processedEmailsService = new ProcessedEmailsService();
