'use client';

export default function TasksPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="m-0 text-4xl font-black tracking-tight mb-4 leading-tight">
            Operational <span className="text-emerald-400">Tasks</span>
          </h2>
          <p className="m-0 text-slate-400 font-medium leading-relaxed max-w-xl">
            Monitor maintenance schedules, filter replacement alerts, and daily operational checklists for the technical team.
          </p>
        </div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-emerald-600">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-4">Task Engine Offline</h3>
        <p className="text-slate-400 font-medium max-w-md mx-auto">
          The automated task assignment system is currently in staging. Real-time maintenance alerts will be available in the next update.
        </p>
      </div>
    </div>
  );
}
