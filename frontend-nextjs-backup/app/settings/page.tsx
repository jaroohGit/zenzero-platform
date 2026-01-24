'use client';

export default function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="m-0 text-4xl font-black tracking-tight mb-4 leading-tight">
            System <span className="text-amber-400">Control</span>
          </h2>
          <p className="m-0 text-slate-400 font-medium leading-relaxed max-w-xl">
            Configure MQTT endpoints, database sync intervals, and notification thresholds. Personalize your dashboard experience.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-amber-600">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-4">Core Settings Staged</h3>
        <p className="text-slate-400 font-medium max-w-md mx-auto">
          The configuration panel is currently locked. Contact the system administrator for root access to communication protocols.
        </p>
      </div>
    </div>
  );
}
