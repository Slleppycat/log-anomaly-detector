import { Bar } from 'react-chartjs-2';
import { Brain, Download, ShieldCheck, AlertTriangle, FileText, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import { ANOMALIES } from '../constants';
import { cn } from '../lib/utils';

const OVERALL_RISK_SCORE = 82;
const GENERATED_AT = 'Apr 15, 2026 · 06:10 AM';

const EXECUTIVE_BRIEFING = [
  'Analysis of the current log dataset reveals a High Risk security posture. We have identified 5 significant anomalies, including two critical system tampering events originating from 10.0.0.15.',
  'The primary attack vector appears to be a coordinated brute-force attempt targeting administrative accounts, followed by successful privilege escalation. Immediate action is recommended to rotate credentials for the root and admin users.',
  'Network monitoring shows suspicious outbound traffic of approximately 500MB to an unverified endpoint. Egress filtering should be tightened for all production subnets.',
];

const RECOMMENDED_ACTIONS = [
  'Isolate IP 10.0.0.15 immediately',
  'Rotate all SSH keys for root account',
  'Enable Multi-Factor Authentication',
  'Audit /etc/shadow file integrity',
  'Review egress firewall rules',
];

const downloadReportPdf = () => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string, size = 18) => {
    ensureSpace(size + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(17, 24, 39);
    doc.text(text, margin, y);
    y += size + 6;
  };

  const subheading = (text: string) => {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    doc.text(text.toUpperCase(), margin, y);
    y += 14;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageW - margin, y);
    y += 10;
  };

  const paragraph = (text: string, size = 10) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(55, 65, 81);
    const lines = doc.splitTextToSize(text, contentW);
    lines.forEach((line: string) => {
      ensureSpace(size + 4);
      doc.text(line, margin, y);
      y += size + 4;
    });
    y += 4;
  };

  // Header band
  doc.setFillColor(232, 68, 10);
  doc.rect(0, 0, pageW, 8, 'F');
  y = margin + 6;

  heading('Security Intelligence Report', 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated on ${GENERATED_AT}`, margin, y);
  y += 20;

  // Risk score callout
  ensureSpace(60);
  doc.setFillColor(254, 226, 226);
  doc.setDrawColor(252, 165, 165);
  doc.roundedRect(margin, y, contentW, 52, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(220, 38, 38);
  doc.text(`${OVERALL_RISK_SCORE}/100`, margin + 16, y + 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(127, 29, 29);
  doc.text('OVERALL RISK SCORE · CRITICAL THREAT LEVEL', margin + 160, y + 22);
  doc.setFontSize(9);
  doc.text(`${ANOMALIES.length} anomalies detected`, margin + 160, y + 38);
  y += 68;

  // Executive briefing
  subheading('Executive Briefing');
  EXECUTIVE_BRIEFING.forEach(p => paragraph(p));
  y += 4;

  // Anomalies
  subheading('Detailed Anomaly Breakdown');
  ANOMALIES.forEach((a, i) => {
    ensureSpace(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(`${i + 1}. ${a.title}  [${a.severity.toUpperCase()}]  Score ${a.score}/10`, margin, y);
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`${a.timestamp} · Source ${a.sourceIp} · User ${a.user} · MITRE ${a.mitreTags.join(', ')}`, margin, y);
    y += 12;

    doc.setTextColor(55, 65, 81);
    const briefingLines = doc.splitTextToSize(a.aiBriefing, contentW);
    briefingLines.forEach((line: string) => {
      ensureSpace(12);
      doc.text(line, margin, y);
      y += 12;
    });

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    const logLines = doc.splitTextToSize(a.rawLog, contentW);
    logLines.forEach((line: string) => {
      ensureSpace(10);
      doc.text(line, margin, y);
      y += 10;
    });
    y += 10;
  });

  // Recommendations
  subheading('Recommended Actions');
  RECOMMENDED_ACTIONS.forEach((action, i) => paragraph(`${i + 1}. ${action}`));

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Log Sentinel · Automated Intelligence Report`, margin, pageH - 24);
    doc.text(`Page ${p} of ${pageCount}`, pageW - margin, pageH - 24, { align: 'right' });
  }

  doc.save(`log-sentinel-report-${new Date().toISOString().slice(0, 10)}.pdf`);
};

