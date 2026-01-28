
import React from 'react';
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  Mail,
  ChevronRight,
  Building2,
  X,
  Home,
  LogOut
} from 'lucide-react';

import { STRINGS } from '../config/strings';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onSignOut?: () => void;
  isDemo?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose, onSignOut, isDemo = false }) => {
  const menuItems = [
    { id: 'dashboard', label: STRINGS.SIDEBAR.MENU.DASHBOARD, icon: LayoutDashboard },
    { id: 'suppliers', label: STRINGS.SIDEBAR.MENU.SUPPLIERS, icon: Building2 },
    // Removed Contacts/Verified Senders as requested
    { id: 'inbox', label: STRINGS.SIDEBAR.MENU.INBOX, icon: Mail },
    { id: 'reports', label: STRINGS.SIDEBAR.MENU.REPORTS, icon: BarChart3 },
    { id: 'settings', label: STRINGS.SIDEBAR.MENU.SETTINGS, icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      <div className={`
        w-64 h-full bg-white flex flex-col border-r border-slate-200
        fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 pb-8 flex items-center justify-between border-b border-slate-100">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            title="Go to Dashboard"
          >
            <img src="/logo.png" alt="Zano" className="w-10 h-10 rounded-xl shadow-md" />
            <div className="text-left">
              <h1 className="text-slate-900 font-bold text-xl tracking-tight leading-none">{STRINGS.APP.NAME}</h1>
              <p className="text-[10px] text-cyan-600 font-semibold uppercase tracking-widest mt-1">{STRINGS.APP.TAGLINE}</p>
            </div>
          </button>
          <button
            onClick={onClose}
            className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1" role="navigation" aria-label="Main navigation">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 768) onClose();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between group px-4 py-3 rounded-xl transition-all duration-200 relative ${isActive
                  ? 'bg-cyan-50 text-cyan-700'
                  : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
              >
                {isActive && <div className="active-nav-indicator" aria-hidden="true" />}
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-cyan-600' : 'text-slate-400 group-hover:text-slate-600'}`} aria-hidden="true" />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 text-cyan-500" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom Card */}
        <div className="p-4">
          <div className="bg-gradient-to-br from-cyan-50 to-slate-50 rounded-2xl p-4 border border-cyan-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border-2 border-white bg-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">G</div>
                <div className="w-6 h-6 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">D</div>
              </div>
              <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">{STRINGS.SIDEBAR.SYNC_ACTIVE}</span>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 w-full bg-cyan-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 w-3/4 rounded-full" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {STRINGS.SIDEBAR.WEEKLY_INDEX(34)}
              </p>
            </div>
          </div>

          {/* User Section */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${isDemo ? 'bg-amber-500' : 'bg-gradient-to-br from-cyan-400 to-cyan-600'}`}>
              {isDemo ? 'D' : 'Z'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{isDemo ? 'Demo User' : 'Zano Finance'}</p>
              <p className="text-[11px] text-slate-500 truncate">{isDemo ? 'Guest Mode' : STRINGS.SIDEBAR.PLAN_PRO}</p>
            </div>
            {isDemo && onSignOut && (
              <button
                onClick={onSignOut}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                title="Exit Demo"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
