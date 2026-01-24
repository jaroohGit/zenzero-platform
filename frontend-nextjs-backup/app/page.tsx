'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import mqtt from 'mqtt';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface SensorData {
  timestamp: string;
  pH?: number;
  temperature?: number;
  tds?: number;
  turbidity?: number;
  orp?: number;
  tss?: number;
  bod?: number;
  cod?: number;
  do?: number;
  flow?: number;
}

export default function Dashboard() {
  const [phData, setPhData] = useState<number[]>([]);
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [latestData, setLatestData] = useState<SensorData>({
    timestamp: new Date().toISOString(),
  });
  const MAX_DATA_POINTS = 300;

  useEffect(() => {
    // MQTT Connection for dashboard page
    const client = mqtt.connect('ws://localhost:8085', {
      reconnectPeriod: 5000,
    });

    client.on('connect', () => {
      client.subscribe(['zenzero/wwt01', 'zenzero/wwt02'], (err) => {
        if (err) {
          console.error('Subscribe error:', err);
        }
      });
    });

    client.on('message', (topic, message) => {
      try {
        const data: SensorData = JSON.parse(message.toString());
        
        setLatestData(prev => ({
          ...prev,
          ...data,
          timestamp: new Date().toISOString(),
        }));

        if (data.pH !== undefined) {
          setPhData(prev => {
            const newData = [...prev, data.pH!];
            return newData.slice(-MAX_DATA_POINTS);
          });

          setTimestamps(prev => {
            const newTimestamps = [...prev, new Date().toLocaleTimeString()];
            return newTimestamps.slice(-MAX_DATA_POINTS);
          });
        }
      } catch (error) {
        console.error('Parse error:', error);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  const chartOptions = {
    chart: {
      id: 'ph-chart',
      type: 'line' as const,
      animations: {
        enabled: true,
        easing: 'linear' as const,
        dynamicAnimation: {
          speed: 1000
        }
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      background: 'transparent',
      foreColor: isDark ? '#94a3b8' : '#64748b'
    },
    stroke: {
      curve: 'smooth' as const,
      width: 2
    },
    xaxis: {
      categories: timestamps,
      labels: {
        show: false
      }
    },
    yaxis: {
      min: 0,
      max: 14,
      title: {
        text: 'pH Level',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a'
        }
      },
      labels: {
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    },
    theme: {
      mode: isDark ? 'dark' as const : 'light' as const
    },
    colors: ['#3b82f6'],
    grid: {
      borderColor: isDark ? '#334155' : '#e2e8f0'
    }
  };

  const chartSeries = [{
    name: 'pH',
    data: phData
  }];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="m-0 mb-2 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            System Dashboard
          </h2>
          <p className="m-0 text-slate-500 dark:text-slate-400 font-medium max-w-lg">
            Monitor wastewater treatment system in real-time. Tracking all sensors and performance metrics across the plant.
          </p>
          <div className="flex gap-3 mt-6">
            <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold uppercase tracking-wider">
              Plant Operational
            </div>
            <div className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-wider">
              {timestamps.length > 0 ? 'Live Monitoring' : 'Connecting...'}
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'pH Level', value: latestData.pH?.toFixed(2) || '--', unit: '', color: 'blue', icon: 'M12 2L2 7l10 5 10-5-10-5z' },
          { label: 'Temperature', value: latestData.temperature?.toFixed(1) || '--', unit: '°C', color: 'orange', icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'TDS Level', value: latestData.tds?.toFixed(0) || '--', unit: 'ppm', color: 'emerald', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
          { label: 'Turbidity', value: latestData.turbidity?.toFixed(0) || '--', unit: 'NTU', color: 'indigo', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
        ].map((card, i) => (
          <div key={i} className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 hover:-translate-y-1">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${
              card.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
              card.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' :
              card.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
              'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
            }`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={card.icon}></path>
              </svg>
            </div>
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{card.label}</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none">
                {card.value}
              </span>
              <span className="text-sm font-bold text-slate-400">{card.unit}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="text-[10px] font-black text-emerald-500 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M12 19V5M5 12l7-7 7 7"></path>
                </svg>
                ACTIVE
              </div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Real-time Data</div>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 rounded-b-3xl transition-all duration-500 w-0 group-hover:w-full ${
              card.color === 'blue' ? 'bg-blue-500' :
              card.color === 'orange' ? 'bg-orange-500' :
              card.color === 'emerald' ? 'bg-emerald-500' :
              'bg-indigo-500'
            }`}></div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">pH Sensor Trend</h3>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Real-time Monitoring - AT-01</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Live</span>
              </div>
            </div>
            
            <div className="h-[400px] relative z-10">
              {phData.length > 0 ? (
                <Chart
                  options={chartOptions}
                  series={chartSeries}
                  type="line"
                  height="100%"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-4"></div>
                  <p className="text-sm font-bold uppercase tracking-widest">Initializing Data Stream...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-black leading-tight mb-2">System Status</h3>
              <p className="text-white/60 text-sm font-medium mb-6 leading-relaxed">
                All systems operating within normal parameters. Next scheduled maintenance in 12 days.
              </p>
              <div className="space-y-4">
                {[
                  { name: 'MQTT Broker', status: 'Online', color: 'bg-emerald-400' },
                  { name: 'Database API', status: 'Online', color: 'bg-emerald-400' },
                  { name: 'Python Service', status: 'Idle', color: 'bg-amber-400' }
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                    <span className="text-xs font-bold tracking-tight">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase">{s.status}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${s.color}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 px-2">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-600 hover:text-white transition-all duration-300 group shadow-sm border border-transparent hover:shadow-xl hover:shadow-blue-600/20">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center group-hover:bg-white/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
                  </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Export CSV</span>
              </button>
              <button className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-600 hover:text-white transition-all duration-300 group shadow-sm border border-transparent hover:shadow-xl hover:shadow-indigo-600/20">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center group-hover:bg-white/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1v22M5 12h14"></path>
                  </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Add Note</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  );
}
