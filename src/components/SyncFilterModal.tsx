import React, { useState } from 'react';
import { X, Calendar, ChevronRight, Zap } from 'lucide-react';

interface SyncFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (startDate: Date, endDate: Date) => void;
    isSyncing?: boolean;
}

type PresetType = 'this-month' | 'last-month' | 'last-3-months' | 'custom';

const SyncFilterModal: React.FC<SyncFilterModalProps> = ({ isOpen, onClose, onConfirm, isSyncing }) => {
    const [selectedPreset, setSelectedPreset] = useState<PresetType>('this-month');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    if (!isOpen) return null;

    const getDateRange = (): { start: Date; end: Date } => {
        const now = new Date();

        switch (selectedPreset) {
            case 'this-month': {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { start, end };
            }
            case 'last-month': {
                const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const end = new Date(now.getFullYear(), now.getMonth(), 0);
                return { start, end };
            }
            case 'last-3-months': {
                const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { start, end };
            }
            case 'custom': {
                const start = customStartDate ? new Date(customStartDate) : new Date(now.getFullYear(), now.getMonth(), 1);
                const end = customEndDate ? new Date(customEndDate) : now;
                return { start, end };
            }
            default:
                return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
        }
    };

    const handleConfirm = () => {
        const { start, end } = getDateRange();
        onConfirm(start, end);
    };

    const formatDateDisplay = (date: Date): string => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const { start: previewStart, end: previewEnd } = getDateRange();

    const presets: { id: PresetType; label: string }[] = [
        { id: 'this-month', label: 'This Month' },
        { id: 'last-month', label: 'Last Month' },
        { id: 'last-3-months', label: 'Last 3 Months' },
        { id: 'custom', label: 'Custom Range' },
    ];

    return (
        <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sync-filter-title"
        >
            <div className="bg-white rounded-3xl w-full max-w-md card-shadow overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 id="sync-filter-title" className="text-lg font-bold text-slate-900">Select Date Range</h3>
                            <p className="text-xs text-slate-500">Choose which emails to sync</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Preset Buttons */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quick Select</label>
                        <div className="grid grid-cols-2 gap-2">
                            {presets.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => setSelectedPreset(preset.id)}
                                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${selectedPreset === preset.id
                                        ? 'bg-cyan-50 text-cyan-700 border-2 border-cyan-500'
                                        : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Date Inputs */}
                    {selectedPreset === 'custom' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">From</label>
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                        aria-label="Start date"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">To</label>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                        aria-label="End date"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Will sync emails from</p>
                        <p className="text-sm font-semibold text-slate-900">
                            {formatDateDisplay(previewStart)} → {formatDateDisplay(previewEnd)}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSyncing}
                        className="px-5 py-2.5 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSyncing ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Zap className="w-4 h-4 fill-white" />
                        )}
                        {isSyncing ? 'Syncing...' : 'Run Sync'}
                        {!isSyncing && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SyncFilterModal;
