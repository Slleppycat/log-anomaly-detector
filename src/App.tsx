/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationsPanel } from './components/NotificationsPanel';
import {
  Search,
  Bell,
  Home,
  AlertTriangle,
  FileText,
  Map as MapIcon,
  BarChart3,
  Upload as UploadIcon,
  Shield,
  X as XIcon,
} from 'lucide-react';
import { ParticleCanvas } from './components/ParticleCanvas';
import { cn } from './lib/utils';
import { SCAN_HISTORY, ANOMALIES } from './constants';

// Views
import DashboardView from './views/DashboardView';
import AnomaliesView from './views/AnomaliesView';
import LogExplorerView from './views/LogExplorerView';
import ThreatMapView from './views/ThreatMapView';
import AIReportView from './views/AIReportView';
import UploadView from './views/UploadView';

type ViewType = 'Home' | 'Anomalies' | 'Log Explorer' | 'Threat Map' | 'Report' | 'Upload';

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('Home');
  const [activeScanId, setActiveScanId] = useState('2');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      const raw = localStorage.getItem('log-sentinel:scan-history');
      if (raw) return JSON.parse(raw);
    } catch {}
    return SCAN_HISTORY;
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('log-sentinel:scan-history', JSON.stringify(scanHistory));
  }, [scanHistory]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as typeof ANOMALIES;
    return ANOMALIES.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.sourceIp.toLowerCase().includes(q) ||
      a.user.toLowerCase().includes(q) ||
      a.reason.toLowerCase().includes(q) ||
      a.severity.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const tabs: { label: ViewType; icon: any }[] = [
    { label: 'Home', icon: Home },
    { label: 'Anomalies', icon: AlertTriangle },
    { label: 'Log Explorer', icon: FileText },
    { label: 'Threat Map', icon: MapIcon },
    { label: 'Report', icon: BarChart3 },
    { label: 'Upload', icon: UploadIcon },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
      <ParticleCanvas />

      {/* Topbar */}
      <header className="relative z-20 h-[60px] flex items-center justify-between px-5 border-b border-white/9 backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-accent flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-display text-base font-extrabold tracking-tight leading-none uppercase">Log Sentinel</h1>
            <p className="text-[9px] uppercase tracking-widest text-white/40 mt-0.5">AI Anomaly Detection</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 glass-card p-1 rounded-full bg-white/6 border-white/9">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveView(tab.label)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-normal transition-all duration-300",
                activeView === tab.label 
                  ? "bg-accent text-white shadow-[0_4px_14px_rgba(232,68,10,0.35)]" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="glass-pill px-3 py-1 flex items-center gap-2 text-emerald-400 border-emerald-400/20">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-[11px] font-mono">Scanning</span>
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className="glass-pill p-1.5 text-white/60 hover:text-white transition-colors"
              aria-label="Open search"
              title="Search anomalies (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setNotificationsOpen(true)}
              className="glass-pill p-1.5 text-white/60 hover:text-white transition-colors relative"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
          </div>
          
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
            <img src="https://picsum.photos/seed/user/100/100" alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="relative z-10 w-[210px] border-r border-white/9 flex flex-col bg-black/10 backdrop-blur-sm">
          <div className="p-5 flex-1 overflow-y-auto scrollbar-glass">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">History</span>
              <button
                onClick={() => setScanHistory([])}
                disabled={scanHistory.length === 0}
                className="glass-pill px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>

            {scanHistory.length === 0 && (
              <p className="text-[10px] text-white/30 italic px-2 py-4">No scans yet. Upload a log file to start.</p>
            )}

            <div className="space-y-2">
              {scanHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveScanId(item.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all duration-300 group",
                    activeScanId === item.id 
                      ? "glass-card bg-white/6 border-white/15" 
                      : "hover:bg-white/5"
                  )}
                >
                  <p className="text-xs font-medium truncate mb-1.5">{item.filename}</p>
                  
                  <div className="flex flex-wrap gap-1 font-mono text-[9px]">
                    {item.criticalCount > 0 && (
                      <span className="text-red-400 font-bold">CRIT</span>
                    )}
                    {item.highCount > 0 && (
                      <span className="text-orange-400 font-bold">HIGH</span>
                    )}
                    <span className="text-white/30">· {item.logCount.toLocaleString()} logs</span>
                    <span className="text-white/30">· {item.timestamp}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 border-t border-white/9 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="https://picsum.photos/seed/user/100/100" alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <p className="text-xs font-semibold">Alex Rivera</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">SecOps Lead</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full overflow-y-auto scrollbar-glass p-8"
            >
              {activeView === 'Home' && <DashboardView />}
              {activeView === 'Anomalies' && <AnomaliesView />}
              {activeView === 'Log Explorer' && <LogExplorerView />}
              {activeView === 'Threat Map' && <ThreatMapView />}
              {activeView === 'Report' && <AIReportView />}
              {activeView === 'Upload' && <UploadView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl glass-card bg-black/70 border border-white/15 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <Search className="w-4 h-4 text-white/40" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search anomalies by title, IP, user, reason, severity…"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white"
                  aria-label="Close"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-glass">
                {searchQuery.trim() === '' ? (
                  <p className="p-6 text-[11px] text-white/30 text-center">Start typing to filter anomalies.</p>
                ) : searchResults.length === 0 ? (
                  <p className="p-6 text-[11px] text-white/30 text-center">No anomalies match "{searchQuery}".</p>
                ) : (
                  searchResults.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSearchOpen(false);
                        setActiveView('Anomalies');
                      }}
                      className="w-full text-left px-5 py-3 border-b border-white/5 hover:bg-white/5 flex items-center gap-4"
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center font-display text-sm shrink-0",
                        a.severity === 'Critical' ? "bg-red-500/20 text-red-400"
                          : a.severity === 'High' ? "bg-orange-500/20 text-orange-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {a.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide truncate">{a.title}</p>
                        <p className="text-[10px] text-white/40 font-mono truncate">{a.sourceIp} · {a.user} · {a.reason}</p>
                      </div>
                      <span className="text-[9px] font-bold text-white/30 uppercase">{a.severity}</span>
                    </button>
                  ))
                )}
              </div>
              <div className="px-5 py-2 border-t border-white/10 text-[9px] font-mono text-white/30 flex justify-between">
                <span>↵ open · esc close</span>
                <span>{searchResults.length} result{searchResults.length === 1 ? '' : 's'}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
