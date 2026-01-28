import React, { useState, useEffect } from 'react';
import {
    X,
    Search,
    Mail,
    Loader2,
    CheckCircle2,
    UserPlus,
    AlertCircle,
    Building2
} from 'lucide-react';
import { gmailService } from '../services/gmailService';
import { supplierService } from '../services/supplierService';
import { Supplier, SUPPLIER_CATEGORIES } from '../types/supplier';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

interface EmailSender {
    email: string;
    name: string;
    domain: string;
    count: number;
}

interface DiscoverSendersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendersAdded: () => void;
    existingSuppliers: Supplier[];
}

const DiscoverSendersModal: React.FC<DiscoverSendersModalProps> = ({
    isOpen,
    onClose,
    onSendersAdded,
    existingSuppliers
}) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [senders, setSenders] = useState<EmailSender[]>([]);
    const [selectedSenders, setSelectedSenders] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [displayCount, setDisplayCount] = useState(30);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
    const [totalEmailsFetched, setTotalEmailsFetched] = useState(0);

    // Get existing email domains to filter out
    const existingDomains = new Set(
        existingSuppliers
            .filter(s => s.emailDomain)
            .map(s => s.emailDomain!.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            fetchSenders();
        } else {
            // Reset state when closed
            setSenders([]);
            setSelectedSenders(new Set());
            setSearchTerm('');
            setError(null);
            setDisplayCount(30);
            setNextPageToken(undefined);
            setTotalEmailsFetched(0);
        }
    }, [isOpen]);

    const fetchSenders = async (pageToken?: string) => {
        if (pageToken) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        // Get access token - try user first, then fall back to authService
        const accessToken = user?.accessToken || authService.getAccessToken();

        if (!accessToken) {
            setError('Please sign in to access Gmail');
            setIsLoading(false);
            setIsLoadingMore(false);
            return;
        }

        // Set the token on gmailService to ensure it's available
        gmailService.setAccessToken(accessToken);

        try {
            const result = await gmailService.getRecentEmailsPaginated(50, pageToken);

            setNextPageToken(result.nextPageToken);
            setTotalEmailsFetched(prev => prev + result.emails.length);

            // Extract unique senders (merge with existing if loading more)
            const senderMap = new Map<string, EmailSender>();

            // Add existing senders first if loading more
            if (pageToken) {
                senders.forEach(s => senderMap.set(s.email, { ...s }));
            }

            result.emails.forEach(email => {
                const domain = email.senderEmail.split('@')[1]?.toLowerCase() || '';

                if (senderMap.has(email.senderEmail)) {
                    senderMap.get(email.senderEmail)!.count++;
                } else {
                    senderMap.set(email.senderEmail, {
                        email: email.senderEmail,
                        name: email.senderName,
                        domain,
                        count: 1
                    });
                }
            });

            // Convert to array and sort by count (most emails first)
            const senderList = Array.from(senderMap.values())
                .filter(s => !existingDomains.has(s.domain)) // Filter out existing suppliers
                .sort((a, b) => b.count - a.count);

            setSenders(senderList);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch emails');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const loadMoreEmails = () => {
        if (nextPageToken) {
            fetchSenders(nextPageToken);
        }
    };

    const toggleSender = (email: string) => {
        setSelectedSenders(prev => {
            const next = new Set(prev);
            if (next.has(email)) {
                next.delete(email);
            } else {
                next.add(email);
            }
            return next;
        });
    };

    const selectAll = () => {
        setSelectedSenders(new Set(filteredSenders.map(s => s.email)));
    };

    const deselectAll = () => {
        setSelectedSenders(new Set());
    };

    const handleAddSelected = async () => {
        if (selectedSenders.size === 0) return;

        setIsAdding(true);

        try {
            const selectedSendersList = senders.filter(s => selectedSenders.has(s.email));



            for (const sender of selectedSendersList) {
                // Create supplier from sender
                const newSupplier = supplierService.addSupplier({
                    name: sender.name || sender.domain.split('.')[0],
                    emailDomain: sender.domain,
                    category: 'Other',
                    keywords: [],
                    selectedMonths: []
                });

            }

            // Verify suppliers were saved
            const allSuppliers = supplierService.getSuppliers();


            // Call refresh FIRST before closing modal
            onSendersAdded();

            // Small delay to let React process the state update
            await new Promise(resolve => setTimeout(resolve, 100));

            onClose();
        } catch (err: any) {
            console.error('[DiscoverSenders] Error:', err);
            setError(err.message || 'Failed to add suppliers');
        } finally {
            setIsAdding(false);
        }
    };

    const filteredSenders = senders.filter(sender =>
        sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sender.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sender.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayedSenders = filteredSenders.slice(0, displayCount);
    const hasMore = filteredSenders.length > displayCount;

    const handleLoadMore = () => {
        setDisplayCount(prev => prev + 30);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Mail className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Discover Senders</h2>
                            <p className="text-sm text-slate-500">Select email senders to add as suppliers</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search senders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    {/* Selection controls */}
                    {senders.length > 0 && (
                        <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-slate-500">
                                {selectedSenders.size} selected · Showing {displayedSenders.length} of {filteredSenders.length}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectAll}
                                    className="text-xs text-indigo-600 font-medium hover:underline"
                                >
                                    Select All
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                    onClick={deselectAll}
                                    className="text-xs text-slate-500 font-medium hover:underline"
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                            <p className="text-sm text-slate-500">Fetching emails from Gmail...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-3">
                                <AlertCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                            <button
                                onClick={fetchSenders}
                                className="mt-4 text-sm text-indigo-600 font-medium hover:underline"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredSenders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3">
                                <Building2 className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-500">
                                {senders.length === 0
                                    ? 'No new senders found'
                                    : 'No senders match your search'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {displayedSenders.map(sender => (
                                <label
                                    key={sender.email}
                                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedSenders.has(sender.email)
                                        ? 'bg-indigo-50 border-indigo-200'
                                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedSenders.has(sender.email)}
                                        onChange={() => toggleSender(sender.email)}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600">
                                        {sender.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 truncate">
                                            {sender.name}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {sender.email}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                                            {sender.count} emails
                                        </span>
                                    </div>
                                </label>
                            ))}

                            {/* Load More Senders (display pagination) */}
                            {hasMore && (
                                <button
                                    onClick={handleLoadMore}
                                    className="w-full py-3 mt-4 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                                >
                                    Show More Senders ({filteredSenders.length - displayCount} more)
                                </button>
                            )}

                            {/* Load More Emails from Gmail */}
                            {nextPageToken && (
                                <button
                                    onClick={loadMoreEmails}
                                    disabled={isLoadingMore}
                                    className="w-full py-3 mt-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Fetching more emails...
                                        </>
                                    ) : (
                                        <>
                                            Fetch More Emails ({totalEmailsFetched} fetched so far)
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddSelected}
                        disabled={selectedSenders.size === 0 || isAdding}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                    >
                        {isAdding ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <UserPlus className="w-4 h-4" />
                        )}
                        Add {selectedSenders.size} Supplier{selectedSenders.size !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiscoverSendersModal;
