import {
    signInWithPopup,
    getRedirectResult,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    UserCredential
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { errorService, ErrorType } from './errorService';

const TOKEN_STORAGE_KEY = 'zano_oauth_token';
const TOKEN_EXPIRY_KEY = 'zano_oauth_expiry';

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    accessToken: string | null;
}

type AuthExpiredCallback = () => void;

class AuthService {
    private accessToken: string | null = null;
    private tokenExpiryTime: number | null = null;
    private authExpiredCallbacks: AuthExpiredCallback[] = [];

    constructor() {
        // Restore token from sessionStorage on init
        this.restoreToken();
    }

    private restoreToken(): void {
        try {
            const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
            const storedExpiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);

            if (storedToken && storedExpiry) {
                const expiryTime = parseInt(storedExpiry, 10);
                // Only restore if not expired
                if (Date.now() < expiryTime) {
                    this.accessToken = storedToken;
                    this.tokenExpiryTime = expiryTime;
                } else {
                    // Silently clear expired token on startup (don't trigger error modal)
                    this.clearStoredToken();
                }
            }
        } catch (e) {
            // Silently fail - don't trigger error modal on startup
            console.warn('Failed to restore auth token:', e);
        }
    }

    private saveToken(token: string, expiryTime: number): void {
        try {
            sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
            sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
        } catch (e) {
            console.warn('Failed to save auth token:', e);
        }
    }

    private clearStoredToken(): void {
        try {
            sessionStorage.removeItem(TOKEN_STORAGE_KEY);
            sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
        } catch (e) {
            console.warn('Failed to clear auth token:', e);
        }
    }

    async signInWithGoogle(): Promise<AuthUser | null> {
        try {

            // Use popup instead of redirect for better localhost compatibility
            const result = await signInWithPopup(auth, googleProvider);


            // Get the OAuth access token for Google APIs
            const oauthCredential = (result as any)._tokenResponse;


            this.accessToken = oauthCredential?.oauthAccessToken || null;


            // Token typically expires in 1 hour (3600 seconds)
            // We'll set expiry 5 minutes early to be safe
            const expiresIn = oauthCredential?.expiresIn || 3600;
            this.tokenExpiryTime = Date.now() + (expiresIn - 300) * 1000;

            // Persist token for hot reload recovery
            if (this.accessToken && this.tokenExpiryTime) {
                this.saveToken(this.accessToken, this.tokenExpiryTime);

            }

            return this.formatUser(result.user);
        } catch (error: any) {
            console.error('[Auth Debug] signInWithGoogle error:', error);
            // User closed popup or other error
            if (error.code !== 'auth/popup-closed-by-user') {
                errorService.handleError(error, 'authentication');
            }
            throw error;
        }
    }

    async checkRedirectResult(): Promise<AuthUser | null> {
        try {

            const result = await getRedirectResult(auth);


            if (result) {


                // Get the OAuth access token for Google APIs
                const oauthCredential = (result as any)._tokenResponse;



                this.accessToken = oauthCredential?.oauthAccessToken || null;

                // Token typically expires in 1 hour (3600 seconds)
                // We'll set expiry 5 minutes early to be safe
                const expiresIn = oauthCredential?.expiresIn || 3600;
                this.tokenExpiryTime = Date.now() + (expiresIn - 300) * 1000;

                // Persist token for hot reload recovery
                if (this.accessToken && this.tokenExpiryTime) {
                    this.saveToken(this.accessToken, this.tokenExpiryTime);

                }

                const formattedUser = this.formatUser(result.user);

                return formattedUser;
            }

            return null;
        } catch (error: any) {
            console.error('[Auth Debug] checkRedirectResult error:', error);
            errorService.handleError(error, 'authentication');
            throw error;
        }
    }

    async signOut(): Promise<void> {
        await firebaseSignOut(auth);
        this.accessToken = null;
        this.tokenExpiryTime = null;
        this.clearStoredToken();

        // Clear drive folder cache on logout
        const { driveService } = await import('./driveService');
        driveService.clearCache();
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    /**
     * Check if the token is expired or about to expire
     */
    isTokenExpired(): boolean {
        if (!this.accessToken || !this.tokenExpiryTime) {
            return true;
        }
        return Date.now() >= this.tokenExpiryTime;
    }

    /**
     * Get remaining token lifetime in seconds
     */
    getTokenRemainingTime(): number {
        if (!this.tokenExpiryTime) return 0;
        return Math.max(0, Math.floor((this.tokenExpiryTime - Date.now()) / 1000));
    }

    /**
     * Register callback for when auth expires
     */
    onAuthExpired(callback: AuthExpiredCallback): () => void {
        this.authExpiredCallbacks.push(callback);
        return () => {
            this.authExpiredCallbacks = this.authExpiredCallbacks.filter(c => c !== callback);
        };
    }

    /**
     * Notify all listeners that auth has expired
     */
    notifyAuthExpired(): void {
        errorService.report({
            type: ErrorType.AUTH_EXPIRED,
            message: 'OAuth token expired',
            userMessage: 'Your session has expired. Please sign in again.',
            isRetryable: false,
            timestamp: new Date().toISOString()
        });

        this.authExpiredCallbacks.forEach(callback => {
            try {
                callback();
            } catch (e) {
                console.error('Error in auth expired callback:', e);
            }
        });
    }

    /**
     * Handle 401 errors from API calls
     */
    handleAuthError(): void {
        this.accessToken = null;
        this.tokenExpiryTime = null;
        this.notifyAuthExpired();
    }

    onAuthChange(callback: (user: AuthUser | null) => void): () => void {
        return onAuthStateChanged(auth, (user) => {
            callback(user ? this.formatUser(user) : null);
        });
    }

    getCurrentUser(): User | null {
        return auth.currentUser;
    }

    private formatUser(user: User): AuthUser {
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            accessToken: this.accessToken
        };
    }
}

export const authService = new AuthService();
