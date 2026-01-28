import { create } from 'zustand';

type NotificationType = 'success' | 'error' | 'warning';

interface Notification {
    message: string;
    type: NotificationType;
}

interface UIState {
    activeTab: string;
    notification: Notification | null;
    isSidebarOpen: boolean;
    showReauthModal: boolean;

    // Actions
    setActiveTab: (tab: string) => void;
    notify: (message: string, type: NotificationType, duration?: number) => void;
    clearNotification: () => void;
    setSidebarOpen: (open: boolean) => void;
    setReauthModal: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    activeTab: 'dashboard',
    notification: null,
    isSidebarOpen: false,
    showReauthModal: false,

    setActiveTab: (activeTab) => set({ activeTab }),

    notify: (message, type, duration = 5000) => {
        set({ notification: { message, type } });
        if (duration > 0) {
            setTimeout(() => set({ notification: null }), duration);
        }
    },

    clearNotification: () => set({ notification: null }),
    setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
    setReauthModal: (showReauthModal) => set({ showReauthModal }),
}));
