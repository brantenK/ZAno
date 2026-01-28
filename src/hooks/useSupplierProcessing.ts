import { useState, useCallback } from 'react';
import { Supplier } from '../types/supplier';
import { useUIStore } from '../stores/uiStore';
import { useSyncStore } from '../stores/syncStore';

interface DateRange {
    start: Date;
    end: Date;
}

interface UseSupplierProcessingReturn {
    isFetchingSupplierEmails: boolean;
    handleFetchSupplierEmails: (supplier: Supplier, dateRange: DateRange) => Promise<void>;
}

export function useSupplierProcessing(): UseSupplierProcessingReturn {
    const [isFetchingSupplierEmails, setIsFetchingSupplierEmails] = useState(false);

    const notify = useUIStore(state => state.notify);
    const { addSyncLog, setIsSyncing, clearSyncLogs } = useSyncStore();

    const handleFetchSupplierEmails = useCallback(async (supplier: Supplier, dateRange: DateRange) => {
        setIsFetchingSupplierEmails(true);
        addSyncLog(`Starting document processing for ${supplier.name}...`);
        addSyncLog(`Date range: ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`);
        setIsSyncing(true);

        try {
            // Dynamic import to avoid circular deps
            const { documentProcessingService } = await import('../services/documentProcessingService');

            // Set up progress callback
            documentProcessingService.setProgressCallback((progress) => {
                addSyncLog(`[${progress.stage.toUpperCase()}] ${progress.message}`);
            });

            // Process documents with date range
            const results = await documentProcessingService.processSupplierDocuments(supplier, dateRange);

            addSyncLog(`✓ Complete! Processed ${results.length} documents.`);

            notify(
                `Uploaded ${results.length} documents to Drive for ${supplier.name}`,
                'success'
            );

            // Wait a moment to show completion
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            addSyncLog(`✗ Error: ${message}`);
            notify(`Error: ${message}`, 'error');
        } finally {
            setIsFetchingSupplierEmails(false);
            setIsSyncing(false);
            clearSyncLogs();
        }
    }, [addSyncLog, setIsSyncing, clearSyncLogs, notify]);

    return {
        isFetchingSupplierEmails,
        handleFetchSupplierEmails,
    };
}

