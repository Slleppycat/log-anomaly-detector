import { Line } from 'react-chartjs-2';
import { ATTACK_TIMELINE, ANOMALIES } from '../constants';
import { cn } from '../lib/utils';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const DashboardView = () => {
  const mapRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const svg = d3.select(mapRef.current);
    const width = 400;
    const height = 250;

    const projection = d3.geoMercator()
      .scale(60)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((data: any) => {
      const countries = topojson.feature(data, data.objects.countries);

      svg.selectAll('path')
        .data((countries as any).features)
        .enter()
        .append('path')
        .attr('d', path as any)
        .attr('fill', 'rgba(167, 139, 250, 0.15)')
        .attr('stroke', 'rgba(167, 139, 250, 0.3)')
        .attr('stroke-width', 0.5);

      const threatPoints = [
        { name: 'Moscow', coords: [37.61, 55.75] },
        { name: 'Frankfurt', coords: [8.68, 50.11] },
        { name: 'Shanghai', coords: [121.46, 31.22] },
      ];

      const dots = svg.selectAll('.threat-dot')
        .data(threatPoints)
        .enter()
        .append('g')
        .attr('class', 'threat-dot')
        .attr('transform', d => `translate(${projection(d.coords as any)})`);

      dots.append('circle')
        .attr('r', 3)
        .attr('fill', '#f87171');

      dots.append('circle')
        .attr('r', 3)
        .attr('fill', 'none')
        .attr('stroke', '#f87171')
        .attr('stroke-width', 1)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('from', '3')
        .attr('to', '10')
        .attr('dur', '1.5s')
        .attr('begin', '0s')
        .attr('repeatCount', 'indefinite');

      dots.append('animate')
        .attr('attributeName', 'opacity')
        .attr('from', '1')
        .attr('to', '0')
        .attr('dur', '1.5s')
        .attr('begin', '0s')
        .attr('repeatCount', 'indefinite');
    });
  }, []);

  const chartData = {
    labels: ['05:31 AM', '', '', '', '', '', '05:32 AM'],
    datasets: [
      {
        label: 'Events',
        data: [8, 8.5, 9, 9.5, 10, 10.5, 11],
        borderColor: '#2dd4bf',
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Anomalies',
        data: [8, null, null, null, null, null, 11],
        borderColor: '#f87171',
        backgroundColor: '#f87171',
        pointRadius: 6,
        pointBackgroundColor: '#f87171',
        showLine: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 } },
      },
      y: {
        min: 0,
        max: 12,
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 }, stepSize: 3 },
      },
    },
  };

  return (
    <div className="space-y-5">
      {/* Top Stats Bar */}
      <div className="glass-card px-6 py-4 flex items-center justify-between gap-8">
        <div className="flex flex-col">
          <h2 className="font-display text-[32px] leading-none text-white">82</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Logs Parsed</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-[11px] font-semibold text-red-400">2 Critical</div>
          <div className="px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-[11px] font-semibold text-orange-400">4 High</div>
          <div className="px-2.5 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-[11px] font-semibold text-yellow-400">0 Medium</div>
          <div className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">0 Low</div>
        </div>

        <div className="flex-1 max-w-md flex items-center gap-3">
          <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden relative">
            <div 
              className="absolute left-0 h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500" 
              style={{ width: '73%' }}
            />
          </div>
          <span className="font-display text-lg text-white">73%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Event Timeline */}
        <div className="glass-card flex flex-col h-[240px]">
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/9">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40">Event Timeline</h3>
            <div className="glass-pill px-3 py-0.5 text-[10px]">Live</div>
          </div>
          
          <div className="flex-1 min-h-0">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="flex items-center justify-around mt-6 pt-6 border-t border-white/5">
            <div className="text-center">
              <p className="font-display text-xl">82</p>
              <p className="text-[9px] uppercase tracking-widest text-white/30">Logs Parsed</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-red-400">3</p>
              <p className="text-[9px] uppercase tracking-widest text-white/30">Anomalies</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-emerald-400">96.3%</p>
              <p className="text-[9px] uppercase tracking-widest text-white/30">Clean Rate</p>
            </div>
          </div>
        </div>

        {/* Threat Origin Map */}
        <div className="glass-card flex flex-col h-[240px] bg-black/40">
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/9">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40">Threat Origin Map</h3>
            <span className="text-[9px] font-mono text-white/30 uppercase">2 IPs mapped</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full h-full bg-purple-500/5 rounded-lg overflow-hidden">
              <svg ref={mapRef} width="400" height="250" viewBox="0 0 400 250" className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attack Timeline */}
        <div className="glass-card flex flex-col h-[240px]">
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/9">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40">Attack Timeline</h3>
            <div className="glass-pill px-3 py-0.5 text-[10px]">6 events</div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-glass px-5 py-2">
            {ATTACK_TIMELINE.map((event) => (
              <div key={event.id} className={cn(
                "py-3 border-b border-white/9 last:border-none flex flex-col gap-1",
                event.severity === 'Critical' ? "border-l-2 border-l-red-500 pl-3" : "border-l-2 border-l-orange-500 pl-3"
              )}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wide font-display">{event.type}</h4>
                  <span className="text-[10px] font-mono text-white/30">{event.timestamp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40">IP: {event.ip} · USER: {event.user}</span>
                  <span className="text-[9px] font-mono text-emerald-400">{event.mitreTag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detected Threats */}
        <div className="glass-card flex flex-col h-[240px]">
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/9">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40">Detected Threats</h3>
            <div className="glass-pill px-3 py-0.5 text-[10px]">6 found</div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-glass px-5 py-2">
            {ANOMALIES.map((threat) => (
              <div key={threat.id} className="py-3 border-b border-white/9 last:border-none">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wide font-display">{threat.title}</h4>
                  <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px] font-bold border border-red-500/20">CRITICAL</span>
                </div>
                <div className="bg-red-500/10 border-l-2 border-red-500 rounded-r p-2 mb-2">
                  <p className="text-[10px] font-mono text-red-400">{threat.reason}</p>
                </div>
                <p className="text-[9px] font-mono text-white/30 truncate">Log: {threat.rawLog}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
