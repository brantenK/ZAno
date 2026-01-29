// Settings service for managing application settings
// Moved from SettingsView.tsx to maintain proper separation of concerns

const SETTINGS_STORAGE_KEY = 'zano_settings';

export interface AppSettings {
    syncFrequency: 'realtime' | 'hourly' | 'daily';
    aiConfidenceThreshold: number;
}

const defaultSettings: AppSettings = {
    syncFrequency: 'realtime',
    aiConfidenceThreshold: 85,
};

let cachedSettings: AppSettings | null = null;

export const loadSettings = (): AppSettings => {
    // Return cached settings if available
    if (cachedSettings) {
        return cachedSettings;
    }
    
    try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
            cachedSettings = { ...defaultSettings, ...JSON.parse(stored) };
            return cachedSettings;
        }
    } catch (e) {
        console.warn('Failed to load settings:', e);
    }
    
    cachedSettings = defaultSettings;
    return defaultSettings;
};

export const saveSettings = (settings: AppSettings): void => {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        // Update cache
        cachedSettings = settings;
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
};

// Clear cache when settings change (call this when user updates settings)
export const clearSettingsCache = (): void => {
    cachedSettings = null;
};
