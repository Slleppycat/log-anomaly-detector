import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bar } from 'react-chartjs-2';
import { 
  AlertCircle, 
  X, 
  Terminal, 
  ShieldAlert, 
  Brain, 
  ExternalLink, 
  CheckCircle2, 
  Ban, 
  Download 
} from 'lucide-react';
import { ANOMALIES } from '../constants';
import { Anomaly } from '../types';
import { cn } from '../lib/utils';

const RESOLVED_KEY = 'log-sentinel:resolved-ids';
const BLOCKED_KEY = 'log-sentinel:blocked-ips';

const loadSet = (key: string): Set<string> => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
};

const AnomaliesView = () => {
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(() => loadSet(RESOLVED_KEY));
  const [blockedIps, setBlockedIps] = useState<Set<string>>(() => loadSet(BLOCKED_KEY));

  useEffect(() => {
    localStorage.setItem(RESOLVED_KEY, JSON.stringify([...resolvedIds]));
  }, [resolvedIds]);

  useEffect(() => {
    localStorage.setItem(BLOCKED_KEY, JSON.stringify([...blockedIps]));
  }, [blockedIps]);

  const visibleAnomalies = ANOMALIES.filter(a => !resolvedIds.has(a.id));

  const markResolved = (id: string) => {
    setResolvedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setSelectedAnomaly(null);
  };

  const markAllResolved = () => {
    setResolvedIds(new Set(ANOMALIES.map(a => a.id)));
    setSelectedAnomaly(null);
  };

  const blockIp = (ip: string) => {
    setBlockedIps(prev => {
      const next = new Set(prev);
      next.add(ip);
      return next;
    });
  };

  const barChartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Critical',
        data: [1, 0, 2, 5, 3, 1],
        backgroundColor: '#f87171',
        borderRadius: 4,
      },
      {
        label: 'High',
        data: [2, 1, 4, 8, 5, 2],
        backgroundColor: '#fb923c',
        borderRadius: 4,
      },
    ],
  };

  const riskScoreData = {
    labels: ['192.168.1.200', '10.0.0.15', '172.16.0.5', '203.0.113.42'],
    datasets: [
      {
        label: 'Risk Score',
        data: [85, 92, 45, 68],
        backgroundColor: (context: any) => {
          const val = context.raw;
          if (val > 80) return '#f87171';
          if (val > 60) return '#fb923c';
          return '#fbbf24';
        },
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 } },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-2xl tracking-tight">
          Anomalies Detected
          <span className="ml-3 text-sm text-white/40 font-mono">
            {visibleAnomalies.length}/{ANOMALIES.length}
          </span>
        </h2>
        <div className="flex gap-2">
          <button className="glass-pill text-[10px] font-bold uppercase tracking-widest text-white/60">Export CSV</button>
          <button
            onClick={markAllResolved}
            disabled={visibleAnomalies.length === 0}
            className="glass-pill text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Mark All Resolved
          </button>
        </div>
      </div>

      {visibleAnomalies.length === 0 && (
        <div className="glass-card p-10 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-bold uppercase tracking-widest text-white/60">All Anomalies Resolved</p>
          <p className="text-[11px] text-white/30 mt-1">Nothing to review.</p>
        </div>
      )}

      <div className="space-y-3">
        {visibleAnomalies.map((anomaly) => (
          <button
            key={anomaly.id}
            onClick={() => setSelectedAnomaly(anomaly)}
            className="w-full glass-card p-5 flex items-center gap-6 hover:bg-white/10 transition-all group text-left"
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center font-display text-2xl",
              anomaly.severity === 'Critical' ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
            )}>
              {anomaly.score}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold uppercase tracking-wide group-hover:text-accent transition-colors">{anomaly.title}</h3>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold",
                  anomaly.severity === 'Critical' ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                )}>
                  {anomaly.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-white/60 truncate">{anomaly.reason}</p>
            </div>

            <div className="flex items-center gap-6 text-[11px] font-mono text-white/30">
              <div className="flex flex-col items-end">
                <span className="text-white/50">{anomaly.sourceIp}</span>
                <span>{anomaly.user}</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <span>{anomaly.timestamp}</span>
              <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div className="glass-card p-6 h-[300px] flex flex-col">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6">Anomaly Distribution</h3>
          <div className="flex-1">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
        <div className="glass-card p-6 h-[300px] flex flex-col">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6">Source IP Risk Scores</h3>
          <div className="flex-1">
            <Bar data={riskScoreData} options={{ ...chartOptions, indexAxis: 'y' as const }} />
          </div>
        </div>
      </div>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedAnomaly && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-black/40 border-white/20"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    selectedAnomaly.severity === 'Critical' ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                  )}>
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl tracking-tight uppercase">{selectedAnomaly.title}</h2>
                    <p className="text-xs text-white/40 font-mono">ID: {selectedAnomaly.id} · {selectedAnomaly.timestamp}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAnomaly(null)}
                  className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-glass">
                <div className="grid grid-cols-3 gap-6">
                  <div className="glass-card bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Severity</p>
                    <p className={cn(
                      "text-sm font-bold",
                      selectedAnomaly.severity === 'Critical' ? "text-red-400" : "text-orange-400"
                    )}>{selectedAnomaly.severity}</p>
                  </div>
                  <div className="glass-card bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Risk Score</p>
                    <p className="text-sm font-bold font-display">+{selectedAnomaly.score}</p>
                  </div>
                  <div className="glass-card bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Source IP</p>
                    <p className="text-sm font-bold font-mono">{selectedAnomaly.sourceIp}</p>
                  </div>
                </div>

                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Terminal className="w-4 h-4 text-accent" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/60">Raw Evidence</h4>
                  </div>
                  <div className="bg-black/60 rounded-xl border border-white/10 p-4 font-mono text-xs leading-relaxed text-white/70">
                    {selectedAnomaly.rawLog}
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-4 h-4 text-purple-400" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/60">Detection Context</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-white/30 uppercase mb-2">MITRE ATT&CK Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedAnomaly.mitreTags.map(tag => (
                            <span key={tag} className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-mono">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30 uppercase mb-2">Detection Rules</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedAnomaly.detectionRules.map(rule => (
                            <span key={rule} className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60">
                              {rule}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-4 h-4 text-red-400" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/60">AI Security Briefing</h4>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-xs leading-relaxed text-red-200/70 italic">
                      {selectedAnomaly.aiBriefing}
                    </div>
                  </section>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex gap-3">
                  <button className="glass-button flex items-center gap-2 text-xs">
                    <Download className="w-4 h-4" />
                    Export Detail
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => blockIp(selectedAnomaly.sourceIp)}
                    disabled={blockedIps.has(selectedAnomaly.sourceIp)}
                    className="glass-button flex items-center gap-2 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Ban className="w-4 h-4" />
                    {blockedIps.has(selectedAnomaly.sourceIp) ? 'IP Blocked' : 'Block IP'}
                  </button>
                  <button
                    onClick={() => markResolved(selectedAnomaly.id)}
                    className="accent-button flex items-center gap-2 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Resolved
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnomaliesView;
