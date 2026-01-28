/**
 * App.tsx - Refactored to use Zustand stores and custom hooks
 * Reduced from 816 lines to ~450 lines
 */

import React, { useState, useEffect, Suspense } from 'react';
import {
  Bell,
  Search,
  LogOut,
  AlertCircle,
  FileCheck,
  HelpCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
  Menu,
  Home,
  Globe
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import CameraFab from './components/CameraFab';

// Lazy load heavy components for code splitting (including Dashboard with recharts)

// Lazy load heavy/secondary components for code splitting
const Dashboard = React.lazy(() => import('./components/Dashboard'));

const Reports = React.lazy(() => import('./components/Reports'));
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const SupplierManager = React.lazy(() => import('./components/SupplierManager'));
const HelpBot = React.lazy(() => import('./components/HelpBot'));
const ScanResultModal = React.lazy(() => import('./components/ScanResultModal'));
const InboxView = React.lazy(() => import('./components/InboxView'));
const SettingsView = React.lazy(() => import('./components/SettingsView'));
const PrivacyPolicy = React.lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./components/TermsOfService'));

// Hooks and stores
import { useAuth } from './hooks/useAuth';
import { useCameraCapture } from './hooks/useCameraCapture';
import { useSupplierProcessing } from './hooks/useSupplierProcessing';
import { useSyncStore } from './stores/syncStore';
import { useUIStore } from './stores/uiStore';

// Services
import { gmailService } from './services/gmailService';
import { driveService } from './services/driveService';
import { errorService, ErrorType, AppError } from './services/errorService';

const App: React.FC = () => {
  const { user, loading: authLoading, error: authError, signIn, signOut, isAuthenticated } = useAuth();

  // UI Store
  const {
    activeTab, setActiveTab,
    notification, notify, clearNotification,
    isSidebarOpen, setSidebarOpen,
    showReauthModal, setReauthModal
  } = useUIStore();

  const {
    emails, processedDocs, reports,
    isSyncing, syncLogs, setIsSyncing,
    loadEmailsFromGmail, runAutopilotSync, reset
  } = useSyncStore();

  // Camera Hook
  const camera = useCameraCapture();

  // Supplier Processing Hook
  const { isFetchingSupplierEmails, handleFetchSupplierEmails } = useSupplierProcessing();

  // Local UI state
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Subscribe to error service for auth expiration
  useEffect(() => {
    const unsubscribe = errorService.subscribe((error: AppError) => {
      if (error.type === ErrorType.AUTH_EXPIRED) {
        // Only show reauth modal if user was previously authenticated
        if (isAuthenticated) {
          setReauthModal(true);
        }
      } else {
        notify(error.userMessage, 'error');
      }
    });
    return unsubscribe;
  }, [notify, setReauthModal, isAuthenticated]);

  // Set access tokens when user signs in
  useEffect(() => {
    if (user?.accessToken) {
      gmailService.setAccessToken(user.accessToken);
      driveService.setAccessToken(user.accessToken);

      // IMPORTANT: Disable demo mode when user signs in with real account
      if (isDemo) {
        setIsDemo(false);
      }

      // Auto-redirect to dashboard when user signs in
      if (activeTab === 'landing') {
        setActiveTab('dashboard');
      }
    }
  }, [user?.accessToken, activeTab, setActiveTab, isDemo]);

  // Load emails from Gmail on first auth
  useEffect(() => {
    if (isAuthenticated && isInitialLoad && user?.accessToken) {
      setIsInitialLoad(false);
      loadEmailsFromGmail().then(count => {
        notify(`Loaded ${count} emails from Gmail`, 'success', 3000);
      }).catch(err => {
        notify(err.message || 'Failed to load emails', 'error');
      });
    }
  }, [isAuthenticated, isInitialLoad, user?.accessToken, loadEmailsFromGmail, notify]);

  const handleSync = async (dateRange?: { start: Date; end: Date }) => {
    if (!user?.accessToken) {
      if (user) {
        // User is logged in but Google Access Token is missing/expired
        notify('Session expired. Please re-authenticate to continue.', 'warning');
        setReauthModal(true);
      } else {
        notify('Please sign in to sync', 'error');
      }
      return;
    }

    try {
      const count = await runAutopilotSync(dateRange);
      if (count > 0) {
        notify(`Successfully uploaded ${count} documents to Google Drive.`, 'success');
      } else {
        notify('Inbox already up to date!', 'success');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      notify(message, 'error');
    }
  };





  const handleSignOut = async () => {
    await signOut();
    reset();
    setIsInitialLoad(true);
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Show Privacy Policy page
  if (activeTab === 'privacy') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>}>
        <PrivacyPolicy onBack={() => setActiveTab(isAuthenticated ? 'dashboard' : 'landing')} />
      </Suspense>
    );
  }

  // Show Terms of Service page
  if (activeTab === 'terms') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>}>
        <TermsOfService onBack={() => setActiveTab(isAuthenticated ? 'dashboard' : 'landing')} />
      </Suspense>
    );
  }

  // Show landing page if not authenticated AND not in demo mode
  // OR if user explicitly navigates to it via the new "Website" link
  if ((!isAuthenticated && !isDemo) || activeTab === 'landing') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>}>
        <LandingPage
          onSignIn={isAuthenticated ? () => setActiveTab('dashboard') : signIn}
          loading={authLoading}
          error={authError}
          onNavigate={setActiveTab}
          onDemoClick={() => {
            setIsDemo(true);
            setActiveTab('dashboard');
          }}
          isAuthenticated={isAuthenticated}
        />
      </Suspense>
    );
  }

  const renderContent = () => {
    const loadingFallback = <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>;

    switch (activeTab) {
      case 'dashboard':
        return <Suspense fallback={loadingFallback}><Dashboard recentDocs={processedDocs} onSync={handleSync} isSyncing={isSyncing} isDemo={isDemo} /></Suspense>;
      case 'suppliers':
        return <Suspense fallback={loadingFallback}><SupplierManager onFetchEmails={handleFetchSupplierEmails} isFetching={isFetchingSupplierEmails} isDemo={isDemo} /></Suspense>;

      case 'reports':
        return <Suspense fallback={loadingFallback}><Reports reports={reports} isDemo={isDemo} /></Suspense>;
      case 'inbox':
        return <Suspense fallback={loadingFallback}><InboxView emails={emails} isDemo={isDemo} /></Suspense>;
      case 'settings':
        return <Suspense fallback={loadingFallback}><SettingsView /></Suspense>;
      default:
        return <Suspense fallback={loadingFallback}><Dashboard recentDocs={processedDocs} onSync={handleSync} isSyncing={isSyncing} isDemo={isDemo} /></Suspense>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSignOut={isDemo ? () => { setIsDemo(false); setActiveTab('landing'); } : handleSignOut}
        isDemo={isDemo}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 glass-header">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-indigo-600 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative group w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search invoices, suppliers, or filings..."
                aria-label="Search invoices, suppliers, or filings"
                className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border border-transparent rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6 ml-6">
            <div className="hidden sm:flex items-center gap-2">
              <button
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                aria-label="Visit Website"
                title="Visit Website"
                onClick={() => setActiveTab('landing')}
              >
                <Globe className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-indigo-600 relative transition-colors group" aria-label="Notifications">
                <Bell className="w-5 h-5 group-hover:animate-pulse" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" aria-hidden="true"></span>
              </button>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <div className="flex items-center gap-3 pl-2 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{user?.displayName || 'User'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">{user?.email?.split('@')[0]}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:border-indigo-500 transition-all overflow-hidden shadow-sm">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-slate-600">{user?.displayName?.charAt(0) || 'U'}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setActiveTab('landing')}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
              title="Home"
              aria-label="Go to Home"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto pb-10">
            {notification && (
              <div
                role="alert"
                aria-live="polite"
                className={`mb-8 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500 border shadow-lg ${notification.type === 'success'
                  ? 'bg-white text-emerald-600 border-emerald-100 shadow-emerald-100/50'
                  : 'bg-white text-rose-600 border-rose-100 shadow-rose-100/50'
                  }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${notification.type === 'success' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    {notification.type === 'success' ? <FileCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  <span className="text-sm font-bold tracking-tight">{notification.message}</span>
                </div>
                <button onClick={clearNotification} className="text-slate-300 hover:text-slate-500 p-1" aria-label="Dismiss notification">
                  <LogOut className="w-4 h-4 rotate-90" />
                </button>
              </div>
            )}

            {renderContent()}
          </div>
        </main>
      </div>

      {/* Sync Progress Modal */}
      {isSyncing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="sync-modal-title">
          <div className="bg-white rounded-3xl w-full max-w-lg card-shadow overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h3 id="sync-modal-title" className="text-lg font-bold text-slate-900">Autopilot Sync</h3>
                  <p className="text-sm text-slate-500">Zano AI Agent is analyzing your data.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50 font-mono text-[11px] space-y-3">
              {syncLogs.map((log, i) => (
                <div key={i} className={`flex items-start gap-3 ${i === syncLogs.length - 1 ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                  <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                  <p className="leading-relaxed">{log}</p>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setIsSyncing(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Processing...</p>
            </div>
          </div>
        </div>
      )}

      {/* Re-authentication Modal */}
      {showReauthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reauth-modal-title">
          <div className="bg-white rounded-3xl w-full max-w-md card-shadow overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-6">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 id="reauth-modal-title" className="text-xl font-bold text-slate-900 mb-2">Session Expired</h3>
              <p className="text-slate-500 text-sm mb-6">
                Your authentication has expired. Please sign in again to continue using Zano.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setReauthModal(false);
                    signOut();
                  }}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Sign Out
                </button>
                <button
                  onClick={async () => {
                    try {
                      await signIn();
                      setReauthModal(false);
                      notify('Successfully signed in!', 'success', 3000);
                    } catch (e) {
                      console.error('Re-auth failed:', e);
                    }
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Sign In Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Help Bot */}
      <Suspense fallback={null}>
        <HelpBot />
      </Suspense>

      {/* Mobile Camera FAB */}
      <CameraFab onCapture={camera.handleCameraCapture} />

      {/* Scan Result Modal */}
      <Suspense fallback={null}>
        <ScanResultModal
          isOpen={camera.showScanModal}
          onClose={camera.closeScanModal}
          onSave={camera.handleSaveScan}
          isAnalyzing={camera.isAnalyzingScan}
          imageUrl={camera.scanImage}
          initialData={camera.scanData}
        />
      </Suspense>
    </div>
  );
};

export default App;
