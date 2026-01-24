'use client';

export default function ProjectsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="m-0 text-4xl font-black tracking-tight mb-4 leading-tight">
            Strategic <span className="text-blue-400">Projects</span>
          </h2>
          <p className="m-0 text-slate-400 font-medium leading-relaxed max-w-xl">
            Track infrastructure upgrades, maintenance cycles, and system expansions. Manage timelines and resource allocation for plant optimization.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-blue-600">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-4">Under Development</h3>
        <p className="text-slate-400 font-medium max-w-md mx-auto">
          The Project Management module is being calibrated for your workflow. Check back soon for task tracking and Gantt visualizations.
        </p>
      </div>
    </div>
  );
}
