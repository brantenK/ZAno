import React, { useState, useEffect } from 'react';
import { X, Building2, Mail } from 'lucide-react';
import { Supplier } from '../types/supplier';

interface AddSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'isActive'>) => void;
    editSupplier?: Supplier | null;
}

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editSupplier
}) => {
    const [name, setName] = useState('');
    const [emailDomain, setEmailDomain] = useState('');
    const [error, setError] = useState('');

    // Reset form when modal opens/closes or editSupplier changes
    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setName(editSupplier?.name || '');
            setEmailDomain(editSupplier?.emailDomain || '');
            setError('');
        }
    }, [isOpen, editSupplier]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Supplier name is required');
            return;
        }

        if (!emailDomain.trim()) {
            setError('Email domain is required to find emails');
            return;
        }

        onSave({
            name: name.trim(),
            emailDomain: emailDomain.trim().replace(/^@/, ''), // Remove @ if user adds it
            category: 'Other', // Default, not shown to user
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                            {editSupplier ? 'Edit Supplier' : 'Add Supplier'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Supplier Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Supplier Name *
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., TymeBank, MTN, Eskom"
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Email Domain */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Email Domain *
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={emailDomain}
                                onChange={(e) => setEmailDomain(e.target.value)}
                                placeholder="e.g., tymebank.co.za"
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            We'll search for all emails from @{emailDomain || 'domain.co.za'}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                            {editSupplier ? 'Update' : 'Add Supplier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSupplierModal;
