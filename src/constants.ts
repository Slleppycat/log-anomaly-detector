import { Anomaly, AttackEvent, LogEntry, ScanHistoryItem } from './types';

export const SCAN_HISTORY: ScanHistoryItem[] = [
  { id: '1', filename: 'ssh_logs.txt', criticalCount: 10, highCount: 0, logCount: 1000, timestamp: '10:18 PM', active: false },
  { id: '2', filename: 'high_threat_logs.txt', criticalCount: 2, highCount: 4, logCount: 82, timestamp: '10:02 PM', active: true },
  { id: '3', filename: 'mixed_ssh_logs_1000.txt', criticalCount: 10, highCount: 0, logCount: 1000, timestamp: '09:28 PM', active: false },
];

export const ATTACK_TIMELINE: AttackEvent[] = [
  { id: '1', type: 'BRUTE FORCE', severity: 'High', timestamp: '05:31:34 AM', ip: '192.168.1.200', user: 'root', mitreTag: 'T1110 · Credential Access', chain: 'BRUTE FORCE' },
  { id: '2', type: 'SYSTEM TAMPERING', severity: 'Critical', timestamp: '05:31:38 AM', ip: '10.0.0.15', user: 'admin', mitreTag: 'T1059 · Command and Scripting Interpreter' },
  { id: '3', type: 'UNAUTHORIZED ACCESS', severity: 'High', timestamp: '05:31:42 AM', ip: '172.16.0.5', user: 'guest', mitreTag: 'T1078 · Valid Accounts' },
  { id: '4', type: 'DATA EXFILTRATION', severity: 'Critical', timestamp: '05:31:45 AM', ip: '192.168.1.200', user: 'root', mitreTag: 'T1041 · Exfiltration Over C2 Channel' },
  { id: '5', type: 'BRUTE FORCE', severity: 'High', timestamp: '05:31:50 AM', ip: '192.168.1.200', user: 'root', mitreTag: 'T1110 · Credential Access' },
  { id: '6', type: 'PRIVILEGE ESCALATION', severity: 'Critical', timestamp: '05:31:55 AM', ip: '10.0.0.15', user: 'admin', mitreTag: 'T1068 · Exploitation for Privilege Escalation' },
];

export const ANOMALIES: Anomaly[] = [
  {
    id: '1',
    title: 'SYSTEM TAMPERING',
    severity: 'Critical',
    score: 9,
    reason: 'Network interface placed in promiscuous mode (Sniffing)',
    timestamp: 'Apr 12 00:02:20',
    sourceIp: '10.0.0.15',
    user: 'admin',
    rawLog: 'Apr 12 00:02:20 prod-web-02 kernel: device eth0 entered promiscuous mode',
    mitreTags: ['T1059', 'T1068'],
    detectionRules: ['Kernel Event', 'Network Sniffing'],
    aiBriefing: 'The system detected an unauthorized attempt to place the network interface into promiscuous mode. This is a strong indicator of network sniffing or packet capture activity, often associated with reconnaissance or data exfiltration.'
  },
  {
    id: '2',
    title: 'BRUTE FORCE ATTACK',
    severity: 'High',
    score: 7,
    reason: 'Multiple failed login attempts from foreign IP range',
    timestamp: 'Apr 12 05:31:34',
    sourceIp: '192.168.1.200',
    user: 'root',
    rawLog: 'Apr 12 05:31:34 auth-srv sshd[1234]: Failed password for root from 192.168.1.200 port 54321 ssh2',
    mitreTags: ['T1110'],
    detectionRules: ['Failed Login Threshold', 'Foreign IP Range'],
    aiBriefing: 'A high volume of failed SSH login attempts was detected from an external IP address. The pattern suggests an automated brute-force attack targeting the root account.'
  },
  {
    id: '3',
    title: 'UNAUTHORIZED FILE ACCESS',
    severity: 'High',
    score: 6,
    reason: 'Access to sensitive system configuration files',
    timestamp: 'Apr 12 05:31:42',
    sourceIp: '172.16.0.5',
    user: 'guest',
    rawLog: 'Apr 12 05:31:42 file-srv auditd: type=PATH msg=audit(1618212702.123:456): item=0 name="/etc/shadow" inode=123 dev=08:01 mode=0100400 ouid=0 ogid=0 rdev=00:00 nametype=NORMAL',
    mitreTags: ['T1078'],
    detectionRules: ['Sensitive File Access', 'Guest Account Activity'],
    aiBriefing: 'A guest account attempted to access the /etc/shadow file, which contains encrypted user passwords. This is a critical security violation.'
  },
  {
    id: '4',
    title: 'SUSPICIOUS OUTBOUND TRAFFIC',
    severity: 'Medium',
    score: 4,
    reason: 'Large data transfer to unknown external endpoint',
    timestamp: 'Apr 12 05:31:45',
    sourceIp: '192.168.1.200',
    user: 'root',
    rawLog: 'Apr 12 05:31:45 net-mon: flow=OUT src=10.0.0.15 dst=203.0.113.42 bytes=500MB proto=TCP port=443',
    mitreTags: ['T1041'],
    detectionRules: ['Data Exfiltration', 'Unknown Endpoint'],
    aiBriefing: 'A significant amount of data was transferred from a production server to an unknown external IP address over an encrypted channel.'
  },
  {
    id: '5',
    title: 'PRIVILEGE ESCALATION',
    severity: 'Critical',
    score: 8,
    reason: 'Sudo execution of restricted binary',
    timestamp: 'Apr 12 05:31:55',
    sourceIp: '10.0.0.15',
    user: 'admin',
    rawLog: 'Apr 12 05:31:55 prod-web-02 sudo: admin : TTY=pts/0 ; PWD=/home/admin ; USER=root ; COMMAND=/usr/bin/nmap',
    mitreTags: ['T1068'],
    detectionRules: ['Restricted Sudo Command', 'Privilege Escalation'],
    aiBriefing: 'A user with administrative privileges executed a restricted network scanning tool using sudo. This could indicate an attempt to map the internal network for further exploitation.'
  }
];

export const LOGS: LogEntry[] = Array.from({ length: 14 }).map((_, i) => ({
  id: `${i}`,
  timestamp: `05:31:${(30 + i).toString().padStart(2, '0')} AM`,
  level: i % 5 === 0 ? 'Critical' : i % 3 === 0 ? 'High' : 'Low',
  sourceIp: i % 2 === 0 ? '192.168.1.200' : '10.0.0.15',
  user: i % 2 === 0 ? 'root' : 'admin',
  action: i % 3 === 0 ? 'LOGIN_FAIL' : 'FILE_READ',
  status: i % 3 === 0 ? 'DENIED' : 'SUCCESS',
  message: `Sample log message ${i} for testing purposes.`,
  isAnomalous: i % 4 === 0,
}));
