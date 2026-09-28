import React from 'react';
import { BookOpen, Copy, Check, Tag, ShieldCheck, Database } from 'lucide-react';
import { LessonModel } from '../types';

interface LessonsPageProps {
  lessons: LessonModel[];
}

export const LessonsPage: React.FC<LessonsPageProps> = ({ lessons }) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Reflective Synthesis</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Organizational Lessons</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            SRE best practices and validated operational patterns synthesized by Hindsight Reflection from completed outages.
          </p>
        </div>

        <div className="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-slate-300">
          Total Lessons: {lessons.length}
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Lessons Synthesized Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Lessons are generated dynamically by Hindsight reflection when you record an incident outcome.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map((l) => (
            <div
              key={l.lesson_id}
              className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-indigo-400">{l.lesson_id}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      {l.service}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(l.lesson, l.lesson_id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Copy lesson to clipboard"
                  >
                    {copiedId === l.lesson_id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <h3 className="text-sm font-bold text-white">{l.title}</h3>

                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 text-slate-200 text-xs font-medium leading-relaxed italic">
                  &ldquo;{l.lesson}&rdquo;
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start space-x-2 text-slate-300">
                    <strong className="text-slate-500 text-[11px] uppercase tracking-wider shrink-0 w-28">
                      Root Cause:
                    </strong>
                    <span className="text-amber-300">{l.root_cause_summary}</span>
                  </div>

                  <div className="flex items-start space-x-2 text-slate-300">
                    <strong className="text-slate-500 text-[11px] uppercase tracking-wider shrink-0 w-28">
                      Proven Pattern:
                    </strong>
                    <span className="text-emerald-400 font-semibold">{l.successful_pattern}</span>
                  </div>

                  {l.avoid_pattern && (
                    <div className="flex items-start space-x-2 text-slate-300">
                      <strong className="text-slate-500 text-[11px] uppercase tracking-wider shrink-0 w-28">
                        Pattern to Avoid:
                      </strong>
                      <span className="text-rose-300">{l.avoid_pattern}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex flex-wrap gap-1.5">
                  {l.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                <span className="font-mono">{new Date(l.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
