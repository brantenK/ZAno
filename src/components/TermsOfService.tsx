import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
    onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
                    <p className="text-sm text-slate-500 mb-8">Last updated: January 2026</p>

                    <div className="prose prose-slate max-w-none space-y-6">
                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Acceptance of Terms</h2>
                            <p className="text-slate-600 leading-relaxed">
                                By accessing or using Zano Finance ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">2. Description of Service</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Zano is a financial document automation tool that helps you organize invoices, receipts, and statements from your Gmail into your Google Drive using AI classification.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">3. User Responsibilities</h2>
                            <ul className="list-disc pl-6 text-slate-600 space-y-2">
                                <li>You are responsible for maintaining the security of your Google account.</li>
                                <li>You agree to use the Service only for lawful purposes.</li>
                                <li>You must not attempt to reverse-engineer or compromise the Service.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">4. Data Ownership</h2>
                            <p className="text-slate-600 leading-relaxed">
                                You retain full ownership of all data processed through Zano. We do not claim any rights to your emails, documents, or files. All processed documents are stored in <strong>your</strong> Google Drive.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">5. Disclaimer of Warranties</h2>
                            <p className="text-slate-600 leading-relaxed">
                                The Service is provided "as is" without warranties of any kind. We do not guarantee that document classification will be 100% accurate. Users should verify important financial documents independently.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">6. Limitation of Liability</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Zano Finance shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Service, including but not limited to lost data or business interruption.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">7. Changes to Terms</h2>
                            <p className="text-slate-600 leading-relaxed">
                                We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">8. Governing Law</h2>
                            <p className="text-slate-600 leading-relaxed">
                                These Terms are governed by the laws of the Republic of South Africa. Any disputes shall be resolved in the courts of South Africa.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">9. Contact</h2>
                            <p className="text-slate-600 leading-relaxed">
                                For questions about these Terms, contact us at:{' '}
                                <a href="mailto:support@zano.finance" className="text-cyan-600 hover:underline">support@zano.finance</a>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
