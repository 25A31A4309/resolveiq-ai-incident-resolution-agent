import React, { useState } from 'react';
import {
  Activity,
  RefreshCw,
  Database,
  Trash2,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { api } from '../services/api';

interface HeaderProps {
  onRefreshData: () => void;
  memoriesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onRefreshData,
  memoriesCount,
}) => {
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await api.seedDemo();
      showNotification(`✓ ${res.message}`);
      onRefreshData();
    } catch (e: any) {
      showNotification(`Failed to seed: ${e.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all Hindsight memory and incidents to 0 for a clean test?')) {
      return;
    }
    setResetting(true);
    try {
      const res = await api.resetAll();
      showNotification(`✓ ${res.message}`);
      onRefreshData();
    } catch (e: any) {
      showNotification(`Failed to reset: ${e.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between z-10 sticky top-0">
      {/* Title & Tagline */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-sm font-semibold tracking-wide text-white flex items-center space-x-2">
            <span>RESOLVE<span className="text-cyan-400">IQ</span></span>
            <span className="text-slate-500 font-normal">/</span>
            <span className="text-slate-300 font-normal">AI Incident Resolution Agent</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium hidden sm:block">
            Remember. Reflect. Resolve Better.
          </p>
        </div>

        {actionNotice && (
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs rounded-full animate-fade-in font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* Status & Quick Action Controls */}
      <div className="flex items-center space-x-3">
        {/* Hindsight Status Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-xs shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-emerald-300">Hindsight Connected</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-slate-400 text-[11px]">
            {memoriesCount} {memoriesCount === 1 ? 'memory' : 'memories'}
          </span>
        </div>

        {/* Seed Demo Incidents */}
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors disabled:opacity-50"
          title="Seed realistic synthetic incidents into Hindsight"
        >
          <Database className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Seed Experiences</span>
        </button>

        {/* Reset Clean Slate */}
        <button
          onClick={handleReset}
          disabled={resetting}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-colors disabled:opacity-50"
          title="Reset Hindsight memory to 0 (for clean-slate demo testing)"
        >
          <Trash2 className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-rose-400' : ''}`} />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Manual Refresh */}
        <button
          onClick={onRefreshData}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors"
          title="Refresh live data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
