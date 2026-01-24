'use client';

export default function TeamPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="m-0 text-4xl font-black tracking-tight mb-4 leading-tight">
            Our <span className="text-rose-400">Experts</span>
          </h2>
          <p className="m-0 text-slate-400 font-medium leading-relaxed max-w-xl">
            Manage personnel access, technical certifications, and shift schedules for plant engineers and operators.
          </p>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-rose-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-rose-600">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m12-10a4 4 0 11-8 0 4 4 0 018 0zm6 10v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"></path>
          </svg>
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-4">Directory Loading</h3>
        <p className="text-slate-400 font-medium max-w-md mx-auto">
          The expert directory and access control matrix is being synchronized with the central database.
        </p>
      </div>
    </div>
  );
}
