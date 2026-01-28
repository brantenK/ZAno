import { useState, useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import { driveService } from '../services/driveService';
import { ScanData } from '../types/scan';
import { DocumentRecord, DocType } from '../types';
import { useSyncStore } from '../stores/syncStore';
import { useUIStore } from '../stores/uiStore';

interface CameraCaptureState {
    showScanModal: boolean;
    scanImage: string | null;
    isAnalyzingScan: boolean;
    scanData: ScanData | null;
}

interface UseCameraCaptureReturn extends CameraCaptureState {
    handleCameraCapture: (file: File) => Promise<void>;
    handleSaveScan: (data: ScanData) => Promise<void>;
    closeScanModal: () => void;
}

export function useCameraCapture(): UseCameraCaptureReturn {
    const [showScanModal, setShowScanModal] = useState(false);
    const [scanImage, setScanImage] = useState<string | null>(null);
    const [isAnalyzingScan, setIsAnalyzingScan] = useState(false);
    const [scanData, setScanData] = useState<ScanData | null>(null);

    const addProcessedDocs = useSyncStore(state => state.addProcessedDocs);
    const notify = useUIStore(state => state.notify);

    const handleCameraCapture = useCallback(async (file: File) => {
        // Show preview immediately
        const imageUrl = URL.createObjectURL(file);
        setScanImage(imageUrl);
        setShowScanModal(true);
        setIsAnalyzingScan(true);

        try {
            // Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = async () => {
                const base64String = (reader.result as string).split(',')[1];

                // Analyze with Gemini Vision
                const result = await geminiService.analyzeImage(base64String, file.type);
                setScanData(result);
                setIsAnalyzingScan(false);
            };

            reader.onerror = () => {
                setIsAnalyzingScan(false);
                notify('Failed to read image file.', 'error');
            };

        } catch (err) {
            console.error('Scan failed:', err);
            setIsAnalyzingScan(false);
            notify('Failed to analyze image. Please try again.', 'error');
        }
    }, [notify]);

    const handleSaveScan = useCallback(async (data: ScanData) => {
        try {
            if (!scanImage) return;

            notify('Saving document...', 'success', 2000);
            setShowScanModal(false);

            // Fetch blob from object URL
            const response = await fetch(scanImage);
            const blob = await response.blob();

            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            const now = new Date();
            const monthName = monthNames[now.getMonth()];
            const year = now.getFullYear();
            const filename = `Scan_${data.vendorName.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
            const drivePath = `Zano/Mobile Scans/${monthName} ${year}`;

            await driveService.uploadFile(filename, blob, drivePath, blob.type);

            // Create record
            const newDoc: DocumentRecord = {
                id: `scan_${Date.now()}`,
                type: data.type || DocType.RECEIPT,
                sender: data.vendorName,
                processedAt: new Date().toISOString(),
                drivePath: `${drivePath}/${filename}`,
                amount: data.amount,
                currency: data.currency || 'USD',
                emailId: 'mobile_scan'
            };

            addProcessedDocs([newDoc]);
            notify('Receipt saved successfully!', 'success');

            // Cleanup
            setScanImage(null);
            setScanData(null);

        } catch (err) {
            console.error('Save failed:', err);
            notify('Failed to save document.', 'error');
        }
    }, [scanImage, addProcessedDocs, notify]);

    const closeScanModal = useCallback(() => {
        setShowScanModal(false);
        setScanImage(null);
        setScanData(null);
    }, []);

    return {
        showScanModal,
        scanImage,
        isAnalyzingScan,
        scanData,
        handleCameraCapture,
        handleSaveScan,
        closeScanModal,
    };
}
