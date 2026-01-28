import { DocType } from './index';

/**
 * Data extracted from a scanned image (receipt, invoice, etc.)
 */
export interface ScanData {
    type: DocType;
    vendorName: string;
    amount?: string;
    currency?: string;
    date?: string;
    reasoning?: string;
}

/**
 * State for the camera capture flow
 */
export interface CameraCaptureState {
    showScanModal: boolean;
    scanImage: string | null;
    isAnalyzingScan: boolean;
    scanData: ScanData | null;
}

/**
 * HTTP error with status code
 */
export interface HttpError extends Error {
    status?: number;
    statusCode?: number;
}

/**
 * Firebase OAuth token response (internal)
 */
export interface OAuthTokenResponse {
    oauthAccessToken?: string;
    expiresIn?: number;
}
