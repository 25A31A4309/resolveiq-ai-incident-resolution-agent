import React, { useState } from 'react';
import {
  Brain,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  Filter,
  Tag,
  ShieldAlert,
  Database,
} from 'lucide-react';
import { RetainedMemory, LessonModel } from '../types';
import { api } from '../services/api';

interface MemoryPageProps {
  memories: RetainedMemory[];
  lessons: LessonModel[];
  onRefreshData: () => void;
}

export const MemoryPage: React.FC<MemoryPageProps> = ({
  memories,
  lessons,
  onRefreshData,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'success' | 'failed' | 'lessons'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RetainedMemory[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await api.searchMemory(searchQuery.trim());
      setSearchResults(res);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const displayedMemories = searchResults !== null ? searchResults : memories;

  const filteredMemories = displayedMemories.filter((m) => {
    if (activeFilter === 'success') return m.outcome === 'Successful';
    if (activeFilter === 'failed') return m.failed_approaches && m.failed_approaches.length > 0;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
            <Brain className="w-4 h-4" />
            <span>Hindsight Knowledge Base</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Organizational Memory</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Persistent incident experiences, validated root causes, successful resolutions, and anti-patterns consolidated across engineering outages.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-slate-300">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hindsight Store: {memories.length} {memories.length === 1 ? 'experience' : 'experiences'}</span>
        </div>
      </div>

      {/* Semantic Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search organizational memory by symptoms, root causes, services, or resolutions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
        >
          {searching ? 'Querying...' : 'Hindsight Recall'}
        </button>
        {searchResults !== null && (
          <button
            type="button"
            onClick={clearSearch}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Clear
          </button>
        )}
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          All Incident Experiences ({memories.length})
        </button>

        <button
          onClick={() => setActiveFilter('success')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
            activeFilter === 'success'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Successful Approaches ({memories.filter((m) => m.outcome === 'Successful').length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('failed')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
            activeFilter === 'failed'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Failed Approaches / Anti-Patterns</span>
        </button>

        <button
          onClick={() => setActiveFilter('lessons')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
            activeFilter === 'lessons'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Synthesized Lessons ({lessons.length})</span>
        </button>
      </div>

      {/* Content Display */}
      {activeFilter === 'lessons' ? (
        /* Lessons Catalog */
        lessons.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-300">No Lessons Learned Yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Complete and resolve an incident to trigger Hindsight reflection and generate organizational lessons.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lessons.map((lesson) => (
              <div
                key={lesson.lesson_id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">
                    {lesson.lesson_id}
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                    {lesson.service}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{lesson.title}</h3>

                <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/20 text-xs text-slate-200 font-medium leading-relaxed">
                  &ldquo;{lesson.lesson}&rdquo;
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <div>
                    <strong className="text-slate-500">Root Cause:</strong> {lesson.root_cause_summary}
                  </div>
                  <div>
                    <strong className="text-slate-500">Effective Pattern:</strong>{' '}
                    <span className="text-emerald-400 font-semibold">{lesson.successful_pattern}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Retained Incident Memory Cards */
        filteredMemories.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
            <Brain className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-300">No Memories Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Hindsight long-term memory is currently empty. Retain your first resolved incident to seed memory.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMemories.map((mem) => (
              <div
                key={mem.memory_id}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-xl"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">{mem.memory_id}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-[11px] font-mono text-slate-400">{mem.incident_id}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-blue-500/10 text-cyan-300 border border-blue-500/30">
                      {mem.service}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {mem.environment}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] px-3 py-1 rounded-full font-semibold uppercase tracking-wider self-start sm:self-auto ${
                      mem.outcome === 'Successful'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {mem.outcome}
                  </span>
                </div>

                {/* Title & Symptoms */}
                <div>
                  <h3 className="text-base font-bold text-white">{mem.title}</h3>
                  <div className="mt-1 text-xs font-mono text-rose-300 bg-slate-950 p-2 rounded-lg border border-slate-800 truncate">
                    {mem.error_message}
                  </div>
                </div>

                {/* Explanatory Grid: What happened, root cause, worked, failed, learned */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                  {/* What Happened? */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      What happened?
                    </div>
                    <p className="text-slate-300 leading-snug">{mem.description}</p>
                  </div>

                  {/* Root Cause */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                      Root Cause
                    </div>
                    <p className="text-amber-200 font-medium leading-snug">{mem.root_cause}</p>
                  </div>

                  {/* What Worked? */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>What Worked?</span>
                    </div>
                    <p className="text-emerald-300 font-semibold leading-snug">{mem.final_resolution}</p>
                  </div>

                  {/* What Failed? */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/20 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center space-x-1">
                      <XCircle className="w-3 h-3" />
                      <span>What Failed?</span>
                    </div>
                    <p className="text-rose-300 leading-snug">
                      {mem.failed_approaches && mem.failed_approaches.length > 0
                        ? mem.failed_approaches.join(', ')
                        : 'No ineffective approaches logged'}
                    </p>
                  </div>
                </div>

                {/* What Did Organization Learn? */}
                {mem.lesson && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs flex items-start space-x-2">
                    <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-indigo-300 uppercase tracking-wider text-[10px] block">
                        Organizational Lesson Learned:
                      </strong>
                      <span className="text-slate-200 italic">&ldquo;{mem.lesson}&rdquo;</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
