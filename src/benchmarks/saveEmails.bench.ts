import { bench, describe, vi, beforeAll } from 'vitest';
import { supplierService } from '../services/supplierService';
import { storageService } from '../services/storageService';
import { SavedEmail } from '../types/supplier';

// Mock storageService
vi.mock('../services/storageService', () => ({
    storageService: {
        init: vi.fn().mockResolvedValue(undefined),
        migrateFromLocalStorage: vi.fn().mockResolvedValue(undefined),
        putMany: vi.fn().mockResolvedValue(undefined),
        getAll: vi.fn().mockResolvedValue([]),
        put: vi.fn().mockResolvedValue(undefined),
    }
}));

describe('saveEmails Performance', () => {
    const INITIAL_COUNT = 10000;
    const BATCH_SIZE = 50;
    const EMAILS_KEY = 'zano_saved_emails';

    const initialEmails: SavedEmail[] = Array.from({ length: INITIAL_COUNT }, (_, i) => ({
        id: `email-${i}`,
        supplierId: 'sup-1',
        senderName: 'Sender',
        senderEmail: 'sender@example.com',
        snippet: 'snippet',
        hasAttachment: false,
        financialYear: '2023-2024',
        subject: `Email ${i}`,
        date: new Date().toISOString(),
        savedAt: new Date().toISOString(),
        isProcessed: true
    }));

    const newEmails: SavedEmail[] = Array.from({ length: BATCH_SIZE }, (_, i) => ({
        id: `new-email-${i}`,
        supplierId: 'sup-1',
        senderName: 'Sender',
        senderEmail: 'sender@example.com',
        snippet: 'snippet',
        hasAttachment: false,
        financialYear: '2023-2024',
        subject: `New Email ${i}`,
        date: new Date().toISOString(),
        savedAt: new Date().toISOString(),
        isProcessed: false
    }));

    beforeAll(() => {
        // Setup initial localStorage
        localStorage.setItem(EMAILS_KEY, JSON.stringify(initialEmails));

        // Setup mock return for getSavedEmailsAsync -> storageService.getAll
        vi.mocked(storageService.getAll).mockResolvedValue(initialEmails);
    });

    bench('sync saveEmails (localStorage)', () => {
        supplierService.saveEmails(newEmails);
    });

    bench('async saveEmailsAsync (mocked IndexedDB)', async () => {
        await supplierService.saveEmailsAsync(newEmails);
    });
});
