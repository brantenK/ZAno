import { Supplier, SavedEmail, getCurrentFinancialYear } from '../types/supplier';
import { supplierService } from './supplierService';
import { gmailService } from './gmailService';
import { driveService } from './driveService';
import { geminiService } from './geminiService';
import { DocType } from '../types';

export interface ProcessingProgress {
    stage: 'searching' | 'downloading' | 'classifying' | 'uploading' | 'complete' | 'error';
    message: string;
    current: number;
    total: number;
    emailsFound?: number;
    attachmentsProcessed?: number;
    documentsUploaded?: number;
}

export interface ProcessedDocument {
    emailId: string;
    attachmentName: string;
    docType: DocType;
    drivePath: string;
    driveFileId?: string;
    amount?: string;
    currency?: string;
    processedAt: string;
}

class DocumentProcessingService {
    private onProgress: ((progress: ProcessingProgress) => void) | null = null;

    setProgressCallback(callback: (progress: ProcessingProgress) => void) {
        this.onProgress = callback;
    }

    private updateProgress(progress: ProcessingProgress) {
        if (this.onProgress) {
            this.onProgress(progress);
        }
    }

    // Rate limiting helper to avoid hitting Google API limits
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async processSupplierDocuments(
        supplier: Supplier,
        dateRange: { start: Date; end: Date }
    ): Promise<ProcessedDocument[]> {
        const results: ProcessedDocument[] = [];

        try {
            // Stage 1: Search for emails
            this.updateProgress({
                stage: 'searching',
                message: `Searching Gmail for ${supplier.name} emails...`,
                current: 0,
                total: 0
            });

            // Build date query
            const formatGmailDate = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}/${month}/${day}`;
            };

            const afterDate = formatGmailDate(dateRange.start);
            const beforeDate = formatGmailDate(new Date(dateRange.end.getTime() + 86400000)); // +1 day for inclusive

            // Build search query with email domain and date range
            let query = `category:primary has:attachment after:${afterDate} before:${beforeDate}`;
            if (supplier.emailDomain) {
                const domain = supplier.emailDomain.startsWith('@')
                    ? supplier.emailDomain.substring(1)
                    : supplier.emailDomain;
                query += ` from:${domain}`;
            }

            const emails = await gmailService.searchBySupplierWithAttachments(query, 500);

            const emailsWithAttachments = emails.filter(e => e.hasAttachment && e.attachments && e.attachments.length > 0);

            if (emailsWithAttachments.length === 0) {
                this.updateProgress({
                    stage: 'complete',
                    message: `No emails with attachments found for ${supplier.name}`,
                    current: 0,
                    total: 0,
                    emailsFound: emails.length,
                    attachmentsProcessed: 0,
                    documentsUploaded: 0
                });
                return results;
            }

            // Count total attachments
            let totalAttachments = 0;
            emailsWithAttachments.forEach(email => {
                totalAttachments += email.attachments?.length || 0;
            });

            this.updateProgress({
                stage: 'downloading',
                message: `Found ${totalAttachments} attachments in ${emailsWithAttachments.length} emails`,
                current: 0,
                total: totalAttachments,
                emailsFound: emails.length
            });

            // Stage 2 & 3: Download attachments, classify, and upload
            let processed = 0;

            for (const email of emailsWithAttachments) {
                for (const attachment of email.attachments || []) {
                    try {
                        processed++;

                        // Download attachment
                        this.updateProgress({
                            stage: 'downloading',
                            message: `Downloading: ${attachment.filename}`,
                            current: processed,
                            total: totalAttachments
                        });

                        const blob = await gmailService.getAttachment(email.id, attachment.attachmentId);

                        // Classify with AI
                        this.updateProgress({
                            stage: 'classifying',
                            message: `Classifying: ${attachment.filename}`,
                            current: processed,
                            total: totalAttachments
                        });

                        const classification = await geminiService.classifyEmailContent(
                            email.subject,
                            email.snippet,
                            attachment.filename
                        );

                        const docType = classification?.type || DocType.OTHER;

                        // Extract month from email date for folder organization
                        const emailDate = new Date(email.date);
                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];
                        const monthName = monthNames[emailDate.getMonth()];
                        const year = emailDate.getFullYear();

                        // Build Drive path: Zano/{Supplier}/{Month Year}
                        const drivePath = `Zano/${supplier.name}/${monthName} ${year}`;

                        // Upload to Drive
                        this.updateProgress({
                            stage: 'uploading',
                            message: `Uploading: ${attachment.filename}`,
                            current: processed,
                            total: totalAttachments
                        });

                        const driveFile = await driveService.uploadFile(
                            attachment.filename,
                            blob,
                            drivePath,
                            attachment.mimeType || 'application/pdf'
                        );

                        results.push({
                            emailId: email.id,
                            attachmentName: attachment.filename,
                            docType,
                            drivePath: `${drivePath}/${attachment.filename}`,
                            driveFileId: driveFile.id,
                            amount: classification?.amount,
                            currency: classification?.currency,
                            processedAt: new Date().toISOString()
                        });

                    } catch (error: any) {
                        console.error(`Failed to process ${attachment.filename}:`, error);
                        // Continue with next attachment
                    }

                    // Rate limiting: small delay between API calls to avoid hitting limits
                    await this.delay(200);
                }
            }

            // Save email metadata
            const savedEmails: SavedEmail[] = emails.map(email => ({
                ...email,
                supplierId: supplier.id,
                financialYear: getCurrentFinancialYear(),
                savedAt: new Date().toISOString()
            }));
            supplierService.saveEmails(savedEmails);

            this.updateProgress({
                stage: 'complete',
                message: `Successfully processed ${results.length} documents for ${supplier.name}`,
                current: totalAttachments,
                total: totalAttachments,
                emailsFound: emails.length,
                attachmentsProcessed: totalAttachments,
                documentsUploaded: results.length
            });

            return results;

        } catch (error: any) {
            this.updateProgress({
                stage: 'error',
                message: error.message || 'An error occurred',
                current: 0,
                total: 0
            });
            throw error;
        }
    }
}

export const documentProcessingService = new DocumentProcessingService();
