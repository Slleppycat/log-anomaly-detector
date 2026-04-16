import { useRef, useState } from 'react';
import { Upload, FileText, Settings, Sliders, Play, Info, CheckCircle2, X, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import { loadConfig, relayCriticalBatch } from '../lib/emailRelay';
import { ANOMALIES } from '../constants';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  lines: number;
  preview: string;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const ACCEPTED = '.log,.txt,.csv,.json,image/*';

const UploadView = () => {
  const [bruteForceThreshold, setBruteForceThreshold] = useState(5);
  const [isolationForestSensitivity, setIsolationForestSensitivity] = useState(0.85);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [relayStatus, setRelayStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const samples = [
    { name: 'ssh_logs_2024.log', size: '1.2 MB', lines: '12,450', type: 'AUTH' },
    { name: 'web_access_prod.log', size: '4.5 MB', lines: '45,200', type: 'HTTP' },
    { name: 'syslog_critical.log', size: '0.8 MB', lines: '8,120', type: 'SYS' },
    { name: 'db_audit_trail.log', size: '2.1 MB', lines: '21,000', type: 'SQL' },
  ];

  const ingestFiles = async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    const parsed: UploadedFile[] = [];

    for (const file of arr) {
      let preview = '';
      let lines = 0;

      if (file.type.startsWith('image/')) {
        preview = `[image] ${file.type}`;
        lines = 0;
      } else {
        const text = await file.text();
        lines = text.split(/\r?\n/).filter(Boolean).length;
        preview = text.slice(0, 240);
      }

      parsed.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: formatBytes(file.size),
        lines,
        preview,
      });
    }

    setFiles(prev => [...parsed, ...prev]);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setRelayStatus(null);
    setTimeout(async () => {
      setIsAnalyzing(false);
      const cfg = loadConfig();
      if (!cfg.autoNotifyCritical) return;
      const res = await relayCriticalBatch(cfg, ANOMALIES);
      if (res.ok) {
        if (res.sent > 0) {
          setRelayStatus(`Relayed ${res.sent} critical alert${res.sent === 1 ? '' : 's'} to ${cfg.recipient}.`);
        } else if (res.skipped > 0) {
          setRelayStatus(`No new criticals — ${res.skipped} already notified.`);
        }
      } else {
        setRelayStatus(`Relay failed: ${res.error ?? 'unknown error'}`);
      }
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl tracking-tight">Data Ingestion</h2>
          <p className="text-sm text-white/40">Upload system logs for AI-powered anomaly detection</p>
        </div>
        <div className="flex items-center gap-2 glass-pill px-4 py-2">
          <Info className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-widest">.log .txt .csv .json image/*</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.length) ingestFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "glass-card border-2 border-dashed transition-all group cursor-pointer h-64 flex flex-col items-center justify-center gap-4",
              isDragging
                ? "border-accent bg-accent/10 scale-[1.01]"
                : "border-white/10 hover:border-accent/50 hover:bg-accent/5"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) ingestFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-accent" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-wide">Drop files here</p>
              <p className="text-xs text-white/30 mt-1">or click to browse — logs, text, csv, images</p>
            </div>
          </div>

          {files.length > 0 && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Uploaded ({files.length})
              </h3>
              <div className="space-y-3">
                {files.map((f) => (
                  <div key={f.id} className="glass-card p-4 flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-bold truncate">{f.name}</p>
                        <button
                          onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}
                          className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white"
                          aria-label="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-white/30 font-mono mb-2">
                        {f.size} {f.lines > 0 && `· ${f.lines.toLocaleString()} lines`}
                      </p>
                      {f.preview && !f.preview.startsWith('[image]') && (
                        <pre className="text-[10px] font-mono text-white/40 bg-black/40 border border-white/5 rounded p-2 overflow-hidden whitespace-pre-wrap line-clamp-3">
                          {f.preview}
                        </pre>
                      )}
                      {f.preview.startsWith('[image]') && (
                        <p className="text-[10px] font-mono text-purple-300/60">{f.preview}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Sample Datasets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {samples.map((sample) => (
                <div key={sample.name} className="glass-card p-4 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-accent transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{sample.name}</p>
                    <p className="text-[10px] text-white/30 font-mono">{sample.size} · {sample.lines} lines</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/40">
                    {sample.type}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass-card p-6 space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" />
              Detection Settings
            </h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/60">Brute-force Threshold</label>
                  <span className="text-[10px] font-mono text-accent">{bruteForceThreshold} attempts</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={bruteForceThreshold}
                  onChange={(e) => setBruteForceThreshold(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/60">Isolation Forest Sensitivity</label>
                  <span className="text-[10px] font-mono text-accent">{isolationForestSensitivity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isolationForestSensitivity}
                  onChange={(e) => setIsolationForestSensitivity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
                />
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-[10px] text-white/30">
                <Sliders className="w-3 h-3" />
                <span>Algorithm: Isolation Forest + RNN</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>GPU Acceleration Enabled</span>
              </div>
            </div>
          </section>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || files.length === 0}
            className={cn(
              "accent-button w-full py-4 flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest transition-all",
              (isAnalyzing || files.length === 0) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                {files.length === 0 ? 'Upload to Analyze' : `Analyze ${files.length} file${files.length > 1 ? 's' : ''}`}
              </>
            )}
          </button>

          {relayStatus && (
            <div className="glass-card px-4 py-3 flex items-start gap-2 text-[11px] text-white/70 border-white/10">
              <Mail className="w-3.5 h-3.5 mt-0.5 text-accent shrink-0" />
              <span className="break-words">{relayStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadView;
