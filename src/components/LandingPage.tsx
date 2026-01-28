import React from 'react';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, Zap, FileCheck, TrendingUp, Shield } from 'lucide-react';

interface LandingPageProps {
    onSignIn: () => void;
    loading: boolean;
    error: string | null;
    onNavigate?: (tab: string) => void;
    onDemoClick?: () => void;
    isAuthenticated?: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, loading, error, onNavigate, onDemoClick, isAuthenticated }) => {
    return (
        <div className="bg-[#F8FAFC] bg-pattern overflow-y-auto">
            {/* Header */}
            <header className="px-6 lg:px-12 py-5 glass-header sticky top-0 z-50">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <img src="/logo.png" alt="Zano" className="w-10 h-10 rounded-xl shadow-md" />
                        <div className="text-left">
                            <span className="text-lg font-bold text-slate-900">Zano</span>
                            <p className="text-[10px] text-cyan-600 font-semibold uppercase tracking-widest">Autopilot</p>
                        </div>
                    </button>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-slate-600 hover:text-cyan-600 text-sm font-medium transition-colors">
                            Features
                        </a>
                        <a href="#pricing" className="text-slate-600 hover:text-cyan-600 text-sm font-medium transition-colors">
                            Pricing
                        </a>
                        <button
                            onClick={onSignIn}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold text-sm rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-lg shadow-cyan-500/30"
                        >
                            <Zap className="w-4 h-4 fill-white" />
                            {isAuthenticated ? 'Go to Dashboard' : 'Sign in with Google'}
                        </button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main className="px-6 lg:px-12 py-12 lg:py-20 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Content */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-100 rounded-full">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Now with AI-Powered Insights</span>
                        </div>

                        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
                            Meet Zano. Your{' '}
                            <span className="text-gradient-cyan">personal accountant.</span>
                        </h1>

                        <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                            Zano transforms complex bookkeeping into simple conversations.
                            Reconcile transactions, track expenses, and generate financial reports instantly.
                        </p>

                        {error && (
                            <div className="p-4 bg-white border border-red-200 rounded-2xl flex items-center gap-3 shadow-lg shadow-red-100/50">
                                <div className="p-2 bg-red-50 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <p className="text-red-700 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={onSignIn}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30 active:scale-95"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5 fill-white" />
                                        <span>{isAuthenticated ? 'Go to Dashboard' : 'Sign in with Google'}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            {!isAuthenticated && onDemoClick && (
                                <button
                                    onClick={onDemoClick}
                                    className="inline-flex items-center gap-2 px-6 py-4 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-cyan-200 transition-all card-shadow"
                                >
                                    <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center">
                                        <Zap className="w-3 h-3 text-cyan-600" />
                                    </div>
                                    View Demo
                                </button>
                            )}

                            <a
                                href="#features"
                                className="inline-flex items-center gap-2 px-6 py-4 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-cyan-200 transition-all card-shadow"
                            >
                                View features
                            </a>
                        </div>

                        {/* Feature Badges */}
                        <div className="space-y-3 pt-4">
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="p-1.5 bg-emerald-50 rounded-lg">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-sm font-medium">Private & local-first architecture</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="p-1.5 bg-emerald-50 rounded-lg">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-sm font-medium">Double-entry accounting standards</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Image */}
                    <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                        <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-slate-200 card-shadow">
                            <img
                                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80"
                                alt="Financial documents and calculator on desk"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Floating Stats Card */}
                        <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-xl shadow-slate-200/50 animate-in zoom-in-95 duration-500 delay-300">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-cyan-50 rounded-xl">
                                    <FileCheck className="w-6 h-6 text-cyan-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">1,284</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Docs Captured</p>
                                </div>
                            </div>
                        </div>
                        {/* Another floating card */}
                        <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-xl shadow-slate-200/50 animate-in zoom-in-95 duration-500 delay-500">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 rounded-xl">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-900">12.5 hrs</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Saved</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section id="features" className="px-6 lg:px-12 py-20 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Designed for clarity</h2>
                    <p className="text-slate-500 max-w-xl mx-auto">Powerful automation features that save you hours every week</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 card-shadow hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center mb-6">
                            <svg viewBox="0 0 24 24" className="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="16" rx="2" />
                                <path d="M7 8h10M7 12h6" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3">Smart Gmail Integration</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Automatically scan your inbox for invoices, statements, and receipts.
                            AI classifies each document instantly.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-8 border border-slate-200 card-shadow hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                            <svg viewBox="0 0 24 24" className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 3v18h18" />
                                <path d="M7 16l4-4 4 4 6-6" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3">Organized in Drive</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Documents are automatically sorted into folders by supplier,
                            financial year, and document type.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-8 border border-slate-200 card-shadow hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                            <svg viewBox="0 0 24 24" className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3">AI-Powered Insights</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Get intelligent summaries, expense tracking, and reconciliation
                            reports powered by Gemini AI.
                        </p>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="px-6 lg:px-12 py-16 max-w-7xl mx-auto">
                <div className="bg-gradient-to-br from-cyan-50 to-slate-50 rounded-3xl p-10 border border-cyan-100 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-cyan-200 shadow-sm">
                            <Shield className="w-7 h-7 text-cyan-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Enterprise-Grade Security</h3>
                            <p className="text-sm text-slate-600">All data stays in your Google Drive. We never store your documents.</p>
                        </div>
                    </div>
                    <button
                        onClick={onSignIn}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-lg shadow-cyan-500/30 whitespace-nowrap"
                    >
                        <Zap className="w-4 h-4 fill-white" />
                        Start Free Trial
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 lg:px-12 py-8 border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-slate-500">
                        <img src="/logo.png" alt="Zano" className="w-8 h-8 rounded-lg" />
                        <span className="text-sm font-medium">© 2026 Zano Finance. All rights reserved.</span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-slate-500">
                        <button onClick={() => onNavigate?.('privacy')} className="hover:text-cyan-600 transition-colors font-medium">Privacy</button>
                        <button onClick={() => onNavigate?.('terms')} className="hover:text-cyan-600 transition-colors font-medium">Terms</button>
                        <a href="mailto:support@zano.finance" className="hover:text-cyan-600 transition-colors font-medium">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
