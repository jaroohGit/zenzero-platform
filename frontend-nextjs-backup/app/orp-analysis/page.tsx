'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface SensorReading {
  time: string;
  ph1: number;
  ph2: number;
  orp1: number;
  orp2: number;
}

export default function OrpAnalysisPage() {
  const [lohand, setLohand] = useState('AT-1');
  const [timeRange, setTimeRange] = useState(30);
  const [data, setData] = useState<SensorReading[]>([]);
  const [phRate, setPhRate] = useState(0);
  const [processPhase, setProcessPhase] = useState('Initializing...');
  const [blowerRec, setBlowerRec] = useState('Analyzing...');
  const [currentValues, setCurrentValues] = useState({ ph1: 0, ph2: 0, orpIn: 0, orpOut: 0 });
  const phHistory = useRef<number[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [lohand, timeRange]);

  const loadData = async () => {
    try {
      const response = await fetch(`http://localhost:3011/api/wwt01/history?minutes=${timeRange}&limit=1000`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const lohandMap: { [key: string]: { ph1: string, ph2: string, orp1: string, orp2: string } } = {
          'AT-1': { ph1: 'D1020', ph2: 'D1030', orp1: 'D1022', orp2: 'D1032' },
          'AT-2': { ph1: 'D1120', ph2: 'D1130', orp1: 'D1122', orp2: 'D1132' },
          'AT-3': { ph1: 'D1220', ph2: 'D1230', orp1: 'D1222', orp2: 'D1232' },
        };
        
        const keys = lohandMap[lohand];
        const readings: SensorReading[] = result.data.map((d: any) => ({
          time: new Date(d.time).toLocaleTimeString('th-TH'),
          ph1: d[keys.ph1] || 0,
          ph2: d[keys.ph2] || 0,
          orp1: d[keys.orp1] || 0,
          orp2: d[keys.orp2] || 0,
        }));
        
        setData(readings);
        
        if (readings.length > 0) {
          const latest = readings[readings.length - 1];
          setCurrentValues({
            ph1: latest.ph1,
            ph2: latest.ph2,
            orpIn: latest.orp1,
            orpOut: latest.orp2,
          });
          
          // Calculate pH rate
          phHistory.current.push((latest.ph1 + latest.ph2) / 2);
          if (phHistory.current.length > 10) phHistory.current.shift();
          
          if (phHistory.current.length >= 2) {
            const rate = (phHistory.current[phHistory.current.length - 1] - phHistory.current[0]) / phHistory.current.length;
            setPhRate(rate);
            
            // Process phase detection
            const orp = latest.orp2;
            const absRate = Math.abs(rate);
            
            if (orp > 150 && absRate < 0.01) {
              setProcessPhase('Nitrification End');
              setBlowerRec('🛑 Stop Blower - Nitrification Complete');
            } else if (orp < -50 && absRate < 0.01) {
              setProcessPhase('Denitrification End');
              setBlowerRec('▶️ Start Blower - Begin Nitrification');
            } else if (orp > 100) {
              setProcessPhase('Nitrification Active');
              setBlowerRec('✅ Continue Aeration');
            } else if (orp < 0) {
              setProcessPhase('Denitrification Active');
              setBlowerRec('⏸️ Maintain Anoxic Conditions');
            } else {
              setProcessPhase('Transition Phase');
              setBlowerRec('⏳ Monitor and Wait');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const combinedChartOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 400,
      animations: { enabled: true },
      toolbar: { show: true },
      background: 'transparent',
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'],
    xaxis: {
      categories: data.map(d => d.time),
      labels: { rotate: -45 },
    },
    yaxis: [
      {
        title: { text: 'pH Level' },
        min: 6,
        max: 9,
        decimalsInFloat: 2,
      },
      {
        opposite: true,
        title: { text: 'ORP (mV)' },
        decimalsInFloat: 0,
      },
    ],
    legend: {
      position: 'top',
      horizontalAlign: 'center',
    },
    grid: {
      borderColor: '#e2e8f0',
    },
  };

  const combinedChartSeries = [
    { name: 'pH-01', type: 'line', data: data.map(d => d.ph1), yAxisIndex: 0 },
    { name: 'pH-02', type: 'line', data: data.map(d => d.ph2), yAxisIndex: 0 },
    { name: 'ORP-01', type: 'line', data: data.map(d => d.orp1), yAxisIndex: 1 },
    { name: 'ORP-02', type: 'line', data: data.map(d => d.orp2), yAxisIndex: 1 },
  ];

  const phRateChartOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 300,
      animations: { enabled: true },
      toolbar: { show: true },
      background: 'transparent',
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    colors: ['#ef4444'],
    xaxis: {
      categories: data.slice(-10).map(d => d.time),
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: 'ΔpH/Δt' },
      decimalsInFloat: 4,
    },
    annotations: {
      yaxis: [{
        y: 0,
        borderColor: '#64748b',
        label: {
          text: 'ΔpH/Δt = 0',
          style: { background: '#64748b' },
        },
      }],
    },
    grid: {
      borderColor: '#e2e8f0',
    },
  };

  const phRateData = data.slice(-10).map((_, i) => {
    if (i === 0) return 0;
    const avgCurrent = (data[data.length - 10 + i].ph1 + data[data.length - 10 + i].ph2) / 2;
    const avgPrev = (data[data.length - 11 + i].ph1 + data[data.length - 11 + i].ph2) / 2;
    return avgCurrent - avgPrev;
  });

  const phRateChartSeries = [{ name: 'pH Rate', data: phRateData }];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Analytics Hero */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="m-0 text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
              Advanced <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">ORP & pH</span> Analytics
            </h2>
            <p className="m-0 text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Real-time biological process monitoring. Detect Nitrification and Denitrification phases automatically using ΔpH/Δt rate of change algorithms.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 min-w-[240px]">
            <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex gap-1">
              {['AT-1', 'AT-2', 'AT-3'].map(l => (
                <button
                  key={l}
                  onClick={() => setLohand(l)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    lohand === l ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={15}>15 Min</option>
                <option value={30}>30 Min</option>
                <option value={60}>60 Min</option>
                <option value={120}>120 Min</option>
              </select>
              <button 
                onClick={loadData}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-600/20"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      </div>

      {/* Main Indicators Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommendation Engine */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <div className="space-y-6">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Process Intelligence</div>
                <div className="text-3xl font-black text-white tracking-tight leading-none">{processPhase}</div>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 group-hover:bg-white/10 transition-colors">
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Recommendation</div>
                <div className="text-sm font-bold leading-relaxed">{blowerRec}</div>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${processPhase.includes('End') ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}></div>
                  SYSTEM STATUS: ACTIVE
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px]"></div>
        </div>

        {/* Real-time Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'pH Inlet (1)', value: currentValues.ph1.toFixed(2), unit: '', color: 'text-blue-500' },
            { label: 'pH Outlet (2)', value: currentValues.ph2.toFixed(2), unit: '', color: 'text-indigo-500' },
            { label: 'ORP Inlet', value: currentValues.orpIn.toFixed(0), unit: 'mV', color: 'text-amber-500' },
            { label: 'ORP Outlet', value: currentValues.orpOut.toFixed(0), unit: 'mV', color: 'text-emerald-500' }
          ].map((c, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-500 group">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 group-hover:text-blue-500 transition-colors">
                {c.label}
              </div>
              <div>
                <div className={`text-4xl font-black tracking-tighter ${c.color}`}>
                  {c.value}
                </div>
                {c.unit && <div className="text-[10px] font-bold text-slate-400 mt-1">{c.unit}</div>}
              </div>
            </div>
          ))}
          
          <div className="col-span-2 md:col-span-4 bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between overflow-hidden relative">
            <div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">pH Kinetic Rate (ΔpH/Δt)</div>
              <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                {phRate > 0 ? '+' : ''}{phRate.toFixed(4)}
              </div>
            </div>
            <div className="h-16 w-32 bg-blue-500/5 rounded-2xl flex items-center justify-center border border-blue-500/10">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={phRate > 0 ? 'text-blue-500' : 'text-amber-500 hover:rotate-180 transition-transform duration-1000'}>
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Kinetic Observation</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Dual-Axis process trajectory analyzer</p>
            </div>
          </div>
          <div className="h-[450px]">
            {typeof window !== 'undefined' && data.length > 0 ? (
              <Chart options={combinedChartOptions} series={combinedChartSeries} type="line" height="100%" />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Aggregating Process Data...</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="mb-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">Rate of Change</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ΔpH Differentiation Profile</p>
            </div>
            <div className="h-[300px]">
              {typeof window !== 'undefined' && data.length > 0 && (
                <Chart options={phRateChartOptions} series={phRateChartSeries} type="line" height="100%" />
              )}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden flex flex-col justify-center">
            <h3 className="text-xl font-black uppercase tracking-widest mb-6 leading-tight">Algorithm Guidelines</h3>
            <div className="space-y-6 relative z-10">
              {[
                { title: 'Nitrification End', rule: 'ORP > 150 mV && ΔpH/Δt ≈ 0', label: 'Stop Blower', color: 'bg-emerald-400' },
                { title: 'Denitrification End', rule: 'ORP < -50 mV && ΔpH/Δt ≈ 0', label: 'Start Blower', color: 'bg-amber-400' },
                { title: 'Optimal Aeration', rule: '100 mV < ORP < 150 mV', label: 'Maintain Power', color: 'bg-blue-400' }
              ].map((g, i) => (
                <div key={i} className="flex items-start gap-4 group">
                   <div className={`mt-1.5 w-2 h-2 rounded-full ${g.color} shadow-[0_0_15px_rgba(255,255,255,0.5)] group-hover:scale-150 transition-transform`}></div>
                   <div>
                    <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">{g.title}</div>
                    <div className="text-sm font-bold">{g.rule}</div>
                    <div className="text-[10px] font-black text-white mt-1 uppercase tracking-tighter opacity-80">Action: {g.label}</div>
                   </div>
                </div>
              ))}
            </div>
            <div className="absolute right-0 bottom-0 p-8 opacity-20">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  );
}
