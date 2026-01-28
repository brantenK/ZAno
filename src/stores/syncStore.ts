import { create } from 'zustand';
import { Email, DocumentRecord, DailyReport, DocType, FailedDocument } from '../types';
import { gmailService, GmailAttachment } from '../services/gmailService';
import { driveService } from '../services/driveService';
import { geminiService } from '../services/geminiService';
import { processedEmailsService } from '../services/processedEmailsService';


import { SYNC_CONFIG } from '../config/constants';

interface SyncState {
    // Email state
    emails: Email[];

    // Document state
    processedDocs: DocumentRecord[];
    failedDocs: FailedDocument[];
    reports: DailyReport[];

    // Sync state
    isSyncing: boolean;
    syncLogs: string[];

    // Actions
    setEmails: (emails: Email[]) => void;
    addProcessedDocs: (docs: DocumentRecord[]) => void;
    addReport: (report: DailyReport) => void;

    // Sync actions
    addSyncLog: (log: string) => void;
    addFailedDoc: (doc: FailedDocument) => void;
    clearSyncLogs: () => void;
    setIsSyncing: (syncing: boolean) => void;

    // Complex actions
    loadEmailsFromGmail: () => Promise<number>;
    runAutopilotSync: (dateRange?: { start: Date; end: Date }) => Promise<number>;

    // Reset
    reset: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
    emails: [],
    processedDocs: [],
    failedDocs: [],
    reports: [],
    isSyncing: false,
    syncLogs: [],

    setEmails: (emails) => set({ emails }),

    addProcessedDocs: (docs) => set((state) => ({
        processedDocs: [...docs, ...state.processedDocs]
    })),

    addReport: (report) => set((state) => ({
        reports: [report, ...state.reports]
    })),

    addSyncLog: (log) => set((state) => {
        // Avoid duplicate consecutive logs
        if (state.syncLogs[state.syncLogs.length - 1] === log) return state;
        const newLogs = [...state.syncLogs, log];
        // Cap logs at 500 entries to prevent memory issues during large syncs
        return { syncLogs: newLogs.length > 500 ? newLogs.slice(-500) : newLogs };
    }),

    addFailedDoc: (doc) => set((state) => ({
        failedDocs: [doc, ...state.failedDocs]
    })),

    clearSyncLogs: () => set({ syncLogs: [] }),
    setIsSyncing: (isSyncing) => set({ isSyncing }),

    loadEmailsFromGmail: async () => {
        const { addSyncLog } = get();
        addSyncLog('Connecting to Gmail...');

        const gmailEmails = await gmailService.getRecentEmails();

        set({
            emails: gmailEmails
        });

        return gmailEmails.length;
    },

