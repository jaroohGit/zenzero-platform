'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface PerformanceData {
  hour: string;
  at1Flow: number;
  at2Flow: number;
  at3Flow: number;
  mdb1Energy: number;
  mdb2Energy: number;
  mdb3Energy: number;
  performance: number;
  cost: number;
}

export default function PlantPerformancePage() {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({
    totalFlow: 0,
    at1: 0,
    at2: 0,
    at3: 0,
    avgFlow: 0,
    totalEnergy: 0,
    mdb1: 0,
    mdb2: 0,
    mdb3: 0,
    totalCost: 0,
    performance: 0,
    costPerM3: 0,
  });

  const ELECTRICITY_RATE = 4.30; // THB/kWh

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const minutes = Math.floor((end - start) / 60000);
      
      const response = await fetch(`http://localhost:3011/api/wwt01/history?minutes=${minutes}&limit=10000`);
      const result = await response.json();
      
      if (result.success && result.data) {
        processData(result.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (rawData: any[]) => {
    const hourlyData: { [key: string]: PerformanceData } = {};
    
    rawData.forEach((row) => {
      const hour = new Date(row.time).toISOString().split('T')[0] + ' ' + 
                   new Date(row.time).getHours().toString().padStart(2, '0') + ':00';
      
      if (!hourlyData[hour]) {
        hourlyData[hour] = {
          hour,
          at1Flow: 0,
          at2Flow: 0,
          at3Flow: 0,
          mdb1Energy: 0,
          mdb2Energy: 0,
          mdb3Energy: 0,
          performance: 0,
          cost: 0,
        };
      }
      
      hourlyData[hour].at1Flow += (row.D2000 || 0);
      hourlyData[hour].at2Flow += (row.D2010 || 0);
      hourlyData[hour].at3Flow += (row.D2020 || 0);
      hourlyData[hour].mdb1Energy += (row.D3004 || 0);
      hourlyData[hour].mdb2Energy += (row.D3014 || 0);
      hourlyData[hour].mdb3Energy += (row.D3024 || 0);
    });
    
    const processedData = Object.values(hourlyData).map((d) => {
      const totalFlow = d.at1Flow + d.at2Flow + d.at3Flow;
      const totalEnergy = d.mdb1Energy + d.mdb2Energy + d.mdb3Energy;
      return {
        ...d,
        performance: totalFlow > 0 ? totalEnergy / totalFlow : 0,
        cost: totalEnergy * ELECTRICITY_RATE,
      };
    });
    
    setData(processedData);
    
    // Calculate totals
    const totalFlow = processedData.reduce((sum, d) => sum + d.at1Flow + d.at2Flow + d.at3Flow, 0);
    const totalEnergy = processedData.reduce((sum, d) => sum + d.mdb1Energy + d.mdb2Energy + d.mdb3Energy, 0);
    const days = Math.max(1, (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000);
    
    setTotals({
      totalFlow,
      at1: processedData.reduce((sum, d) => sum + d.at1Flow, 0),
      at2: processedData.reduce((sum, d) => sum + d.at2Flow, 0),
      at3: processedData.reduce((sum, d) => sum + d.at3Flow, 0),
      avgFlow: totalFlow / days,
      totalEnergy,
      mdb1: processedData.reduce((sum, d) => sum + d.mdb1Energy, 0),
      mdb2: processedData.reduce((sum, d) => sum + d.mdb2Energy, 0),
      mdb3: processedData.reduce((sum, d) => sum + d.mdb3Energy, 0),
      totalCost: totalEnergy * ELECTRICITY_RATE,
      performance: totalFlow > 0 ? totalEnergy / totalFlow : 0,
      costPerM3: totalFlow > 0 ? (totalEnergy * ELECTRICITY_RATE) / totalFlow : 0,
    });
  };

  const performanceChartOptions: ApexOptions = {
    chart: { type: 'bar', height: 350, toolbar: { show: true } },
    plotOptions: { bar: { dataLabels: { position: 'top' } } },
    dataLabels: { enabled: true, offsetY: -20, style: { fontSize: '10px', colors: ['#0f172a'] } },
    xaxis: { categories: data.map(d => d.hour.split(' ')[1]), title: { text: 'Hour' } },
    yaxis: { title: { text: 'Performance (kWh/m³)' }, decimalsInFloat: 2 },
    colors: ['#3b82f6'],
    grid: { borderColor: '#e2e8f0' },
  };

  const costChartOptions: ApexOptions = {
    ...performanceChartOptions,
    yaxis: { title: { text: 'Cost (THB/m³)' }, decimalsInFloat: 2 },
    annotations: { yaxis: [{ y: 5.72, borderColor: '#ef4444', label: { text: 'Target: 5.72', style: { background: '#ef4444' } } }] },
    colors: ['#10b981'],
  };

  const flowChartOptions: ApexOptions = {
    chart: { type: 'bar', height: 350, stacked: true, toolbar: { show: true } },
    plotOptions: { bar: { horizontal: false } },
    xaxis: { categories: data.map(d => d.hour.split(' ')[1]) },
    yaxis: { title: { text: 'Flow (m³)' } },
    colors: ['#3b82f6', '#8b5cf6', '#10b981'],
    legend: { position: 'top' },
  };

  const energyChartOptions: ApexOptions = {
    ...flowChartOptions,
    yaxis: { title: { text: 'Energy (kWh)' } },
    colors: ['#f59e0b', '#ef4444', '#ec4899'],
  };

  const flowPieOptions: ApexOptions = {
    chart: { type: 'donut', height: 300 },
    labels: ['AT-1', 'AT-2', 'AT-3'],
    colors: ['#3b82f6', '#8b5cf6', '#10b981'],
    legend: { position: 'bottom' },
  };

  const energyPieOptions: ApexOptions = {
    ...flowPieOptions,
    labels: ['MDB-1', 'MDB-2', 'MDB-3'],
    colors: ['#f59e0b', '#ef4444', '#ec4899'],
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Analytics Header */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="m-0 text-4xl font-black tracking-tight mb-4 leading-tight">
              Resource <span className="text-blue-400">Efficiency</span> Hub
            </h2>
            <p className="m-0 text-slate-400 font-medium leading-relaxed">
              Analyze energy consumption vs. water treatment volume. Monitor THB/m³ costs and plant performance indicators across multi-day trajectories.
            </p>
          </div>
          
          <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-xl flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Start Point</label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">End Point</label>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
            <button 
              onClick={loadData}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
            >
              {loading ? 'CALCULATING...' : 'COMPUTE DATA'}
            </button>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Cumulative Output', value: totals.totalFlow.toFixed(1), unit: 'm³', color: 'blue', icon: 'M21 12h-4l-3 9L9 3l-3 9H2' },
          { label: 'Total Energy Consumed', value: totals.totalEnergy.toFixed(1), unit: 'kWh', color: 'amber', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
          { label: 'Operational Cost', value: totals.totalCost.toFixed(0), unit: 'THB', color: 'emerald', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.407 2.67 1M12 18c-1.11 0-2.08-.407-2.67-1M12 4v2m0 12v2' },
          { label: 'Performance Metric', value: totals.performance.toFixed(2), unit: 'kWh/m³', color: 'indigo', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-xl transition-all duration-500">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
              kpi.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
              kpi.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
              kpi.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
              'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
            }`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d={kpi.icon}></path>
              </svg>
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{kpi.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{kpi.value}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{kpi.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Analytical Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Performance Charts */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Energy Intensity</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Specific energy consumption (SEC)</p>
            </div>
          </div>
          <div className="h-[350px]">
             {typeof window !== 'undefined' && <Chart options={performanceChartOptions} series={[{name: 'Performance', data: data.map(d => d.performance)}]} type="bar" height="100%" />}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Cost Trajectory</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Unit treatment cost vs targets</p>
          </div>
          <div className="h-[350px]">
            {typeof window !== 'undefined' && <Chart options={costChartOptions} series={[{name: 'Cost', data: data.map(d => d.costPerM3)}]} type="bar" height="100%" />}
          </div>
        </div>

        {/* Stacked Breakdown Charts */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Output Allocation</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total flow volume by bioreactor</p>
          </div>
          <div className="h-[350px]">
            {typeof window !== 'undefined' && (
              <Chart 
                options={flowChartOptions} 
                series={[
                  {name: 'AT-1', data: data.map(d => d.at1Flow)},
                  {name: 'AT-2', data: data.map(d => d.at2Flow)},
                  {name: 'AT-3', data: data.map(d => d.at3Flow)}
                ]} 
                type="bar" 
                height="100%" />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Input Dynamics</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Energy demand by power terminal</p>
          </div>
          <div className="h-[350px]">
            {typeof window !== 'undefined' && (
              <Chart 
                options={energyChartOptions} 
                series={[
                  {name: 'MDB-1', data: data.map(d => d.mdb1Energy)},
                  {name: 'MDB-2', data: data.map(d => d.mdb2Energy)},
                  {name: 'MDB-3', data: data.map(d => d.mdb3Energy)}
                ]} 
                type="bar" 
                height="100%" />
            )}
          </div>
        </div>
      </div>

      {/* Distribution Profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-10 text-center w-full">Volume Distribution</h3>
          <div className="w-full max-w-md">
            {typeof window !== 'undefined' && <Chart options={flowPieOptions} series={[totals.at1, totals.at2, totals.at3]} type="donut" height={350} />}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-10 text-center w-full">Demand Distribution</h3>
          <div className="w-full max-w-md">
             {typeof window !== 'undefined' && <Chart options={energyPieOptions} series={[totals.mdb1, totals.mdb2, totals.mdb3]} type="donut" height={350} />}
          </div>
        </div>
      </div>
    </div>
  );
  );
}
