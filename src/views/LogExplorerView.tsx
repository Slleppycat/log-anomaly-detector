import { useState } from 'react';
import { Flag, Filter, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { LOGS } from '../constants';
import { Severity } from '../types';
import { cn } from '../lib/utils';

const LogExplorerView = () => {
  const [filter, setFilter] = useState<Severity | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = LOGS.filter(log => {
    const matchesFilter = filter === 'All' || log.level === filter;
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.sourceIp.includes(searchQuery) ||
                          log.user.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-tight">Log Explorer</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-pill pl-10 pr-4 py-2 text-xs w-64 focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 glass-pill px-3 py-1">
            <Filter className="w-3.5 h-3.5 text-white/40" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-bg-dark">All Levels</option>
              <option value="Critical" className="bg-bg-dark">Critical</option>
              <option value="High" className="bg-bg-dark">High</option>
              <option value="Medium" className="bg-bg-dark">Medium</option>
              <option value="Low" className="bg-bg-dark">Low</option>
            </select>
          </div>
          <button className="glass-button flex items-center gap-2 text-xs">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 glass-card overflow-hidden flex flex-col bg-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Level</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Source IP</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">User</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 text-center">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id} 
                  className={cn(
                    "hover:bg-white/5 transition-colors group relative",
                    log.isAnomalous && "bg-red-500/5"
                  )}
                >
                  {log.isAnomalous && (
                    <td className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                  )}
                  <td className="px-6 py-4 text-[11px] font-mono text-white/40">{log.timestamp}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold",
                      log.level === 'Critical' ? "bg-red-500/20 text-red-400" :
                      log.level === 'High' ? "bg-orange-500/20 text-orange-400" :
                      log.level === 'Medium' ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-emerald-500/20 text-emerald-400"
                    )}>
                      {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-mono text-white/60">{log.sourceIp}</td>
                  <td className="px-6 py-4 text-xs font-medium">{log.user}</td>
                  <td className="px-6 py-4 text-[10px] font-bold tracking-wider text-white/50">{log.action}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold",
                      log.status === 'SUCCESS' ? "text-emerald-400" : "text-red-400"
                    )}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {log.isAnomalous && (
                      <Flag className="w-4 h-4 text-red-500 mx-auto" fill="currentColor" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-auto p-4 border-t border-white/10 flex items-center justify-between bg-white/5">
          <p className="text-[10px] text-white/30 uppercase tracking-widest">
            Showing {filteredLogs.length} of {LOGS.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 disabled:opacity-20" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              <button className="w-6 h-6 rounded bg-accent text-[10px] font-bold">1</button>
              <button className="w-6 h-6 rounded hover:bg-white/10 text-[10px] font-bold text-white/40">2</button>
              <button className="w-6 h-6 rounded hover:bg-white/10 text-[10px] font-bold text-white/40">3</button>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogExplorerView;