    runAutopilotSync: async (dateRange?: { start: Date; end: Date }) => {
        const { addSyncLog, addProcessedDocs, addReport, addFailedDoc } = get();

        set({ isSyncing: true, syncLogs: ['Initializing Zano AI Agent...', 'Scanning Gmail for emails with attachments...'] });

        try {
            // Build query with optional date filters
            let query = SYNC_CONFIG.GMAIL_SEARCH_QUERY;

            if (dateRange) {
                // Format dates as YYYY/MM/DD for Gmail query
                const formatGmailDate = (date: Date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}/${month}/${day}`;
                };

                const afterDate = formatGmailDate(dateRange.start);
                const beforeDate = formatGmailDate(new Date(dateRange.end.getTime() + 86400000)); // Add 1 day to include end date
                query += ` after:${afterDate} before:${beforeDate}`;

                addSyncLog(`Date range: ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`);
            }

            addSyncLog(`Searching: "${query}"`);

            const emailsWithAttachments = await gmailService.searchBySupplierWithAttachments(query, SYNC_CONFIG.MAX_EMAILS_TO_PROCESS);
            const emailsToProcess = emailsWithAttachments.filter(
                e => e.hasAttachment && e.attachments && e.attachments.length > 0
            );

            // Filter out already processed emails
            await processedEmailsService.init();
            const unprocessedEmails = emailsToProcess.filter(
                e => !processedEmailsService.isProcessed(e.id)
            );

            if (unprocessedEmails.length === 0) {
                addSyncLog(`All ${emailsToProcess.length} emails already processed. Inbox up to date.`);
                return 0;
            }

            addSyncLog(`${unprocessedEmails.length} new emails to process.`);

            // Count attachments
            let totalAttachments = 0;
            unprocessedEmails.forEach(email => {
                totalAttachments += email.attachments?.length || 0;
            });

            if (totalAttachments === 0) {
                addSyncLog('No attachments found in unprocessed emails.');
                return 0;
            }

            addSyncLog(`Processing ${totalAttachments} attachments...`);

            const newDocs: DocumentRecord[] = [];
            const processedEmailIds: string[] = [];
            let processed = 0;

            // Flatten structure: create a task for each attachment
            interface AttachmentTask {
                email: Email;
                attachment: GmailAttachment;
            }

            const tasks: AttachmentTask[] = unprocessedEmails.flatMap(email =>
                (email.attachments || []).map(attachment => ({ email, attachment }))
            );

            const failedEmailIds = new Set<string>();

            // Process in chunks to limit concurrency
            for (let i = 0; i < tasks.length; i += SYNC_CONFIG.BATCH_SIZE) {
                const chunk = tasks.slice(i, i + SYNC_CONFIG.BATCH_SIZE);

                // Process chunk in parallel
                await Promise.all(chunk.map(async ({ email, attachment }) => {
                    try {
                        const currentCount = ++processed;
                        addSyncLog(`[${currentCount}/${totalAttachments}] Processing: ${attachment.filename}`);

                        // 1. Download
                        const blob = await gmailService.getAttachment(email.id, attachment.attachmentId);

                        // 2. Classify
                        const classification = await geminiService.classifyEmailContent(
                            email.subject,
                            email.snippet,
                            attachment.filename
                        );

                        const docType = classification?.type || DocType.OTHER;
                        const vendorName = classification?.vendorName || email.senderName || 'Unknown';

                        // 3. Upload (use email date)
                        const emailDate = new Date(email.date);
                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];
                        const monthName = monthNames[emailDate.getMonth()];
                        const year = emailDate.getFullYear();

                        // Drive path: Zano/{Vendor}/{Month Year}
                        const drivePath = `Zano/${vendorName}/${monthName} ${year}`;

                        await driveService.uploadFile(
                            attachment.filename,
                            blob,
                            drivePath,
                            attachment.mimeType || 'application/pdf'
                        );

                        newDocs.push({
                            id: `doc_${Date.now()}_${Math.random()}`,
                            type: docType,
                            sender: vendorName,
                            processedAt: new Date().toISOString(),
                            drivePath: `${drivePath}/${attachment.filename}`,
                            amount: classification?.amount,
                            date: emailDate.toISOString(),
                            emailId: email.id
                        });

                        // Mark email as candidate for success
                        if (!processedEmailIds.includes(email.id)) {
                            processedEmailIds.push(email.id);
                        }

                    } catch (error) {
                        console.error(`Error processing attachment ${attachment.filename}:`, error);
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        addSyncLog(`⚠ Skipped: ${attachment.filename} (${errorMessage})`);

                        // Mark this email as having a failure
                        failedEmailIds.add(email.id);

                        addFailedDoc({
                            id: `fail_${Date.now()}_${Math.random()}`,
                            emailId: email.id,
                            reason: errorMessage,
                            filename: attachment.filename,
                            sender: email.senderName,
                            date: email.date
                        });
                    }
                }));
            }

            // ONLY mark emails as processed if they have NO failures
            const completelySuccessfulEmailIds = processedEmailIds.filter(id => !failedEmailIds.has(id));

            // Persist processed email IDs
            if (completelySuccessfulEmailIds.length > 0) {
                processedEmailsService.markManyProcessed(completelySuccessfulEmailIds);
            }

            // Update state
            if (newDocs.length > 0) {
                addProcessedDocs(newDocs);

                const today = new Date().toISOString().split('T')[0];
                addReport({
                    date: today,
                    invoicesCount: newDocs.filter(d => d.type === DocType.INVOICE).length,
                    statementsCount: newDocs.filter(d => d.type === DocType.BANK_STATEMENT).length,
                    otherCount: newDocs.filter(d => d.type === DocType.RECEIPT || d.type === DocType.TAX_LETTER).length,
                    totalProcessed: newDocs.length,
                    items: newDocs
                });
            }

            addSyncLog(`\n✓ Sync complete! Uploaded ${newDocs.length} documents.`);
            return newDocs.length;

        } finally {
            await new Promise(resolve => setTimeout(resolve, 1500));
            set({ isSyncing: false });
        }
    },

    reset: () => set({
        emails: [],

        processedDocs: [],
        reports: [],
        isSyncing: false,
        syncLogs: []
    }),
}));
