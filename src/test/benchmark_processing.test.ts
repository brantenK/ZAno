import { describe, it, expect, vi, beforeEach } from 'vitest';
import { documentProcessingService } from '../services/documentProcessingService';
import { gmailService } from '../services/gmailService';
import { driveService } from '../services/driveService';
import { geminiService } from '../services/geminiService';
import { supplierService } from '../services/supplierService';
import { DocType } from '../types';

// Mock dependencies
vi.mock('../config/firebase', () => ({
    app: {},
    auth: {},
    googleProvider: {}
}));
vi.mock('../services/gmailService');
vi.mock('../services/driveService');
vi.mock('../services/geminiService');
vi.mock('../services/supplierService');
vi.mock('../services/settingsService', () => ({
    loadSettings: () => ({
        aiConfidenceThreshold: 70
    })
}));

describe('DocumentProcessingService Benchmark', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('benchmarks processing speed', async () => {
        const EMAIL_COUNT = 10;
        const ATTACHMENTS_PER_EMAIL = 2;
        const TOTAL_ATTACHMENTS = EMAIL_COUNT * ATTACHMENTS_PER_EMAIL;

        // Setup mock data
        const mockEmails = Array.from({ length: EMAIL_COUNT }, (_, i) => ({
            id: `email-${i}`,
            subject: `Invoice ${i}`,
            snippet: `Invoice details ${i}`,
            date: new Date().toISOString(),
            hasAttachment: true,
            attachments: Array.from({ length: ATTACHMENTS_PER_EMAIL }, (_, j) => ({
                attachmentId: `att-${i}-${j}`,
                filename: `invoice-${i}-${j}.pdf`,
                mimeType: 'application/pdf',
                size: 1024
            }))
        }));

        // Setup mock implementations with delays
        vi.mocked(gmailService.searchBySupplierWithAttachments).mockResolvedValue(mockEmails as any);

        vi.mocked(gmailService.getAttachment).mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate 50ms download
            return new Blob(['fake content']);
        });

        vi.mocked(geminiService.classifyEmailContent).mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate 100ms classification
            return {
                type: DocType.INVOICE,
                vendorName: 'Test Vendor',
                confidence: 90
            };
        });

        vi.mocked(driveService.uploadFile).mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate 50ms upload
            return { id: 'file-id', name: 'file.pdf', mimeType: 'application/pdf' };
        });

        const supplier = {
            id: 'sup-1',
            name: 'Test Vendor',
            aliases: [],
            emailDomain: 'test.com',
            category: 'Test',
            createdAt: new Date().toISOString(),
            isActive: true
        };

        const dateRange = {
            start: new Date('2023-01-01'),
            end: new Date('2023-12-31')
        };

        console.log('Starting benchmark...');
        const startTime = performance.now();

        await documentProcessingService.processSupplierDocuments(supplier, dateRange);

        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`Processed ${TOTAL_ATTACHMENTS} attachments in ${duration.toFixed(2)}ms`);

        // Assertions to ensure it actually ran
        expect(gmailService.searchBySupplierWithAttachments).toHaveBeenCalled();
        expect(gmailService.getAttachment).toHaveBeenCalledTimes(TOTAL_ATTACHMENTS);
        expect(geminiService.classifyEmailContent).toHaveBeenCalledTimes(TOTAL_ATTACHMENTS);
        expect(driveService.uploadFile).toHaveBeenCalledTimes(TOTAL_ATTACHMENTS);
    }, 30000);
});
