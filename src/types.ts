export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: Severity;
  sourceIp: string;
  user: string;
  action: string;
  status: string;
  message: string;
  isAnomalous: boolean;
}

export interface Anomaly {
  id: string;
  title: string;
  severity: Severity;
  score: number;
  reason: string;
  timestamp: string;
  sourceIp: string;
  user: string;
  rawLog: string;
  mitreTags: string[];
  detectionRules: string[];
  aiBriefing: string;
}

export interface AttackEvent {
  id: string;
  type: string;
  severity: Severity;
  timestamp: string;
  ip: string;
  user: string;
  mitreTag: string;
  chain?: string;
}

export interface ScanHistoryItem {
  id: string;
  filename: string;
  criticalCount: number;
  highCount: number;
  logCount: number;
  timestamp: string;
  active?: boolean;
}
