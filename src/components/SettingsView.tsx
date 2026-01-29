import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Trash2 } from 'lucide-react';
import { processedEmailsService } from '../services/processedEmailsService';
import { loadSettings, saveSettings, clearSettingsCache, AppSettings } from '../services/settingsService';

const SettingsView: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings>(loadSettings);

    useEffect(() => {
        saveSettings(settings);
        clearSettingsCache(); // Clear cache when settings change
    }, [settings]);

    const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as AppSettings['syncFrequency'];
        setSettings(prev => ({ ...prev, syncFrequency: value }));
    };

    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        setSettings(prev => ({ ...prev, aiConfidenceThreshold: value }));
    };

    const handleClearSyncCache = async () => {
        if (confirm('This will clear all sync history. Next sync will reprocess all emails. Continue?')) {
            await processedEmailsService.init();
            processedEmailsService.clearAll();
            alert('Sync cache cleared! Next sync will process all emails fresh.');
        }
    };

    const handleResetApp = () => {
        const confirmText = prompt('Type "RESET" to confirm you want to delete all app data:');
        if (confirmText === 'RESET') {
            // Clear all localStorage keys that start with 'zano'
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('zano')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Clear sessionStorage (auth tokens)
            sessionStorage.clear();

            // Clear IndexedDB
            indexedDB.deleteDatabase('ZanoFinanceDB');

            alert('All app data has been cleared. The page will now reload.');
            window.location.reload();
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden animate-in fade-in duration-700">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-2xl font-bold text-slate-900">Preferences</h3>
                <p className="text-slate-500 text-sm mt-1">Manage your document autopilot settings.</p>
            </div>
            <div className="p-10 space-y-10">
                <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Automation Core</h4>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between py-4 border-b border-slate-50">
                            <div>
                                <p className="font-bold text-slate-800">Auto-Sync Frequency</p>
                                <p className="text-xs text-slate-500 mt-1">Control how aggressively Zano scans your incoming mail.</p>
                            </div>
                            <select
                                value={settings.syncFrequency}
                                onChange={handleFrequencyChange}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                            >
                                <option value="realtime">Real-time (Push)</option>
                                <option value="hourly">Every 1 hour</option>
                                <option value="daily">Daily</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between py-4">
                            <div>
                                <p className="font-bold text-slate-800">AI Confidence Threshold</p>
                                <p className="text-xs text-slate-500 mt-1">Documents below this confidence will require manual review.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg min-w-[40px] text-center">
                                    {settings.aiConfidenceThreshold}%
                                </span>
                                <input
                                    type="range"
                                    className="w-48 accent-indigo-600"
                                    min="0"
                                    max="100"
                                    value={settings.aiConfidenceThreshold}
                                    onChange={handleThresholdChange}
                                />
                            </div>
                        </div>
                    </div>
                </section>
                <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Security & Cloud</h4>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-emerald-200 shadow-sm text-emerald-500">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-emerald-900 text-sm">Enterprise Data Protection</p>
                                <p className="text-xs text-emerald-700 font-medium">All document processing is encrypted and local to your Drive.</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-all">
                            Status Report
                        </button>
                    </div>
                </section>
                <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Sync Management</h4>
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-amber-200 shadow-sm text-amber-500">
                                <RefreshCw className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-amber-900 text-sm">Reset Sync Cache</p>
                                <p className="text-xs text-amber-700 font-medium">Clear the list of processed emails to force a full re-sync on next run.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClearSyncCache}
                            className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-amber-700 transition-all"
                        >
                            Clear Cache
                        </button>
                    </div>
                </section>
                <section>
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-6">Danger Zone</h4>
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-red-200 shadow-sm text-red-500">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-red-900 text-sm">Reset Entire App</p>
                                <p className="text-xs text-red-700 font-medium">Delete all suppliers, settings, sync history, and local data. Cannot be undone.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleResetApp}
                            className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-red-700 transition-all"
                        >
                            Reset App
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SettingsView;
