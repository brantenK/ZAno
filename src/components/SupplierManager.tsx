import React, { useState, useEffect } from 'react';
import {
    Plus,
    Building2,
    Trash2,
    Edit3,
    Mail,
    FileText,
    Loader2,
    RefreshCw,
    Search
} from 'lucide-react';
import { Supplier, SavedEmail, getCurrentFinancialYear } from '../types/supplier';
import { supplierService } from '../services/supplierService';
import AddSupplierModal from './AddSupplierModal';
import DiscoverSendersModal from './DiscoverSendersModal';
import SyncFilterModal from './SyncFilterModal';
import { MOCK_SUPPLIERS } from '../data/mockData';

interface SupplierManagerProps {
    onFetchEmails: (supplier: Supplier, dateRange: { start: Date; end: Date }) => Promise<void>;
    isFetching: boolean;
    isDemo?: boolean;
}

const SupplierManager: React.FC<SupplierManagerProps> = ({ onFetchEmails, isFetching, isDemo = false }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [savedEmails, setSavedEmails] = useState<SavedEmail[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [fetchingSupplier, setFetchingSupplier] = useState<string | null>(null);
    const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);

    // Date filter modal state
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const financialYear = getCurrentFinancialYear();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        if (isDemo) {
            setSuppliers(MOCK_SUPPLIERS);
            setSavedEmails([]);
        } else {
            setSuppliers(supplierService.getSuppliers());
            setSavedEmails(supplierService.getSavedEmails(financialYear));
        }
    };

    const handleAddSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'isActive'>) => {
        const newSupplier = supplierService.addSupplier(supplierData);
        loadData();

        // Open date picker for the new supplier
        setSelectedSupplier(newSupplier);
        setIsDateFilterOpen(true);
    };

    const handleEditSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'isActive'>) => {
        if (editingSupplier) {
            supplierService.updateSupplier(editingSupplier.id, supplierData);
            loadData();
            setEditingSupplier(null);
        }
    };

    const handleDeleteSupplier = (id: string) => {
        if (confirm('Delete this supplier and all associated emails?')) {
            supplierService.deleteSupplier(id);
            loadData();
        }
    };

    // Open date picker when clicking refresh
    const handleRefreshClick = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsDateFilterOpen(true);
    };

    // Process emails after date range is selected
    const handleDateConfirm = async (startDate: Date, endDate: Date) => {
        if (!selectedSupplier) return;

        setIsDateFilterOpen(false);
        setFetchingSupplier(selectedSupplier.id);

        try {
            await onFetchEmails(selectedSupplier, { start: startDate, end: endDate });
            loadData();
        } finally {
            setFetchingSupplier(null);
            setSelectedSupplier(null);
        }
    };

    const getEmailCountForSupplier = (supplierId: string) => {
        return savedEmails.filter(e => e.supplierId === supplierId).length;
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categoryColors: Record<string, string> = {
        'Telecom': 'bg-blue-50 text-blue-600 border-blue-100',
        'Utilities': 'bg-amber-50 text-amber-600 border-amber-100',
        'Banking': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'Insurance': 'bg-purple-50 text-purple-600 border-purple-100',
        'Retail': 'bg-pink-50 text-pink-600 border-pink-100',
        'Professional Services': 'bg-indigo-50 text-indigo-600 border-indigo-100',
        'Government': 'bg-slate-100 text-slate-600 border-slate-200',
        'Other': 'bg-gray-50 text-gray-600 border-gray-200'
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Suppliers
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Manage your suppliers for financial year {financialYear}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-48"
                        />
                    </div>

                    {/* Discover Senders Button */}
                    <button
                        onClick={() => setIsDiscoverModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <Mail className="w-4 h-4" />
                        <span>Discover Senders</span>
                    </button>

                    {/* Add Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Supplier</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{suppliers.length}</p>
                            <p className="text-xs text-slate-500 font-medium">Total Suppliers</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <Mail className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{savedEmails.length}</p>
                            <p className="text-xs text-slate-500 font-medium">Saved Emails</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">
                                {savedEmails.filter(e => e.isProcessed).length}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">Processed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Supplier List */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                {filteredSuppliers.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No suppliers yet</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Add your first supplier to start tracking financial emails
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Your First Supplier
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredSuppliers.map(supplier => (
                            <div
                                key={supplier.id}
                                className="p-5 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600 text-lg">
                                        {supplier.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-900 truncate">{supplier.name}</h4>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${categoryColors[supplier.category] || categoryColors['Other']}`}>
                                                {supplier.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            {supplier.emailDomain && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    @{supplier.emailDomain}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-3 h-3" />
                                                {getEmailCountForSupplier(supplier.id)} emails
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRefreshClick(supplier)}
                                        disabled={isFetching || fetchingSupplier === supplier.id}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="Refresh emails"
                                    >
                                        {fetchingSupplier === supplier.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingSupplier(supplier);
                                            setIsModalOpen(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSupplier(supplier.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Supplier Modal */}
            <AddSupplierModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingSupplier(null);
                }}
                onSave={editingSupplier ? handleEditSupplier : handleAddSupplier}
                editSupplier={editingSupplier}
            />

            {/* Discover Senders Modal */}
            <DiscoverSendersModal
                isOpen={isDiscoverModalOpen}
                onClose={() => setIsDiscoverModalOpen(false)}
                onSendersAdded={loadData}
                existingSuppliers={suppliers}
            />

            {/* Date Range Filter Modal */}
            <SyncFilterModal
                isOpen={isDateFilterOpen}
                onClose={() => {
                    setIsDateFilterOpen(false);
                    setSelectedSupplier(null);
                    loadData(); // Refresh supplier list when modal closes
                }}
                onConfirm={handleDateConfirm}
                isSyncing={!!fetchingSupplier}
            />
        </div>
    );
};

export default SupplierManager;
