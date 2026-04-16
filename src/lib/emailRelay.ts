import type { Anomaly } from '../types';

export interface EmailRelayConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  recipient: string;
  autoNotifyCritical: boolean;
}

const STORAGE_KEY = 'log-sentinel:email-relay';
const NOTIFIED_KEY = 'log-sentinel:email-relay:notified';
const LAST_SENT_KEY = 'log-sentinel:email-relay:last-sent';
const RATE_LIMIT_MS = 30_000;

export const defaultConfig: EmailRelayConfig = {
  serviceId: 'service_jc94ijy',
  templateId: 'template_ij8kwzo',
  publicKey: 'qtkTP5U9xtqG-dbUB',
  recipient: '',
  autoNotifyCritical: true,
};

export const loadConfig = (): EmailRelayConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig;
    return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {
    return defaultConfig;
  }
};

export const saveConfig = (cfg: EmailRelayConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
};

export interface AlertPayload {
  subject: string;
  severity: string;
  source: string;
  body: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#ca8a04',
  LOW: '#2563eb',
};

const colorFor = (severity: string): string =>
  SEVERITY_COLORS[severity.toUpperCase()] ?? '#6b7280';

/**
 * Sends via EmailJS REST API. The template should accept the variables:
 * to_email, subject, severity, severity_color, source, body.
 */
export const sendAlert = async (
  cfg: EmailRelayConfig,
  payload: AlertPayload
): Promise<SendResult> => {
  if (!cfg.serviceId || !cfg.templateId || !cfg.publicKey || !cfg.recipient) {
    return { ok: false, error: 'Email relay is not fully configured.' };
  }

  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: cfg.serviceId,
        template_id: cfg.templateId,
        user_id: cfg.publicKey,
        template_params: {
          to_email: cfg.recipient,
          subject: payload.subject,
          severity: payload.severity,
          severity_color: colorFor(payload.severity),
          source: payload.source,
          body: payload.body,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `EmailJS ${res.status}: ${text || res.statusText}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Network error' };
  }
};

const loadNotifiedIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveNotifiedIds = (ids: Set<string>) => {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...ids]));
};

export const resetNotifiedIds = () => {
  localStorage.removeItem(NOTIFIED_KEY);
  localStorage.removeItem(LAST_SENT_KEY);
};

export interface RelayResult {
  ok: boolean;
  sent: number;
  skipped: number;
  error?: string;
}

export const relayCriticalBatch = async (
  cfg: EmailRelayConfig,
  anomalies: Anomaly[]
): Promise<RelayResult> => {
  if (!cfg.autoNotifyCritical) return { ok: true, sent: 0, skipped: 0 };

  const critical = anomalies.filter(a => a.severity === 'Critical');
  if (critical.length === 0) return { ok: true, sent: 0, skipped: 0 };

  const notified = loadNotifiedIds();
  const fresh = critical.filter(a => !notified.has(a.id));
  const skipped = critical.length - fresh.length;
  if (fresh.length === 0) return { ok: true, sent: 0, skipped };

  const lastSent = Number(localStorage.getItem(LAST_SENT_KEY) ?? 0);
  if (Date.now() - lastSent < RATE_LIMIT_MS) {
    return { ok: false, sent: 0, skipped, error: 'Rate limited — wait 30s between auto-notifies.' };
  }

  const body = fresh
    .map(
      (a, i) =>
        `${i + 1}. [${a.severity.toUpperCase()}] ${a.title}\n` +
        `   Score: ${a.score}/10  ·  ${a.timestamp}\n` +
        `   Source: ${a.sourceIp}  ·  User: ${a.user}\n` +
        `   Reason: ${a.reason}\n` +
        `   MITRE: ${a.mitreTags.join(', ')}\n` +
        `   Log: ${a.rawLog}`
    )
    .join('\n\n');

  const result = await sendAlert(cfg, {
    subject: `[Log Sentinel] ${fresh.length} Critical Anomal${fresh.length === 1 ? 'y' : 'ies'} Detected`,
    severity: 'CRITICAL',
    source: [...new Set(fresh.map(a => a.sourceIp))].join(', '),
    body,
  });

  if (!result.ok) return { ok: false, sent: 0, skipped, error: result.error };

  fresh.forEach(a => notified.add(a.id));
  saveNotifiedIds(notified);
  localStorage.setItem(LAST_SENT_KEY, String(Date.now()));

  return { ok: true, sent: fresh.length, skipped };
};
