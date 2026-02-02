import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
    onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-600 hover:text-cyan-600 mb-8 font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="bg-white rounded-2xl p-8 md:p-12 border border-slate-200 shadow-sm">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
                    <p className="text-sm text-slate-500 mb-8">Last updated: January 2026</p>

                    <div className="prose prose-slate max-w-none space-y-6">
                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Introduction</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Zano Finance (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our financial document automation service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">2. Information We Access</h2>
                            <p className="text-slate-600 leading-relaxed mb-3">
                                When you sign in with Google, we request access to:
                            </p>
                            <ul className="list-disc pl-6 text-slate-600 space-y-2">
                                <li><strong>Gmail (Read-Only):</strong> To scan for financial documents like invoices, statements, and receipts.</li>
                                <li><strong>Google Drive (File Access):</strong> To organize and store your classified documents in your own Drive.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">3. How We Use Your Data</h2>
                            <ul className="list-disc pl-6 text-slate-600 space-y-2">
                                <li>Documents are processed locally in your browser or via secure API calls.</li>
                                <li>We use Google Gemini AI to classify document types (invoice, receipt, etc.).</li>
                                <li>Classified documents are uploaded directly to <strong>your own</strong> Google Drive.</li>
                                <li>We do <strong>not</strong> store your emails, attachments, or documents on our servers.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">4. Data Storage</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Zano operates on a <strong>local-first architecture</strong>. Your data remains in your Google account. We only store minimal session information (authentication tokens) temporarily in your browser&apos;s session storage.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">5. Third-Party Services</h2>
                            <ul className="list-disc pl-6 text-slate-600 space-y-2">
                                <li><strong>Google APIs:</strong> For authentication, Gmail, and Drive access.</li>
                                <li><strong>Google Gemini AI:</strong> For document classification and image analysis.</li>
                                <li><strong>Sentry:</strong> For error monitoring (no personal data is transmitted).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">6. Your Rights</h2>
                            <p className="text-slate-600 leading-relaxed">
                                You can revoke Zano&apos;s access to your Google account at any time via your{' '}
                                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">
                                    Google Account Permissions
                                </a>.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">7. Contact</h2>
                            <p className="text-slate-600 leading-relaxed">
                                For questions about this Privacy Policy, contact us at:{' '}
                                <a href="mailto:support@zano.finance" className="text-cyan-600 hover:underline">support@zano.finance</a>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
