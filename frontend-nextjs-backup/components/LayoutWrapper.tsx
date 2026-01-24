'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import mqtt from 'mqtt';
import ChatButton from '@/components/ChatButton';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', href: '/' },
  { id: 'wwt-report', label: 'Report WWT 01', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', href: '/wwt-report' },
  { id: 'orp-analysis', label: 'ORP Analysis', icon: 'M21.21 15.89A10 10 0 1 1 8 2.83', href: '/orp-analysis' },
  { id: 'data-history', label: 'Data History', icon: 'M3 3h18v18H3z', href: '/data-history' },
  { id: 'plant-performance', label: 'Plant Performance', icon: 'M22 12l-4 0-3 9-6-18-3 9-4 0', href: '/plant-performance' },
  { id: 'projects', label: 'Projects', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', href: '/projects' },
  { id: 'tasks', label: 'Tasks', icon: 'M3 3h18v18H3z', href: '/tasks' },
  { id: 'team', label: 'Team', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', href: '/team' },
  { id: 'settings', label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', href: '/settings' },
];

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [mqttStatus, setMqttStatus] = useState('Connecting...');
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    // MQTT Connection for global status
    const client = mqtt.connect('ws://localhost:8085', {
      reconnectPeriod: 5000,
    });

    client.on('connect', () => {
      setMqttStatus('Connected');
      client.subscribe(['zenzero/wwt01', 'zenzero/wwt02']);
    });

    client.on('error', () => {
      setMqttStatus('Error');
    });

    client.on('close', () => {
      setMqttStatus('Disconnected');
    });

    return () => {
      client.end();
    };
  }, []);

  return (
    <>
      {/* Header */}
      <header 
        className="fixed top-0 right-0 h-16 backdrop-blur-md border-b z-50 flex items-center justify-between px-6 transition-all duration-300"
        style={{
          left: sidebarOpen ? '260px' : '80px',
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--border-color)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5 border-none cursor-pointer bg-transparent"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="hidden md:block">
            <h2 className="text-sm font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
              Monitoring System <span className="text-blue-500 font-bold">WWT01</span>
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-10 h-10 flex items-center justify-center rounded-xl border-none cursor-pointer bg-transparent transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {isDark ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-300"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: mqttStatus === 'Connected' ? '#10b981' : '#ef4444',
              borderColor: 'var(--border-color)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <span className={`w-2 h-2 rounded-full animate-pulse ${mqttStatus === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            <span>{mqttStatus}</span>
          </div>

          <button className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5 border-none cursor-pointer bg-transparent"
            style={{ color: 'var(--text-primary)' }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              TJ
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold leading-none">Teddy J.</div>
              <div className="text-[10px] font-medium leading-none mt-1 opacity-60">ADMINISTRATOR</div>
            </div>
          </button>
        </div>
      </header>

      <div className="flex min-h-screen" style={{ background: 'var(--bg-secondary)' }}>
        {/* Sidebar */}
        <aside 
          className={`fixed left-0 top-0 bottom-0 backdrop-blur-xl border-r overflow-y-auto transition-all duration-500 z-[60] ${sidebarOpen ? 'w-[260px]' : 'w-20'}`}
          style={{
            backgroundColor: 'var(--sidebar-bg)',
            borderColor: 'var(--border-color)',
            boxShadow: '4px 0 15px rgba(0,0,0,0.05)'
          }}
        >
          <div className="h-16 px-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
              </div>
              {sidebarOpen && (
                <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ZENZERO
                </span>
              )}
            </div>
          </div>
          
          <div className="p-4 space-y-6">
            <div>
              {sidebarOpen && <div className="px-4 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Main Menu</div>}
              <nav className="space-y-1">
                {navItems.slice(0, 5).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3.5 no-underline transition-all duration-300 cursor-pointer rounded-xl font-semibold text-sm group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
                          : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500 transition-colors'}`}>
                        <path d={item.icon}></path>
                      </svg>
                      {sidebarOpen && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              {sidebarOpen && <div className="px-4 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">System</div>}
              <nav className="space-y-1">
                {navItems.slice(5).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3.5 no-underline transition-all duration-300 cursor-pointer rounded-xl font-semibold text-sm group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
                          : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500 transition-colors'}`}>
                        <path d={item.icon}></path>
                      </svg>
                      {sidebarOpen && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {sidebarOpen && (
            <div className="absolute bottom-10 left-4 right-4 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl overflow-hidden">
              <div className="relative z-10">
                <div className="text-xs font-bold opacity-80 uppercase mb-1">Status</div>
                <div className="text-lg font-black leading-tight mb-2">Systems Active</div>
                <div className="w-full bg-white/20 h-1.5 rounded-full mb-3">
                  <div className="bg-white h-full rounded-full w-[85%]"></div>
                </div>
                <button className="w-full py-2 bg-white text-blue-700 text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-blue-50 transition-colors">
                  View Logs
                </button>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main 
          className="flex-1 p-8 mt-16 transition-all duration-500"
          style={{ marginLeft: sidebarOpen ? '260px' : '80px' }}
        >
          {children}
        </main>
      </div>

      <ChatButton />
    </>
  );
}
