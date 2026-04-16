import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Globe, Plus, Minus, Maximize2, Flag, ShieldAlert, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';

const ThreatMapView = () => {
  const mapRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const threats = [
    { id: '1', country: 'Russia', flag: '🇷🇺', ip: '192.168.1.200', type: 'Brute Force', score: 85, coords: [37.61, 55.75] },
    { id: '2', country: 'Germany', flag: '🇩🇪', ip: '10.0.0.15', type: 'System Tamper', score: 92, coords: [8.68, 50.11] },
    { id: '3', country: 'China', flag: '🇨🇳', ip: '172.16.0.5', type: 'Unauthorized', score: 45, coords: [121.46, 31.22] },
    { id: '4', country: 'USA', flag: '🇺🇸', ip: '203.0.113.42', type: 'Exfiltration', score: 68, coords: [-74.00, 40.71] },
  ];

  useEffect(() => {
    if (!mapRef.current) return;

    const svg = d3.select(mapRef.current);
    svg.selectAll('*').remove();

    const width = mapRef.current.clientWidth;
    const height = mapRef.current.clientHeight;

    const projection = d3.geoMercator()
      .scale(150 * zoomLevel)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((data: any) => {
      const countries = topojson.feature(data, data.objects.countries);

      const g = svg.append('g');

      g.selectAll('path')
        .data((countries as any).features)
        .enter()
        .append('path')
        .attr('d', path as any)
        .attr('fill', 'rgba(167, 139, 250, 0.1)')
        .attr('stroke', 'rgba(167, 139, 250, 0.25)')
        .attr('stroke-width', 0.5);

      const dots = g.selectAll('.threat-dot')
        .data(threats)
        .enter()
        .append('g')
        .attr('class', 'threat-dot')
        .attr('transform', d => `translate(${projection(d.coords as any)})`);

      dots.append('circle')
        .attr('r', 4)
        .attr('fill', d => d.score > 80 ? '#f87171' : '#fb923c');

      dots.append('circle')
        .attr('r', 4)
        .attr('fill', 'none')
        .attr('stroke', d => d.score > 80 ? '#f87171' : '#fb923c')
        .attr('stroke-width', 1.5)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('from', '4')
        .attr('to', '15')
        .attr('dur', '2s')
        .attr('begin', '0s')
        .attr('repeatCount', 'indefinite');

      dots.append('animate')
        .attr('attributeName', 'opacity')
        .attr('from', '1')
        .attr('to', '0')
        .attr('dur', '2s')
        .attr('begin', '0s')
        .attr('repeatCount', 'indefinite');
    });
  }, [zoomLevel]);

  return (
    <div className="h-full flex gap-6">
      <div className="flex-1 glass-card relative overflow-hidden bg-black/40">
        <div className="absolute top-6 left-6 z-10">
          <div className="flex items-center gap-2 glass-pill px-4 py-2">
            <Globe className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Global Threat Map</h3>
          </div>
        </div>

        <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
          <button 
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 4))}
            className="glass-button p-2 rounded-xl"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 0.5))}
            className="glass-button p-2 rounded-xl"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button className="glass-button p-2 rounded-xl">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>

        <svg ref={mapRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      </div>

      <div className="w-80 flex flex-col gap-6">
        <div className="glass-card p-6 flex-1 overflow-y-auto scrollbar-glass bg-black/20">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Active Threat Sources
          </h3>
          
          <div className="space-y-4">
            {threats.map((threat) => (
              <div key={threat.id} className="glass-card bg-white/5 p-4 hover:bg-white/10 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{threat.flag}</span>
                    <span className="text-xs font-bold">{threat.country}</span>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold",
                    threat.score > 80 ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                  )}>
                    {threat.score} SCORE
                  </span>
                </div>
                <p className="text-[11px] font-mono text-white/60 mb-2">{threat.ip}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-white/40 uppercase font-medium">
                    {threat.type}
                  </span>
                  <MapPin className="w-3 h-3 text-white/20 group-hover:text-accent transition-colors ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 bg-accent/10 border-accent/20">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">System Status</h4>
          <p className="text-xs text-white/60 leading-relaxed mb-4">
            Global monitoring active. 4 high-risk endpoints identified in the last 24 hours.
          </p>
          <button className="accent-button w-full text-xs py-2">
            Initiate Global Block
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreatMapView;
