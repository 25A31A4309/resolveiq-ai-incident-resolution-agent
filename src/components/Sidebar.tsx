import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Bot,
  AlertTriangle,
  Brain,
  BookOpen,
  BarChart3,
  ShieldAlert,
  Database,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  memoriesCount: number;
  lessonsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  memoriesCount,
  lessonsCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, emoji: '🏠' },
    { id: 'add-incident', label: 'Add New Incident', icon: PlusCircle, emoji: '➕' },
    { id: 'ai-solve', label: 'AI Solve New Problem', icon: Bot, emoji: '🤖', badge: 'AI Agent' },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, emoji: '📋' },
    { id: 'memory', label: 'Organizational Memory', icon: Brain, emoji: '🧠', count: memoriesCount },
    { id: 'lessons', label: 'Lessons', icon: BookOpen, emoji: '💡', count: lessonsCount },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, emoji: '📊' },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0 h-screen select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                RESOLVE<span className="text-cyan-400">IQ</span>
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Incident Resolution Agent
            </p>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-slate-400 italic">
          Remember. Reflect. Resolve Better.
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-2">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600/15 text-cyan-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <span className="text-sm shrink-0">{item.emoji}</span>
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 font-bold uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Persistent Hindsight Engine Status Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-slate-200">Hindsight Engine</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Active</span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-400 font-mono">
            <div className="flex justify-between items-center">
              <span className="flex items-center space-x-1">
                <Database className="w-3 h-3 text-slate-500" />
                <span>Memory Pool:</span>
              </span>
              <span className="text-slate-200 font-bold">{memoriesCount} experiences</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3 text-slate-500" />
                <span>Reflections:</span>
              </span>
              <span className="text-slate-200 font-bold">{lessonsCount} lessons</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
