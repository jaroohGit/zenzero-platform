'use client';

import { useEffect, useState } from 'react';

interface HistoricalData {
  time: string;
  [key: string]: any;
}

export default function DataHistoryPage() {
  const [data, setData] = useState<HistoricalData[]>([]);
  const [timeRange, setTimeRange] = useState(60);
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, timeRange: '', lastUpdate: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3011/api/wwt01/history?minutes=${timeRange}&limit=${limit}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
        setStats({
          total: result.data.length,
          timeRange: `${timeRange} minutes`,
          lastUpdate: new Date().toLocaleString('th-TH'),
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportCSV = () => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wwt01_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'number') return value.toFixed(2);
    return value;
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleString('th-TH');
  };

  return (
    <div className="max-w-full mx-auto space-y-8 pb-12">
      {/* Configuration Header */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="m-0 text-4xl font-black tracking-tight mb-4 leading-tight">
              Data <span className="text-emerald-400">Archives</span>
            </h2>
            <p className="m-0 text-slate-400 font-medium leading-relaxed">
              Query and export high-resolution historical sensor data. Adjust time intervals and record limits for deep-dive analysis.
            </p>
          </div>
          
          <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-xl flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Select Window</label>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none min-w-[140px]">
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={180}>3 hours</option>
                <option value={360}>6 hours</option>
                <option value={720}>12 hours</option>
                <option value={1440}>24 hours</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Buffer Depth</label>
              <select 
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none min-w-[100px]">
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1,000</option>
                <option value={5000}>5,000</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={loadData}
                disabled={loading}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
              >
                {loading ? 'SYNCING...' : 'RUN QUERY'}
              </button>
              
              <button 
                onClick={exportCSV}
                disabled={data.length === 0}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-white/5"
                title="Export CSV"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v4m4-10l4 4m0 0l4-4m-4 4V3"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Retrieved Records', value: stats.total.toLocaleString(), detail: 'Data points in buffer', color: 'emerald' },
          { label: 'Temporal Coverage', value: stats.timeRange, detail: 'Current selection window', color: 'blue' },
          { label: 'Last Sync', value: stats.lastUpdate.split(',')[1] || '--', detail: stats.lastUpdate.split(',')[0] || 'Waiting for query', color: 'indigo' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{stat.label}</div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{stat.value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.detail}</div>
          </div>
        ))}
      </div>

      {/* Main Data Warehouse Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse" style={{ minWidth: '2200px' }}>
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-700 px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-r border-slate-200 dark:border-slate-600">
                  UTC Time (Local)
                </th>
                
                {/* Section Headers */}
                {[
                  { label: 'AT-1 MONITORING', cols: 12, color: 'blue' },
                  { label: 'AT-2 MONITORING', cols: 12, color: 'indigo' },
                  { label: 'AT-3 MONITORING', cols: 12, color: 'emerald' },
                  { label: 'HYDRAULIC FLOW', cols: 6, color: 'amber' },
                  { label: 'ELECTRICAL POWER', cols: 9, color: 'rose' }
                ].map((sec, i) => (
                  <th key={i} colSpan={sec.cols} className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.25em] border-b border-r border-slate-200 dark:border-slate-700">
                    <span className={`
                      ${sec.color === 'blue' ? 'text-blue-500' : 
                        sec.color === 'indigo' ? 'text-indigo-500' :
                        sec.color === 'emerald' ? 'text-emerald-500' :
                        sec.color === 'amber' ? 'text-amber-500' : 'text-rose-500'}
                    `}>
                      {sec.label}
                    </span>
                  </th>
                ))}
              </tr>
              <tr className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <th className="sticky left-0 z-20 bg-white dark:bg-slate-900 px-6 py-2 border-r border-slate-200 dark:border-slate-800"></th>
                {/* Column IDs */}
                {Array.from({ length: 51 }).map((_, i) => (
                  <th key={i} className="px-4 py-2 text-[9px] font-bold text-slate-400 text-center border-r border-slate-100 dark:border-slate-800/50">
                    {['PH', 'ORP', 'TEMP', 'PH', 'ORP', 'TEMP', 'PH', 'ORP', 'TEMP', 'PH', 'ORP', 'TEMP', 'PH', 'ORP', 'TEMP', 'PH', 'ORP', 'TEMP', 'PH', 'ORP', 'TEMP', 'PH', 'ORP', 'TEMP', 'PH', 'ORP', 'TEMP', 'PH', 'ORP', 'TEMP', 'PH', 'ORP', 'TEMP', 'PH', 'ORP', 'TEMP', 'RT', 'FWD', 'RT', 'FWD', 'RT', 'FWD', 'CURR', 'PWR', 'KWH', 'CURR', 'PWR', 'KWH', 'CURR', 'PWR', 'KWH'][i]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 px-6 py-3 text-[11px] font-mono font-bold text-slate-500 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    {formatTime(row.time)}
                  </td>
                  {/* AT-1 */}
                  {[row.D1020, row.D1022, row.D1024, row.D1030, row.D1032, row.D1034, row.D1020, row.D1022, row.D1024, row.D1030, row.D1032, row.D1034].map((v, i) => (
                    <td key={`at1-${i}`} className="px-4 py-3 text-center text-xs font-medium text-slate-900 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/50">{formatValue(v)}</td>
                  ))}
                  {/* AT-2 */}
                  {[row.D1120, row.D1122, row.D1124, row.D1130, row.D1132, row.D1134, row.D1120, row.D1122, row.D1124, row.D1130, row.D1132, row.D1134].map((v, i) => (
                    <td key={`at2-${i}`} className="px-4 py-3 text-center text-xs font-medium text-slate-900 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/50">{formatValue(v)}</td>
                  ))}
                  {/* AT-3 */}
                  {[row.D1220, row.D1222, row.D1224, row.D1230, row.D1232, row.D1234, row.D1220, row.D1222, row.D1224, row.D1230, row.D1232, row.D1234].map((v, i) => (
                    <td key={`at3-${i}`} className="px-4 py-3 text-center text-xs font-medium text-slate-900 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/50">{formatValue(v)}</td>
                  ))}
                  {/* Flow */}
                  {[row.D2000, row.D2002, row.D2010, row.D2012, row.D2020, row.D2022].map((v, i) => (
                    <td key={`flow-${i}`} className="px-4 py-3 text-center text-xs font-bold text-amber-600 dark:text-amber-400 border-r border-slate-100 dark:border-slate-800/50">{formatValue(v)}</td>
                  ))}
                  {/* Power */}
                  {[row.D3000, row.D3002, row.D3004, row.D3010, row.D3012, row.D3014, row.D3020, row.D3022, row.D3024].map((v, i) => (
                    <td key={`pwr-${i}`} className="px-4 py-3 text-center text-xs font-bold text-rose-600 dark:text-rose-400 border-r border-slate-100 dark:border-slate-800/50">{formatValue(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {data.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 opacity-20">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <p className="text-sm font-black uppercase tracking-widest opacity-50">Operational Warehouse Empty</p>
            <p className="text-[10px] font-bold mt-2 uppercase tracking-widest opacity-30">Execute a query to retrieve historical records</p>
          </div>
        )}
      </div>
    </div>
  );
  );
}
