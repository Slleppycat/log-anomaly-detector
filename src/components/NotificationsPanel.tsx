import { useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Send, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  EmailRelayConfig,
  defaultConfig,
  loadConfig,
  saveConfig,
  sendAlert,
  resetNotifiedIds,
} from '../lib/emailRelay';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'ok'; msg: string } | { kind: 'err'; msg: string };

export const NotificationsPanel = ({ open, onClose }: Props) => {
  const [cfg, setCfg] = useState<EmailRelayConfig>(defaultConfig);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    if (open) {
      setCfg(loadConfig());
      setStatus({ kind: 'idle' });
    }
  }, [open]);

  const update = <K extends keyof EmailRelayConfig>(k: K, v: EmailRelayConfig[K]) => {
    setCfg(prev => ({ ...prev, [k]: v }));
  };

  const handleSave = () => {
    saveConfig(cfg);
    setStatus({ kind: 'ok', msg: 'Settings saved.' });
  };

  const handleTest = async () => {
    saveConfig(cfg);
    setStatus({ kind: 'sending' });
    const res = await sendAlert(cfg, {
      subject: '[Log Sentinel] Test Alert',
      severity: 'CRITICAL',
      source: '10.0.0.15',
      body: 'This is a test alert from Log Sentinel. If you received this, your relay is wired correctly.',
    });
    if (res.ok) setStatus({ kind: 'ok', msg: 'Test email dispatched.' });
    else setStatus({ kind: 'err', msg: res.error ?? 'Send failed.' });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md glass-card !rounded-none !rounded-l-2xl bg-black/60 border-l border-white/15 flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-lg tracking-tight uppercase">Notifications</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Email Relay · EmailJS</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-glass p-6 space-y-6">
              <div className="text-[11px] text-white/50 leading-relaxed bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                <p>
                  Connect your <span className="text-accent font-semibold">EmailJS</span> account to relay anomaly alerts to your inbox. Grab your IDs from the EmailJS dashboard.
                </p>
                <a
                  href="https://dashboard.emailjs.com/admin"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline"
                >
                  Open EmailJS dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <Field label="Recipient Email">
                <input
                  type="email"
                  placeholder="security@yourdomain.com"
                  value={cfg.recipient}
                  onChange={(e) => update('recipient', e.target.value)}
                  className="input-glass"
                />
              </Field>

              <Field label="Service ID">
                <input
                  type="text"
                  placeholder="service_xxxxxxx"
                  value={cfg.serviceId}
                  onChange={(e) => update('serviceId', e.target.value)}
                  className="input-glass font-mono"
                />
              </Field>

              <Field label="Template ID">
                <input
                  type="text"
                  placeholder="template_xxxxxxx"
                  value={cfg.templateId}
                  onChange={(e) => update('templateId', e.target.value)}
                  className="input-glass font-mono"
                />
              </Field>

              <Field label="Public Key">
                <input
                  type="text"
                  placeholder="user_xxxxxxxxxxxxxxxx"
                  value={cfg.publicKey}
                  onChange={(e) => update('publicKey', e.target.value)}
                  className="input-glass font-mono"
                />
              </Field>

              <label className="flex items-center justify-between glass-card bg-white/5 px-4 py-3 cursor-pointer">
                <div>
                  <p className="text-xs font-semibold">Auto-notify on Critical</p>
                  <p className="text-[10px] text-white/40">Send email the moment a critical anomaly fires</p>
                </div>
                <input
                  type="checkbox"
                  checked={cfg.autoNotifyCritical}
                  onChange={(e) => update('autoNotifyCritical', e.target.checked)}
                  className="w-4 h-4 accent-accent"
                />
              </label>

              <div className="text-[10px] text-white/30 leading-relaxed space-y-2">
                <p>
                  Your EmailJS template should accept variables: <span className="font-mono text-white/50">to_email, subject, severity, source, body</span>.
                </p>
                <p>
                  In the EmailJS dashboard under <span className="text-white/50">Account → Security</span>, either disable <span className="text-white/50">"Allow API calls only from non-browser"</span> or add your app origin to the allowlist — otherwise the relay will 403 from the browser.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    resetNotifiedIds();
                    setStatus({ kind: 'ok', msg: 'Dedupe history cleared — next analyze will re-notify.' });
                  }}
                  className="text-accent hover:underline"
                >
                  Reset notified-anomaly history
                </button>
              </div>

              {status.kind !== 'idle' && (
                <div
                  className={cn(
                    'rounded-xl px-4 py-3 text-xs flex items-start gap-2 border',
                    status.kind === 'ok' && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
                    status.kind === 'err' && 'bg-red-500/10 border-red-500/30 text-red-300',
                    status.kind === 'sending' && 'bg-white/5 border-white/10 text-white/60'
                  )}
                >
                  {status.kind === 'ok' && <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
                  {status.kind === 'err' && <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                  {status.kind === 'sending' && (
                    <div className="w-4 h-4 mt-0.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  )}
                  <span className="break-words">{'msg' in status ? status.msg : 'Sending…'}</span>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex items-center gap-3">
              <button onClick={handleSave} className="glass-button flex-1 text-xs">
                Save
              </button>
              <button
                onClick={handleTest}
                disabled={status.kind === 'sending'}
                className="accent-button flex-1 text-xs flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                Send Test
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</label>
    {children}
  </div>
);
