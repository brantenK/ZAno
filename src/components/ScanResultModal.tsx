import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, Calendar, DollarSign, Building2 } from 'lucide-react';
import { DocType } from '../types';
import { ScanData } from '../types/scan';

interface ScanResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ScanData) => void;
    isAnalyzing: boolean;
    imageUrl: string | null;
    initialData: ScanData | null;
}

const ScanResultModal: React.FC<ScanResultModalProps> = ({
    isOpen,
    onClose,
    onSave,
    isAnalyzing,
    imageUrl,
    initialData
}) => {
    const [formData, setFormData] = useState({
        vendorName: '',
        amount: '',
        date: '',
        type: 'RECEIPT'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                vendorName: initialData.vendorName || '',
                amount: initialData.amount || '',
                date: initialData.date || new Date().toISOString().split('T')[0],
                type: initialData.type || 'RECEIPT'
            });
        }
    }, [initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom duration-300 md:zoom-in-95 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">Scan Receipt</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Image Preview */}
                    <div className="h-64 bg-slate-900 flex items-center justify-center relative group">
                        {imageUrl ? (
                            <img src={imageUrl} alt="Receipt" className="h-full w-full object-contain" />
                        ) : (
                            <div className="text-slate-500">No Image</div>
                        )}

                        {isAnalyzing && (
                            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                <p className="font-bold text-sm tracking-wide animate-pulse">AI Analyzing...</p>
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vendor</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.vendorName}
                                    onChange={e => setFormData({ ...formData, vendorName: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    placeholder="e.g. Starbucks"
                                    disabled={isAnalyzing}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        placeholder="0.00"
                                        disabled={isAnalyzing}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        disabled={isAnalyzing}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white">
                    <button
                        onClick={() => onSave(formData)}
                        disabled={isAnalyzing || !formData.vendorName}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? (
                            'Processing...'
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Save Document
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScanResultModal;