const AIReportView = () => {
  const riskByCategoryData = {
    labels: ['Brute Force', 'System Tampering', 'Unauthorized Access', 'Data Exfiltration', 'Malware'],
    datasets: [
      {
        label: 'Risk Level',
        data: [85, 92, 65, 78, 40],
        backgroundColor: ['#fb923c', '#f87171', '#fbbf24', '#f87171', '#34d399'],
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 } },
      },
    },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
            <Brain className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-3xl tracking-tight">Security Intelligence Report</h2>
            <p className="text-sm text-white/40 font-mono">Generated on Apr 15, 2026 · 06:10 AM</p>
          </div>
        </div>
        <button onClick={downloadReportPdf} className="accent-button flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download PDF Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-card p-8 bg-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Executive Briefing
            </h3>
            <div className="text-sm leading-relaxed text-white/70 space-y-4 relative z-10">
              <p>
                Analysis of the current log dataset reveals a <span className="text-red-400 font-bold">High Risk</span> security posture. 
                We have identified 5 significant anomalies, including two critical system tampering events originating from 
                <span className="text-white font-mono px-1 bg-white/10 rounded">10.0.0.15</span>.
              </p>
              <p>
                The primary attack vector appears to be a coordinated brute-force attempt targeting administrative accounts, 
                followed by successful privilege escalation. Immediate action is recommended to rotate credentials for 
                the <span className="text-white font-mono px-1 bg-white/10 rounded">root</span> and 
                <span className="text-white font-mono px-1 bg-white/10 rounded">admin</span> users.
              </p>
              <p>
                Network monitoring shows suspicious outbound traffic of approximately 500MB to an unverified endpoint. 
                Egress filtering should be tightened for all production subnets.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Detailed Anomaly Breakdown
            </h3>
            <div className="space-y-4">
              {ANOMALIES.map((anomaly) => (
                <div key={anomaly.id} className="glass-card p-6 flex gap-6 hover:bg-white/10 transition-all">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-display text-2xl shrink-0",
                    anomaly.severity === 'Critical' ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                  )}>
                    {anomaly.score}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold uppercase tracking-wide">{anomaly.title}</h4>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-bold",
                        anomaly.severity === 'Critical' ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      )}>
                        {anomaly.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed italic">
                      {anomaly.aiBriefing.substring(0, 150)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass-card p-8 text-center">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6">Overall Risk Score</h3>
            <div className="relative inline-block mb-6">
              <span className="font-display text-8xl leading-none text-red-500">82</span>
              <span className="absolute -top-2 -right-4 text-xs font-bold text-white/20 uppercase tracking-widest">/ 100</span>
            </div>
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 mb-4">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500" 
                style={{ width: '82%' }}
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Critical Threat Level</p>
          </section>

          <section className="glass-card p-6 h-[350px] flex flex-col">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Risk by Category
            </h3>
            <div className="flex-1">
              <Bar data={riskByCategoryData} options={chartOptions} />
            </div>
          </section>

          <section className="glass-card p-6 bg-white/5 border-dashed border-white/20">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Recommended Actions
            </h4>
            <ul className="space-y-3">
              {[
                'Isolate IP 10.0.0.15 immediately',
                'Rotate all SSH keys for root account',
                'Enable Multi-Factor Authentication',
                'Audit /etc/shadow file integrity',
                'Review egress firewall rules'
              ].map((action, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-white/50">
                  <span className="text-accent font-bold">{i + 1}.</span>
                  {action}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AIReportView;
