import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { driveService } from '../driveService';

vi.mock('../errorService', () => ({
    errorService: {
        handleError: vi.fn(),
    }
}));

describe('DriveService', () => {
    const mockAccessToken = 'mock-access-token';
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    beforeEach(() => {
        vi.resetAllMocks();
        driveService.setAccessToken(mockAccessToken);
        // Clear private cache if possible, or just rely on new instance/reset
        // Since singleton, testing stateful cache entails some care
        (driveService as any).folderCache.clear();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('ensureFolder', () => {
        it('should create new folders recursively', async () => {
            // 1. Search for 'Year' (not found)
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [] })
            });

            // 2. Create 'Year'
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'folder-year-id', name: 'Year' })
            });

            // 3. Search for 'Month' (not found)
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [] })
            });

            // 4. Create 'Month'
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'folder-month-id', name: 'Month' })
            });

            const folderId = await driveService.ensureFolder('Year/Month');

            expect(folderId).toBe('folder-month-id');
            expect(fetchMock).toHaveBeenCalledTimes(4);
        });

        it('should use cache for subsequent calls', async () => {
            // 1. Search 'Year' (found)
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [{ id: 'existing-id', name: 'Year' }] })
            });

            const id1 = await driveService.ensureFolder('Year');
            const id2 = await driveService.ensureFolder('Year');

            expect(id1).toBe('existing-id');
            expect(id2).toBe('existing-id');
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('uploadFile', () => {
        it('should upload file if it does not exist', async () => {
            // Mock ensureFolder (simplified)
            const folderSpy = vi.spyOn(driveService, 'ensureFolder').mockResolvedValue('folder-id');

            // Mock duplicate check (not found)
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [] })
            });

            // Mock upload
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'new-file-id', name: 'test.pdf' })
            });

            const blob = new Blob(['test'], { type: 'application/pdf' });
            const result = await driveService.uploadFile('test.pdf', blob, 'Folder');

            expect(result.id).toBe('new-file-id');
            expect(fetchMock).toHaveBeenCalledTimes(2); // check + upload
        });

        it('should skip upload if file exists', async () => {
            const folderSpy = vi.spyOn(driveService, 'ensureFolder').mockResolvedValue('folder-id');

            // Mock duplicate check (found)
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [{ id: 'existing-id', name: 'test.pdf' }] })
            });

            const blob = new Blob(['test'], { type: 'application/pdf' });
            const result = await driveService.uploadFile('test.pdf', blob, 'Folder');

            expect(result.id).toBe('existing-id');
            expect(fetchMock).toHaveBeenCalledTimes(1); // check only
        });
    });
});
