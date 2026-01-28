import { useState, useEffect, useCallback, useRef } from 'react';
import { authService, AuthUser } from '../services/authService';

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isInitialCheck = useRef(true);

    const signOut = useCallback(async () => {
        try {
            await authService.signOut();
            setUser(null);
        } catch (err: any) {
            setError(err.message || 'Failed to sign out');
        }
    }, []);

    useEffect(() => {
        // Listen for auth state changes (handles page refresh, existing sessions)
        const unsubscribe = authService.onAuthChange(async (authUser) => {
            if (import.meta.env.DEV) {
                console.log('[Auth Debug] onAuthStateChanged fired:', authUser ? `User: ${authUser.email}` : 'No user');
                console.log('[Auth Debug] Access token present:', !!authUser?.accessToken);
                console.log('[Auth Debug] Is initial check:', isInitialCheck.current);
            }

            // Only check token expiry on initial page load, not after fresh sign-in
            // This prevents race condition where onAuthStateChanged fires before token is saved
            if (isInitialCheck.current && authUser && !authUser.accessToken && authService.isTokenExpired()) {
                if (import.meta.env.DEV) {
                    console.log('[Auth Debug] Initial load with expired token, signing out...');
                }
                isInitialCheck.current = false;
                await authService.signOut();
                setUser(null);
                setLoading(false);
                return;
            }

            isInitialCheck.current = false;
            setUser(authUser);
            setLoading(false);
        });

        // Also listen for auth expired events (e.g., 401 errors during API calls)
        const unsubscribeExpiry = authService.onAuthExpired(() => {
            if (import.meta.env.DEV) {
                console.log('[Auth Debug] Auth expired event received, signing out...');
            }
            signOut();
        });

        return () => {
            unsubscribe();
            unsubscribeExpiry();
        };
    }, [signOut]);

    const signIn = async () => {
        try {
            setError(null);
            setLoading(true);
            if (import.meta.env.DEV) console.log('[Auth Debug] signIn called, opening popup...');

            // Popup returns user directly (no redirect needed)
            const authUser = await authService.signInWithGoogle();
            if (import.meta.env.DEV) console.log('[Auth Debug] signIn completed, user:', authUser?.email);

            if (authUser) {
                setUser(authUser);
            }
        } catch (err: any) {
            console.error('[Auth Debug] signIn error:', err);
            // Don't show error if user just closed the popup
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(err.message || 'Failed to sign in');
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        loading,
        error,
        signIn,
        signOut,
        isAuthenticated: !!user
    };
}
