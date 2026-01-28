/**
 * Application Constants
 */

export const APP_CONFIG = {
    NAME: 'Zano Finance',
    VERSION: '1.0.0',
    LOCALE: 'en-ZA', // Default to South African locale
    CURRENCY: 'ZAR',
} as const;

export const SYNC_CONFIG = {
    // Gmail Search
    GMAIL_SEARCH_QUERY: 'category:primary has:attachment (invoice OR statement OR receipt OR tax OR payment)',
    MAX_EMAILS_TO_PROCESS: 500,

    // Batch processing
    BATCH_SIZE: 10,
    DELAY_BETWEEN_DOCS_MS: 300,

    // Timeouts
    SYNC_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
} as const;

export const API_CONFIG = {
    // Gemini
    GEMINI_MODEL: 'gemini-2.0-flash',

    // Retries
    MAX_RETRIES: 3,
    BASE_DELAY_MS: 2000,
    MAX_DELAY_MS: 15000,
} as const;

export const DRIVE_CONFIG = {
    // Folder structure
    ROOT_FOLDER_NAME: 'Zano Finance',
    DEFAULT_MIME_TYPE: 'application/pdf',
} as const;

export const UI_CONFIG = {
    // Dashboard
    RECENT_DOCS_LIMIT: 50,
    GRAPH_DAYS_LOOKBACK: 7,

    // Notifications
    TOAST_DURATION_MS: 3000,
} as const;
