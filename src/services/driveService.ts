import { withRetry } from './retryHelper';
import { authService } from './authService';
import { errorService } from './errorService';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    parents?: string[];
}

class ApiError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
        super(message);
        this.status = status;
    }
}

class DriveService {
    private accessToken: string | null = null;
    private folderCache: Map<string, string> = new Map();
    // Per-segment mutex to prevent duplicate folder creation during parallel processing
    // Key format: "parentId/folderName" to lock at the segment level
    private pendingSegmentCreations: Map<string, Promise<string>> = new Map();

    setAccessToken(token: string) {
        this.accessToken = token;
        // Don't clear cache on token refresh - folders still exist in Drive
        // Only clear if this is a different user (token changes completely)
        // The cache is safe to keep as folder IDs don't change
    }

    clearCache() {
        // Explicit method to clear cache when needed (e.g., user logout)
        this.folderCache.clear();
        this.pendingSegmentCreations.clear();
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
                const error = new ApiError(errorData.error?.message || `Drive API error: ${response.status}`, response.status);
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
                errorService.handleError(error, 'Drive API');
            }
            throw error;
        });
    }

    async ensureFolder(folderPath: string): Promise<string> {
        // Check cache first for the full path
        if (this.folderCache.has(folderPath)) {
            return this.folderCache.get(folderPath)!;
        }

        // Build the path segment by segment, with per-segment locking
        const folderId = await this.createFolderPath(folderPath);
        this.folderCache.set(folderPath, folderId);
        return folderId;
    }

    private async createFolderPath(folderPath: string): Promise<string> {
        const parts = folderPath.split('/').filter(Boolean);
        let parentId = 'root';

        for (const folderName of parts) {
            const cacheKey = parentId + '/' + folderName;

            // Check cache first
            if (this.folderCache.has(cacheKey)) {
                parentId = this.folderCache.get(cacheKey)!;
                continue;
            }

            // Check if this exact segment is already being created (per-segment lock)
            if (this.pendingSegmentCreations.has(cacheKey)) {
                parentId = await this.pendingSegmentCreations.get(cacheKey)!;
                continue;
            }

            // Create promise for this segment and track it
            const segmentPromise = this.ensureSingleFolder(parentId, folderName);
            this.pendingSegmentCreations.set(cacheKey, segmentPromise);

            try {
                parentId = await segmentPromise;
                this.folderCache.set(cacheKey, parentId);
            } finally {
                this.pendingSegmentCreations.delete(cacheKey);
            }
        }

        return parentId;
    }

    private async ensureSingleFolder(parentId: string, folderName: string): Promise<string> {
        // Search for existing folder
        const query = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const searchResult = await this.fetchWithAuth(
            `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`
        );

        if (searchResult.files && searchResult.files.length > 0) {
            return searchResult.files[0].id;
        }

        // Create the folder
        const newFolder = await this.fetchWithAuth(`${DRIVE_API_BASE}/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId],
            }),
        });
        return newFolder.id;
    }

    async uploadFile(
        fileName: string,
        content: Blob,
        folderPath: string,
        mimeType: string = 'application/pdf'
    ): Promise<DriveFile> {
        const folderId = await this.ensureFolder(folderPath);

        // Check for duplicate - look for file with same name in this folder
        const existingFile = await this.findFileInFolder(folderId, fileName);
        if (existingFile) {
            if (import.meta.env.DEV) console.log(`File "${fileName}" already exists in Drive, skipping upload.`);
            return existingFile;
        }

        // Use multipart upload for files with metadata
        const metadata = {
            name: fileName,
            parents: [folderId],
        };

        const formData = new FormData();
        formData.append(
            'metadata',
            new Blob([JSON.stringify(metadata)], { type: 'application/json' })
        );
        formData.append('file', content, fileName);

        const response = await fetch(
            `${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                },
                body: formData,
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Upload failed: ${response.status}`);
        }

        return response.json();
    }

    private async findFileInFolder(folderId: string, fileName: string): Promise<DriveFile | null> {
        try {
            const query = `name='${fileName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`;
            const result = await this.fetchWithAuth(
                `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink)`
            );

            if (result.files && result.files.length > 0) {
                return result.files[0];
            }
            return null;
        } catch (error) {
            console.error('Error checking for duplicate file:', error);
            return null; // On error, proceed with upload
        }
    }

    async listFilesInFolder(folderPath: string): Promise<DriveFile[]> {
        const folderId = await this.ensureFolder(folderPath);

        const result = await this.fetchWithAuth(
            `${DRIVE_API_BASE}/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,mimeType,webViewLink)`
        );

        return result.files || [];
    }
}

export const driveService = new DriveService();
