
import React from 'react';
import {
  FileText,
  Calendar,
  ChevronRight,
  Download,
  CheckCircle2,
  MailCheck,
  Search,
  Printer
} from 'lucide-react';
import { DailyReport } from '../types';
import { MOCK_REPORTS } from '../data/mockData';

interface ReportsProps {
  reports: DailyReport[];
  isDemo?: boolean;
}

const Reports: React.FC<ReportsProps> = ({ reports: propsReports, isDemo = false }) => {
  const reports = isDemo ? MOCK_REPORTS : propsReports;
  return (
    <div className="space-y-6 animate-in slide-in-from-right-2 duration-700">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Autopilot Activity</h2>
          <p className="text-slate-500 text-sm mt-1">Daily document capture logs and AI processing reports.</p>
        </div>
        <div className="relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports..."
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 w-64 card-shadow"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Log History</h3>
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-2 -mr-2">
            {reports.map((report, idx) => (
              <button
                key={report.date}
                className={`w-full flex items-center justify-between p-5 bg-white border rounded-2xl transition-all duration-300 group ${idx === 0
                    ? 'border-indigo-200 shadow-md shadow-indigo-100 ring-2 ring-indigo-50'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl transition-all ${idx === 0
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                    }`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold tracking-tight ${idx === 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                      {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{report.totalProcessed} items filed</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-all ${idx === 0 ? 'text-indigo-400 translate-x-1' : 'text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8">
          {reports.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden min-h-[600px] flex flex-col">
              <div className="p-10 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1.5">
                      <MailCheck className="w-3.5 h-3.5" />
                      Report Sent
                    </div>
                  </div>
                  <h4 className="text-3xl font-bold text-slate-900 tracking-tight">Capture Summary</h4>
                  <p className="text-slate-500 text-sm mt-1.5 font-medium flex items-center gap-2">
                    Period ending <span className="text-slate-800 font-bold">{new Date(reports[0].date).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all shadow-none hover:shadow-sm">
                    <Printer className="w-5 h-5" />
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all card-shadow">
                    <Download className="w-4 h-4" />
                    Download CSV
                  </button>
                </div>
              </div>

              <div className="p-10 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Supplier Invoices</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{reports[0].invoicesCount}</p>
                  </div>
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bank Statements</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{reports[0].statementsCount}</p>
                  </div>
                  <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">Admin Impact</p>
                    <p className="text-3xl font-bold text-indigo-600 tracking-tight">~{reports[0].totalProcessed * 5}m <span className="text-xs font-medium text-indigo-400">saved</span></p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-bold text-slate-800 tracking-tight">Verified Filings</h5>
                    <span className="text-[11px] font-bold text-slate-400">{reports[0].items.length} Documents</span>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <th className="px-6 py-4">Document Type</th>
                          <th className="px-6 py-4">Sender / Entity</th>
                          <th className="px-6 py-4">Drive Destination</th>
                          <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reports[0].items.map((item) => (
                          <tr key={item.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-5">
                              <span className="font-bold text-slate-800">{item.type.replace('_', ' ')}</span>
                            </td>
                            <td className="px-6 py-5 text-slate-600 font-medium">{item.sender}</td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2 group cursor-pointer">
                                <FileText className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400" />
                                <span className="font-mono text-[9px] text-slate-400 truncate max-w-[220px] group-hover:text-slate-600 transition-colors">{item.drivePath}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="p-10 pt-4 pb-8 text-center border-t border-slate-50">
                <p className="text-[11px] text-slate-300 font-medium">Zano Processing ID: ZPR-{Math.floor(Math.random() * 900000) + 100000}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-32 text-center card-shadow">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No reports to display</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">Initiate a sync to process incoming documents and generate your daily summary.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
