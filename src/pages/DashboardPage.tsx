import React from 'react';
import {
  Brain,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';
import { DashboardStats, IncidentModel, LessonModel, RetainedMemory } from '../types';

interface DashboardPageProps {
  stats: DashboardStats | null;
  recentIncidents: IncidentModel[];
  recentLessons: LessonModel[];
  memories: RetainedMemory[];
  onNavigateToNewIncident: () => void;
  onNavigateToIncident: (id: string) => void;
  onNavigateToMemory: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  recentIncidents,
  recentLessons,
  memories,
  onNavigateToNewIncident,
  onNavigateToIncident,
  onNavigateToMemory,
}) => {
  const incidentsRemembered = stats ? stats.incidents_remembered : 0;
  const lessonsLearned = stats ? stats.lessons_learned : 0;
  const successfulResolutions = stats ? stats.successful_resolutions : 0;
  const failedApproaches = stats ? stats.failed_approaches : 0;

  // Grammatically correct singular/plural
  const incidentWording = incidentsRemembered === 1 ? 'Incident Remembered' : 'Incidents Remembered';
  const lessonWording = lessonsLearned === 1 ? 'Lesson Learned' : 'Lessons Learned';
  const successWording = successfulResolutions === 1 ? 'Successful Resolution' : 'Successful Resolutions';
  const failedWording = failedApproaches === 1 ? 'Failed Approach' : 'Failed Approaches';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Main Header / Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-bold">
              ResolveIQ Platform
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-slate-400">Continuous SRE Knowledge Graph</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
            ORGANIZATIONAL MEMORY
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Persistent Hindsight memory continuously consolidated across past outages. Every incident resolved strengthens your engineering team&apos;s automated recall.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateToNewIncident}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 border border-blue-400/30"
          >
            <Zap className="w-4 h-4 text-cyan-300" />
            <span>Investigate New Incident</span>
          </button>
        </div>
      </div>

      {/* Dynamic Key Metric Cards (No fake hardcoding) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Incidents Remembered */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Retention</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">
              {incidentsRemembered}
            </span>
            <span className="text-xs text-slate-400">{incidentWording}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Hindsight Store</span>
            <span className="text-emerald-400 font-mono">Consolidated</span>
          </div>
        </div>

        {/* Lessons Learned */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Reflective Synthesis</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono text-indigo-300 tracking-tight">
              {lessonsLearned}
            </span>
            <span className="text-xs text-slate-400">{lessonWording}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Actionable Rules</span>
            <span className="text-indigo-400 font-mono">Runbook Ready</span>
          </div>
        </div>

        {/* Successful Resolutions */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Proven Playbooks</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono text-emerald-300 tracking-tight">
              {successfulResolutions}
            </span>
            <span className="text-xs text-slate-400">{successWording}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Verified Fixes</span>
            <span className="text-emerald-400 font-mono">100% Grounded</span>
          </div>
        </div>

        {/* Failed Approaches */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Anti-Patterns Recorded</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono text-rose-300 tracking-tight">
              {failedApproaches}
            </span>
            <span className="text-xs text-slate-400">{failedWording}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Avoid Wasted Time</span>
            <span className="text-rose-400 font-mono">Prevented</span>
          </div>
        </div>
      </div>

      {/* The Core Learning Loop Pipeline */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>The Autonomous Memory Lifecycle</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              How ResolveIQ continuously evolves through organizational experience
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            Autonomous Loop
          </span>
        </div>

        {/* Pipeline Steps Flow */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
          {[
            { step: '1', title: 'Incident Created', desc: 'Alert & symptom input' },
            { step: '2', title: 'Memory Recalled', desc: 'Hindsight semantic query' },
            { step: '3', title: 'AI Recommendation', desc: 'Historical fact grounding' },
            { step: '4', title: 'Engineer Action', desc: 'Remediation executed' },
            { step: '5', title: 'Outcome Recorded', desc: 'Cause & fix documented' },
            { step: '6', title: 'Hindsight Reflection', desc: 'Synthesizes new lesson' },
            { step: '7', title: 'Memory Stored', desc: 'Better future recall' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between text-left hover:border-blue-500/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 text-[10px] font-mono font-bold flex items-center justify-center border border-slate-700">
                  {item.step}
                </span>
                {idx < 6 && (
                  <ArrowRight className="w-3 h-3 text-slate-600 hidden lg:block" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">{item.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Split Section: Recent Incidents vs Recent Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents Panel */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Recent Incidents</span>
            </h3>
            <button
              onClick={onNavigateToNewIncident}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              + Submit Incident
            </button>
          </div>

          {recentIncidents.length === 0 ? (
            <div className="py-10 text-center rounded-xl bg-slate-950/60 border border-slate-800/80">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-300">No Incidents Reported Yet</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
                Begin by investigating your first production alert to seed initial organizational memory.
              </p>
              <button
                onClick={onNavigateToNewIncident}
                className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                Create First Incident
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentIncidents.slice(0, 4).map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => onNavigateToIncident(inc.id)}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono font-bold text-slate-400">{inc.id}</span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {inc.service}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                        inc.status === 'Resolved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : inc.status === 'Action Pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200 mt-2 group-hover:text-cyan-400 transition-colors">
                    {inc.title}
                  </h4>

                  {inc.final_resolution && (
                    <div className="mt-2 text-[11px] text-emerald-400/90 flex items-center space-x-1.5 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span className="truncate">Fix: {inc.final_resolution}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Lessons Synthesized by Hindsight */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Synthesized Organizational Lessons</span>
            </h3>
            <button
              onClick={onNavigateToMemory}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View All ({lessonsLearned})
            </button>
          </div>

          {recentLessons.length === 0 ? (
            <div className="py-10 text-center rounded-xl bg-slate-950/60 border border-slate-800/80">
              <Brain className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-300">No Lessons Synthesized Yet</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
                When you record an incident outcome, Hindsight reflection automatically synthesizes reusable organizational lessons.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLessons.slice(0, 4).map((lesson) => (
                <div
                  key={lesson.lesson_id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-2 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">
                      {lesson.lesson_id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {lesson.service}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    &ldquo;{lesson.lesson}&rdquo;
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {lesson.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
