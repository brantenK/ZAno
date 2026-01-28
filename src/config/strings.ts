/**
 * UI String Definitions
 * Centralizes all user-facing text for easier maintenance and potential localization
 */

export const STRINGS = {
    APP: {
        NAME: 'Zano',
        TAGLINE: 'Autopilot',
        COPYRIGHT: '© 2026 Zano. All rights reserved.',
    },

    DASHBOARD: {
        TITLE: 'Financial Overview',
        SUBTITLE: 'Zano is currently monitoring 5 accounts in real-time.',
        SYNC_BUTTON: {
            IDLE: 'Run Autopilot Sync',
            PROCESSING: 'Processing...',
        },
        STATS: {
            DOCS_CAPTURED: 'Documents Captured',
            EFFORT_SAVED: 'Manual Effort Saved',
            PENDING: 'Pending Classification',
            ALL_CLEAN: 'All Clean',
        },
        CHARTS: {
            VOLUME_TITLE: 'Processing Volume',
            VOLUME_SUBTITLE: 'Documents processed by AI per day',
            PERIOD_7_DAYS: 'Last 7 Days',
            PERIOD_30_DAYS: 'Last 30 Days',
        },
        RECENT_STREAM: {
            TITLE: 'Recent Stream',
            AUDIT_LOG: 'Audit Log',
            EMPTY_STATE: 'Waiting for incoming data...',
            DRIVE_USAGE: 'Drive Usage',
        },
    },

    SIDEBAR: {
        MENU: {
            HOME: 'Home',
            DASHBOARD: 'Dashboard',
            SUPPLIERS: 'Suppliers',

            INBOX: 'Finance Inbox',
            REPORTS: 'Daily Reports',
            SETTINGS: 'Settings',
        },
        SYNC_ACTIVE: 'Sync Active',
        WEEKLY_INDEX: (count: number) => `${count} docs indexed this week.`,
        PLAN_PRO: 'Pro Plan',
    },

    AUTH: {
        SIGN_IN_WITH_GOOGLE: 'Sign in with Google',
        SIGN_OUT: 'Sign Out',
        SESSION_EXPIRED_TITLE: 'Session Expired',
        SESSION_EXPIRED_MSG: 'Your authentication has expired. Please sign in again to continue using Zano.',
        SIGN_IN_AGAIN: 'Sign In Again',
    },

    NOTIFICATIONS: {
        SYNC_SUCCESS: (count: number) => `Successfully uploaded ${count} documents to Google Drive.`,
        SYNC_UP_TO_DATE: 'Inbox already up to date!',
        PLEASE_SIGN_IN: 'Please sign in to sync',
        LOAD_EMAILS_SUCCESS: (count: number) => `Loaded ${count} emails from Gmail`,
        LOAD_EMAILS_FAIL: 'Failed to load emails',
    },

    MODALS: {
        SYNC_PROGRESS: {
            TITLE: 'Autopilot Sync',
            SUBTITLE: 'Zano AI Agent is analyzing your data.',
            PROCESSING_MSG: 'Processing... Please keep window open',
        },
        SCAN_RESULT: {
            TITLE: 'Scan Analysis',
            SUBTITLE: 'Review the extracted details below',
            SAVE_BUTTON: 'Save to Drive',
            DISCARD_BUTTON: 'Discard',
        }
    }
} as const;
