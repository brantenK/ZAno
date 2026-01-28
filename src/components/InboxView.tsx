import React, { useState } from 'react';
import { Search, FileCheck } from 'lucide-react';
import { Email } from '../types';
import { MOCK_EMAILS } from '../data/mockData';

interface InboxViewProps {
    emails: Email[];
    isDemo?: boolean;
}

const InboxView: React.FC<InboxViewProps> = ({ emails: propsEmails, isDemo = false }) => {
    const emails = isDemo ? MOCK_EMAILS : propsEmails;
    const [inboxSearch, setInboxSearch] = useState('');

    const filteredEmails = emails.filter(e => {
        const searchLower = inboxSearch.toLowerCase();
        return !inboxSearch ||
            e.subject.toLowerCase().includes(searchLower) ||
            e.senderName.toLowerCase().includes(searchLower) ||
            e.snippet.toLowerCase().includes(searchLower);
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Global Finance Inbox
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Direct view of detected financial correspondence from all senders.
                    </p>
                </div>

                <div className="relative group w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search subject, sender, or content..."
                        value={inboxSearch}
                        onChange={(e) => setInboxSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 w-full md:w-80 transition-all card-shadow"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {filteredEmails.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">No emails found matching your criteria.</p>
                        </div>
                    ) : (
                        filteredEmails.map(email => (
                            <div key={email.id} className="p-6 hover:bg-slate-50/80 transition-all group flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${email.isProcessed ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                    {email.senderName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-bold text-slate-900 tracking-tight">{email.senderName}</p>
                                        <span className="text-xs text-slate-400 font-medium">{new Date(email.date).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-800 mb-1 truncate">{email.subject}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-1">{email.snippet}</p>
                                    {email.hasAttachment && (
                                        <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg w-fit">
                                            <FileCheck className="w-3.5 h-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{email.attachmentName}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {email.isProcessed ? (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">Indexed</span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 uppercase tracking-widest">Pending</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default InboxView;
