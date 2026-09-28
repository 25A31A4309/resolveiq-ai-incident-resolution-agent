import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DashboardStats, IncidentModel, RetainedMemory } from '../types';

interface AnalyticsPageProps {
  stats: DashboardStats | null;
  incidents: IncidentModel[];
  memories: RetainedMemory[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  stats,
  incidents,
  memories,
}) => {
  const totalIncidents = incidents.length;
  const incidentsWithMemory = incidents.filter((i) => i.historical_memory_found).length;
  const incidentsWithoutMemory = incidents.filter((i) => i.has_analysis && !i.historical_memory_found).length;
  const successfulResolutions = memories.filter((m) => m.outcome === 'Successful').length;
  const failedApproachesCount = memories.reduce((acc, m) => acc + (m.failed_approaches?.length || 0), 0);
  const lessonsCount = stats?.lessons_learned || 0;

  // Real Memory Recall Rate (strictly calculated from actual incidents analyzed)
  const totalAnalyzed = incidentsWithMemory + incidentsWithoutMemory;
  const recallHitRate = totalAnalyzed > 0 ? Math.round((incidentsWithMemory / totalAnalyzed) * 100) : 0;

  // Breakdown by Service
  const serviceCounts: Record<string, number> = {};
  for (const inc of incidents) {
    serviceCounts[inc.service] = (serviceCounts[inc.service] || 0) + 1;
  }
  const servicesList = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
          <BarChart3 className="w-4 h-4" />
          <span>Operational Intelligence</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mt-1">SRE Memory Analytics</h1>
        <p className="text-xs text-slate-400 mt-1">
          Real metrics derived strictly from actual Hindsight retain, recall, and incident resolution operations.
        </p>
      </div>

      {/* Real Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Incidents */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Declared Incidents</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-white mt-2">
            {totalIncidents}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">
            {totalAnalyzed} investigated by ResolveIQ
          </div>
        </div>

        {/* Incidents with Historical Memory */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Incidents With Historical Memory</span>
            <Brain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-cyan-300 mt-2">
            {incidentsWithMemory}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">
            Recall Hit Rate: {recallHitRate}%
          </div>
        </div>

        {/* Incidents without Historical Memory */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Incidents Without Memory (New)</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-amber-300 mt-2">
            {incidentsWithoutMemory}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">
            Baseline diagnostic path generated
          </div>
        </div>

        {/* Successful Resolutions */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Successful Resolutions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-300 mt-2">
            {successfulResolutions}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">
            Retained in organizational memory
          </div>
        </div>

        {/* Failed Approaches Documented */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Anti-Patterns / Failed Approaches</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-rose-300 mt-2">
            {failedApproachesCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">
            Recorded to prevent repetitive mistakes
          </div>
        </div>

        {/* Synthesized Lessons */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Lessons Synthesized</span>
            <Brain className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-indigo-300 mt-2">
            {lessonsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">
            Consolidated through Hindsight reflect
          </div>
        </div>
      </div>

      {/* Visual Data Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Memory Recall Ratio Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>Memory Recall Ratio (Real Telemetry)</span>
          </h3>

          {totalAnalyzed === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No incidents analyzed yet. Run an investigation to measure memory hits.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-cyan-300 font-semibold">Recalled Past Experience</span>
                  <span className="font-mono text-slate-300">{incidentsWithMemory} ({recallHitRate}%)</span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${recallHitRate}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-300 font-semibold">New Incidents (No Memory)</span>
                  <span className="font-mono text-slate-300">
                    {incidentsWithoutMemory} ({100 - recallHitRate}%)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${100 - recallHitRate}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Incidents by Service */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Incidents by Service</span>
          </h3>

          {servicesList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No service telemetry recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {servicesList.map(([serviceName, count]) => {
                const pct = Math.round((count / totalIncidents) * 100);
                return (
                  <div key={serviceName} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">{serviceName}</span>
                      <span className="text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
