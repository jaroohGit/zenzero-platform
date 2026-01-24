'use client';

import { useEffect, useState } from 'react';
import mqtt from 'mqtt';

interface SensorData {
  [key: string]: number | string;
}

export default function WwtReportPage() {
  const [sensorData, setSensorData] = useState<SensorData>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const client = mqtt.connect('ws://localhost:8085');
    
    client.on('connect', () => {
      console.log('Connected to MQTT');
      client.subscribe(['zenzero/wwt01', 'zenzero/wwt02']);
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        setSensorData(prev => ({ ...prev, ...data }));
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  const formatValue = (value: any, decimals: number = 2) => {
    if (value === null || value === undefined || value === '') return '--';
    return typeof value === 'number' ? value.toFixed(decimals) : value;
  };

  const getSensorValue = (key: string, decimals: number = 2) => {
    return formatValue(sensorData[key], decimals);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="m-0 text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none mb-3">
            WWT 01 <span className="text-blue-600">Operations</span>
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 rounded-lg text-white text-[10px] font-black uppercase tracking-widest">
              Live Feed
            </div>
            <p className="m-0 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Last Pulse: {lastUpdate.toLocaleTimeString('th-TH')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {['Summary', 'Detailed', 'Historical'].map((tab) => (
            <button key={tab} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              tab === 'Detailed' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
            }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lohand AT-1 */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900 dark:text-white transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h3 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-8">Lohand No.1 (AT-1)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
            {[
              { label: 'PH Sensor 01', id: 'D1020', unit: '' },
              { label: 'PH Sensor 02', id: 'D1030', unit: '' },
              { label: 'ORP 01', id: 'D1022', unit: 'mV', color: 'text-amber-500' },
              { label: 'ORP 02', id: 'D1032', unit: 'mV', color: 'text-amber-500' },
              { label: 'Temp 01', id: 'D1024', unit: '°C', color: 'text-emerald-500' },
              { label: 'Temp 02', id: 'D1034', unit: '°C', color: 'text-emerald-500' }
            ].map((s) => (
              <div key={s.id} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-blue-500/20 transition-all duration-300">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</div>
                <div className={`text-2xl font-black tracking-tight ${s.color || 'text-slate-900 dark:text-white'}`}>
                  {getSensorValue(s.id, s.unit === 'mV' ? 0 : 2)}
                  {s.unit && <span className="ml-1 text-[10px] font-bold opacity-60 italic">{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lohand AT-2 */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900 dark:text-white transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] mb-8">Lohand No.2 (AT-2)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
            {[
              { label: 'PH Sensor 03', id: 'D1120', unit: '' },
              { label: 'PH Sensor 04', id: 'D1130', unit: '' },
              { label: 'ORP 03', id: 'D1122', unit: 'mV', color: 'text-amber-500' },
              { label: 'ORP 04', id: 'D1132', unit: 'mV', color: 'text-amber-500' },
              { label: 'Temp 03', id: 'D1124', unit: '°C', color: 'text-emerald-500' },
              { label: 'Temp 04', id: 'D1134', unit: '°C', color: 'text-emerald-500' }
            ].map((s) => (
              <div key={s.id} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-indigo-500/20 transition-all duration-300">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</div>
                <div className={`text-2xl font-black tracking-tight ${s.color || 'text-slate-900 dark:text-white'}`}>
                  {getSensorValue(s.id, s.unit === 'mV' ? 0 : 2)}
                  {s.unit && <span className="ml-1 text-[10px] font-bold opacity-60 italic">{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Flow Meters */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900 dark:text-white transition-transform duration-700 group-hover:scale-110">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <h3 className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em] mb-8 px-2">Flow Performance Hub</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {[1, 2].map((num) => (
              <div key={num} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-emerald-500/20 transition-all duration-300">
                <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span>Sensor Unit {num}</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Real-time</div>
                    <div className="text-2xl font-black text-emerald-600 tracking-tight">
                      {getSensorValue(`D${2000 + (num - 1) * 10}`)} <span className="text-[10px] opacity-60">m³/h</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Totalized</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {getSensorValue(`D${2002 + (num - 1) * 10}`, 0)} <span className="text-[10px] opacity-60">m³</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Turbo Blower Status */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]"></div>
          <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-10 relative z-10">Turbo Blower X-1</h3>
          <div className="space-y-8 relative z-10">
            {[
              { label: 'Output Power', id: 'D4000', unit: 'kW', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { label: 'Motor Current', id: 'D4002', unit: 'A', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { label: 'Air Flow Rate', id: 'D4004', unit: 'm³/min', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
            ].map((s) => (
              <div key={s.id} className="group hover:translate-x-2 transition-transform duration-300">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
                  <div className="text-xs font-black text-blue-400">{getSensorValue(s.id)} <span className="opacity-60">{s.unit}</span></div>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: '45%' }}></div>
                </div>
              </div>
            ))}
            <div className="pt-8 border-t border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Running Hours</div>
                  <div className="text-xl font-black text-white">{getSensorValue('D4006', 0)} <span className="text-[10px] opacity-60 uppercase">Hours</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
              </div>
            </div>

            {/* AT-02 */}
            <div>
              <h4 className="text-lg font-semibold mb-3" style={{color: 'var(--text-primary)'}}>AT-02</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <div className="text-xs mb-1" style={{color: 'var(--text-secondary)'}}>FAB08 Output Power</div>
                  <div className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>
                    {getSensorValue('D4010')} <span className="text-xs">kW</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <div className="text-xs mb-1" style={{color: 'var(--text-secondary)'}}>Motor Current</div>
                  <div className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>
                    {getSensorValue('D4012')} <span className="text-xs">A</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <div className="text-xs mb-1" style={{color: 'var(--text-secondary)'}}>GAB05 Flow Rate</div>
                  <div className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>
                    {getSensorValue('D4014')} <span className="text-xs">m³/min</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <div className="text-xs mb-1" style={{color: 'var(--text-secondary)'}}>Running Time</div>
                  <div className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>
                    {getSensorValue('D4016', 0)} <span className="text-xs">h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
