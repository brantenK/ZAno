
import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  FileCheck,
  ExternalLink,
  FolderOpen,
  Zap,
  CheckCircle2,
  Timer
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DocumentRecord, DocType } from '../types';
import SyncFilterModal from './SyncFilterModal';
import { STRINGS } from '../config/strings';
import { API_CONFIG, UI_CONFIG } from '../config/constants';
import { MOCK_DOCUMENTS } from '../data/mockData';

interface DashboardProps {
  recentDocs: DocumentRecord[];
  onSync: (dateRange?: { start: Date; end: Date }) => void;
  isSyncing: boolean;
  isDemo?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ recentDocs: propsDocs, onSync, isSyncing, isDemo = false }) => {
  // Use mock data in demo mode, otherwise use real data
  const recentDocs = isDemo ? MOCK_DOCUMENTS : propsDocs;

  const [showSyncModal, setShowSyncModal] = useState(false);
  // Compute chart data from actual documents processed in last 7 days
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toDateString(),
        name: days[date.getDay()],
        count: 0
      };
    });

    recentDocs.forEach(doc => {
      const docDate = new Date(doc.processedAt).toDateString();
      const dayEntry = last7Days.find(d => d.date === docDate);
      if (dayEntry) {
        dayEntry.count++;
      }
    });

    return last7Days.map(({ name, count }) => ({ name, count }));
  }, [recentDocs]);

  const stats = useMemo(() => ({
    totalDocs: recentDocs.length,
    invoices: recentDocs.filter(d => d.type === DocType.INVOICE).length,
    statements: recentDocs.filter(d => d.type === DocType.BANK_STATEMENT).length,
  }), [recentDocs]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{STRINGS.DASHBOARD.TITLE}</h2>
          <p className="text-slate-500 text-sm mt-1">{STRINGS.DASHBOARD.SUBTITLE}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSyncModal(true)}
            disabled={isSyncing || isDemo}
            title={isDemo ? "Syncing is disabled in Demo Mode" : "Run Autopilot Sync"}
            aria-label={isSyncing ? STRINGS.DASHBOARD.SYNC_BUTTON.PROCESSING : STRINGS.DASHBOARD.SYNC_BUTTON.IDLE}
            aria-busy={isSyncing}
            className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all overflow-hidden ${isSyncing
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 active:scale-95 shadow-lg shadow-cyan-500/30'
              }`}
          >
            {isSyncing ? (
              <div className="w-4 h-4 border-2 border-cyan-600/30 border-t-cyan-600 rounded-full animate-spin" aria-hidden="true" />
            ) : (
              <Zap className="w-4 h-4 fill-white" aria-hidden="true" />
            )}
            {isSyncing ? STRINGS.DASHBOARD.SYNC_BUTTON.PROCESSING : STRINGS.DASHBOARD.SYNC_BUTTON.IDLE}
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{STRINGS.DASHBOARD.CHARTS.VOLUME_TITLE}</h3>
              <p className="text-xs text-slate-400 mt-1">{STRINGS.DASHBOARD.CHARTS.VOLUME_SUBTITLE}</p>
            </div>
            <select className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-300 transition-all">
              <option>{STRINGS.DASHBOARD.CHARTS.PERIOD_7_DAYS}</option>
              <option>{STRINGS.DASHBOARD.CHARTS.PERIOD_30_DAYS}</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Recent Stream */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">{STRINGS.DASHBOARD.RECENT_STREAM.TITLE}</h3>
            <button className="text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline transition-all">{STRINGS.DASHBOARD.RECENT_STREAM.AUDIT_LOG}</button>
          </div>
          <div className="space-y-1 flex-1 overflow-auto max-h-[280px] -mx-2 px-2 pr-1">
            {recentDocs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <FolderOpen className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-400">{STRINGS.DASHBOARD.RECENT_STREAM.EMPTY_STATE}</p>
              </div>
            ) : (
              recentDocs.map((doc) => (
                <div key={doc.id} className="group flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                  <div className={`mt-1 p-2.5 rounded-xl shadow-sm ${doc.type === DocType.INVOICE ? 'bg-cyan-50 text-cyan-600' :
                    doc.type === DocType.BANK_STATEMENT ? 'bg-emerald-50 text-emerald-600' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{doc.sender}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{doc.type.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(doc.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all" aria-label={`Open ${doc.sender} document in Drive`}>
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))
            )}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{STRINGS.DASHBOARD.RECENT_STREAM.DRIVE_USAGE}</span>
                <span className="text-slate-900">1.2 GB / 15 GB</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 w-[8%] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <SyncFilterModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onConfirm={(start, end) => {
          setShowSyncModal(false);
          onSync({ start, end });
        }}
        isSyncing={isSyncing}
      />
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  accentColor: 'cyan' | 'emerald';
}

const StatCard = ({ label, value, change, positive, icon, accentColor }: StatCardProps) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex justify-between items-start mb-5">
      <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 ${accentColor === 'cyan' ? 'bg-cyan-50' : 'bg-emerald-50'
        }`}>{icon}</div>
      <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
        }`}>
        {positive && <TrendingUp className="w-3 h-3" />}
        {change}
      </div>
    </div>
    <div>
      <h4 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{value}</h4>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mt-3">{label}</p>
    </div>
  </div>
);

export default Dashboard;
