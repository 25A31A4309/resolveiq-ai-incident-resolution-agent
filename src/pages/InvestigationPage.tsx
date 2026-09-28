import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  ArrowRight,
  Database,
  Terminal,
  Save,
  BookOpen,
  Layers,
  RotateCcw,
  Check,
  ChevronDown,
  Info,
} from 'lucide-react';
import { IncidentModel, AnalysisResult, RetainedMemory, LessonModel, OutcomeType } from '../types';
import { api } from '../services/api';

interface InvestigationPageProps {
  incidentId: string;
  onBackToIncidents: () => void;
  onRefreshData: () => void;
  onLaunchSimilarIncident: () => void;
}

export const InvestigationPage: React.FC<InvestigationPageProps> = ({
  incidentId,
  onBackToIncidents,
  onRefreshData,
  onLaunchSimilarIncident,
}) => {
  const [incident, setIncident] = useState<IncidentModel | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'causes' | 'history' | 'summary'>('recommendations');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Outcome Form State
  const [actionTaken, setActionTaken] = useState('');
  const [result, setResult] = useState<OutcomeType>('Successful');
  const [rootCause, setRootCause] = useState('');
  const [finalResolution, setFinalResolution] = useState('');
  const [engineerFeedback, setEngineerFeedback] = useState('');
  const [outcomeSaved, setOutcomeSaved] = useState(false);
  const [synthesizedLesson, setSynthesizedLesson] = useState<string | null>(null);

  const fetchIncidentDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getIncident(incidentId);
      setIncident(data);
      if (data.analysis) {
        setAnalysis(data.analysis);
      }
      if (data.action_taken) setActionTaken(data.action_taken);
      if (data.result) setResult(data.result);
      if (data.root_cause) setRootCause(data.root_cause);
      if (data.final_resolution) setFinalResolution(data.final_resolution);
      if (data.engineer_feedback) setEngineerFeedback(data.engineer_feedback);
      if (data.lesson) {
        setSynthesizedLesson(data.lesson);
        setOutcomeSaved(true);
      }

      // If no analysis yet, auto-trigger analysis
      if (!data.has_analysis) {
        runAnalysis();
      }
    } catch (e: any) {
      setErrorNotice(e.message || 'Failed to load incident');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentDetails();
  }, [incidentId]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setErrorNotice(null);
    try {
      const res = await api.analyzeIncident(incidentId);
      setAnalysis(res);
      const updated = await api.getIncident(incidentId);
      setIncident(updated);
      onRefreshData();
    } catch (e: any) {
      setErrorNotice(e.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // Outcome Submission
  const handleSaveOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTaken.trim() || !rootCause.trim() || !finalResolution.trim()) {
      setErrorNotice('Action taken, root cause, and final resolution are required.');
      return;
    }

    setSavingOutcome(true);
    setErrorNotice(null);

    try {
      const res = await api.recordOutcome(incidentId, {
        action_taken: actionTaken.trim(),
        result,
        root_cause: rootCause.trim(),
        final_resolution: finalResolution.trim(),
        engineer_feedback: engineerFeedback.trim(),
      });

      setIncident(res.incident);
      setSynthesizedLesson(res.lesson.lesson);
      setOutcomeSaved(true);
      onRefreshData();
    } catch (e: any) {
      setErrorNotice(e.message || 'Failed to save outcome');
    } finally {
      setSavingOutcome(false);
    }
  };

  // Demo helper: quick fill verified resolution
  const autoFillPaymentResolution = () => {
    setActionTaken('Reset database connection pool and patched ORM connection leak');
    setResult('Successful');
    setRootCause('Database connection pool exhaustion');
    setFinalResolution('Reset database connection pool and scaled pool ceiling');
    setEngineerFeedback('Monitor database active thread count more aggressively during flash campaigns.');
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-semibold text-slate-300">Loading Incident &amp; Querying Hindsight...</div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Incident Not Found</h2>
        <button
          onClick={onBackToIncidents}
          className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
        >
          Return to Incidents
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Top Breadcrumb & Status Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={onBackToIncidents}
            className="text-slate-400 hover:text-cyan-400 transition-colors"
          >
            Incidents
          </button>
          <span className="text-slate-600">/</span>
          <span className="font-mono text-cyan-400 font-bold">{incident.id}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">ResolveIQ Investigation Room</span>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
              incident.status === 'Resolved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {incident.status}
          </span>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Re-analyze</span>
          </button>
        </div>
      </div>

      {errorNotice && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* 1. CURRENT INCIDENT CARD */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-slate-400">{incident.id}</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono bg-blue-500/10 text-cyan-300 border border-blue-500/30 font-semibold">
                {incident.service}
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {incident.environment}
              </span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                  incident.severity === 'Critical'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : incident.severity === 'High'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {incident.severity}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {incident.title}
            </h1>
          </div>

          <div className="text-left md:text-right text-xs text-slate-400 font-mono">
            <div>Reported: {new Date(incident.created_at).toLocaleTimeString()}</div>
            <div className="text-slate-500">{new Date(incident.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Error Message Callout */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/20 font-mono text-xs text-rose-300 flex items-start space-x-2.5">
          <Terminal className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <div className="flex-1 break-all">{incident.error_message}</div>
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          {incident.description}
        </p>

        {/* Optional Logs */}
        {incident.logs && (
          <details className="text-xs group">
            <summary className="cursor-pointer text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1.5 select-none">
              <span>View Captured Logs / Telemetry Trace</span>
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <pre className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
              {incident.logs}
            </pre>
          </details>
        )}
      </div>

      {/* 2. HINDSIGHT MEMORY CARD (SCENARIO A vs SCENARIO B) */}
      <div className="space-y-4">
        {analyzing ? (
          <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-lg text-center space-y-3">
            <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-sm font-semibold text-white">Searching Hindsight Organizational Memory...</div>
            <p className="text-xs text-slate-400 font-mono">
              Running multi-strategy recall (vector embeddings + BM25 token correlation) across past incident experiences...
            </p>
          </div>
        ) : analysis?.historical_memory_found ? (
          /* SCENARIO A: SIMILAR MEMORY FOUND */
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-cyan-500/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-cyan-500/20 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span className="text-cyan-400">Similar Historical Incidents Found</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                      {analysis.recalled_memories.length} {analysis.recalled_memories.length === 1 ? 'Match' : 'Matches'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Hindsight recalled organizational experiences from previous outages.
                  </p>
                </div>
              </div>

              <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-semibold self-start sm:self-auto">
                Verified Historical Grounding
              </span>
            </div>

            {/* Recalled Memory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {analysis.recalled_memories.map((mem) => (
                <div
                  key={mem.memory_id}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono font-bold text-slate-300">{mem.incident_id}</span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                        {mem.service}
                      </span>
                    </div>
                    {/* Relevance tier (High relevance / Relevant memory based on actual retrieval score) */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        mem.relevance_tier === 'High relevance'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {mem.relevance_tier || 'Relevant memory'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white">{mem.title}</h4>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start space-x-1.5 text-slate-300">
                      <strong className="text-slate-400 text-[11px] uppercase tracking-wider shrink-0 w-24">
                        Root Cause:
                      </strong>
                      <span className="text-amber-300 font-medium">{mem.root_cause}</span>
                    </div>

                    <div className="flex items-start space-x-1.5 text-slate-300">
                      <strong className="text-slate-400 text-[11px] uppercase tracking-wider shrink-0 w-24">
                        Resolution:
                      </strong>
                      <span className="text-emerald-400 font-semibold">{mem.final_resolution}</span>
                    </div>

                    <div className="flex items-start space-x-1.5 text-slate-300">
                      <strong className="text-slate-400 text-[11px] uppercase tracking-wider shrink-0 w-24">
                        Outcome:
                      </strong>
                      <span className="text-emerald-300 flex items-center space-x-1 font-mono text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{mem.outcome}</span>
                      </span>
                    </div>

                    {mem.failed_approaches && mem.failed_approaches.length > 0 && (
                      <div className="p-2 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px] space-y-0.5">
                        <div className="font-semibold text-rose-400 flex items-center space-x-1">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          <span>Previously Failed Approaches (Avoid!):</span>
                        </div>
                        <div>{mem.failed_approaches.join(', ')}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* SCENARIO B: NO RELEVANT MEMORY FOUND */
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-sm font-bold text-amber-300">
                No relevant historical memory found.
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-7">
              This appears to be a <strong>new incident for your organization</strong>. Hindsight did not identify past
              resolutions for this signature. ResolveIQ will formulate baseline hypotheses from system knowledge and technical telemetry.
            </p>
          </div>
        )}
      </div>

      {/* 3. AI ANALYSIS TABS (Summary, Historical Context, Likely Causes, Recommendations) */}
      {analysis && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          {/* Tabs Navigation */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'recommendations'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Steps</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {analysis.recommendations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('causes')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'causes'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Likely Causes (Hypotheses)</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {analysis.likely_causes.length}
              </span>
            </button>

            {analysis.historical_context && (
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Historical Context</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'summary'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Investigation Summary</span>
            </button>
          </div>

          {/* TAB 1: RECOMMENDATIONS */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Ordered by historical efficacy and standard diagnostic protocol:</span>
                <span className="text-[10px] font-mono text-cyan-400">Strict Justification Protocol</span>
              </div>

              <div className="space-y-3">
                {analysis.recommendations.map((rec) => (
                  <div
                    key={rec.step_number}
                    className={`p-4 rounded-xl border transition-all ${
                      rec.is_historically_grounded
                        ? 'bg-blue-950/20 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                            rec.is_historically_grounded
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {rec.step_number}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                            <span>{rec.title}</span>
                            {rec.is_historically_grounded && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                                Historically Grounded ({rec.source_incident_id || 'Past Outage'})
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1">{rec.action}</p>
                        </div>
                      </div>
                    </div>

                    {/* Explanatory Rationale */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-start space-x-2 text-xs">
                      <strong className="text-slate-400 text-[11px] uppercase tracking-wider shrink-0">
                        Reason:
                      </strong>
                      <span className="text-cyan-300/90 italic">{rec.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: LIKELY CAUSES (Strictly Hypotheses) */}
          {activeTab === 'causes' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Strict SRE Principle:</strong> The following are AI hypotheses based on error telemetry. They are NOT confirmed facts until verified by the responding engineer.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {analysis.likely_causes.map((cause, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono uppercase text-slate-500">Hypothesis #{idx + 1}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cause.likelihood === 'High'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : cause.likelihood === 'Medium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {cause.likelihood} Likelihood
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-snug">{cause.hypothesis}</h4>
                    </div>

                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                      <strong className="text-slate-500 block text-[10px] uppercase">Basis:</strong>
                      <span>{cause.basis}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: HISTORICAL CONTEXT */}
          {activeTab === 'history' && analysis.historical_context && (
            <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                <Brain className="w-4 h-4" />
                <span>Hindsight Recalled Context</span>
              </div>
              <p className="text-slate-200 leading-relaxed text-sm">
                {analysis.historical_context}
              </p>
            </div>
          )}

          {/* TAB 4: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-white text-sm">Automated Agent Assessment</div>
              <p className="leading-relaxed">{analysis.summary}</p>
              <div className="pt-2 text-[11px] font-mono text-slate-500">
                Timestamp: {new Date(analysis.analyzed_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. ENGINEER ACTION / OUTCOME SECTION (Sections 8 & 9) */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Remediation &amp; Learning Protocol</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">Record Incident Outcome &amp; Retain Memory</h2>
            <p className="text-xs text-slate-400">
              Documenting the confirmed root cause and resolution triggers Hindsight reflection to store reusable organizational memory.
            </p>
          </div>

          {/* Preset Helper */}
          <button
            type="button"
            onClick={autoFillPaymentResolution}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
          >
            Auto-fill DB Pool Resolution
          </button>
        </div>

        <form onSubmit={handleSaveOutcome} className="space-y-5">
          {/* Action Taken */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Action Taken by Engineer <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="e.g. Reset database connection pool and scaled worker capacity"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Outcome Result */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Remediation Result <span className="text-rose-400">*</span>
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as OutcomeType)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              >
                <option value="Successful">Successful (Resolved Outage)</option>
                <option value="Failed">Failed (Approach Ineffective)</option>
                <option value="Inconclusive">Inconclusive (Mitigated Temporarily)</option>
              </select>
            </div>

            {/* Root Cause */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Confirmed Root Cause <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="e.g. Database connection pool exhaustion"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                required
              />
            </div>
          </div>

          {/* Final Resolution */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Final Resolution Deployed <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={finalResolution}
              onChange={(e) => setFinalResolution(e.target.value)}
              placeholder="e.g. Reset database connection pool"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              required
            />
          </div>

          {/* Engineer Feedback */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Post-Incident Engineer Feedback / Observations</span>
              <span className="text-[10px] text-slate-500 font-mono">Optional</span>
            </label>
            <textarea
              rows={2}
              value={engineerFeedback}
              onChange={(e) => setEngineerFeedback(e.target.value)}
              placeholder="e.g. Monitor connection pool usage more closely. Add alert for pool queue depth > 20."
              className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400 flex items-center space-x-1.5">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span>Hindsight will reflect upon this experience and retain a reusable lesson.</span>
            </div>

            <button
              type="submit"
              disabled={savingOutcome}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20 border border-emerald-400/30 disabled:opacity-50 cursor-pointer"
            >
              {savingOutcome ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Reflecting &amp; Retaining in Hindsight...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Outcome &amp; Retain Memory</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 5. LEARNING / REFLECTION DISPLAY & TIMELINE (Section 9 & 10) */}
      {synthesizedLesson && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>🧠 New Organizational Lesson Synthesized</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    Retained in Hindsight
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Consolidated by Hindsight Reflection from complete incident experience
                </p>
              </div>
            </div>

            {/* Quick action to trigger Hackathon Step 2 Demo */}
            <button
              onClick={onLaunchSimilarIncident}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all flex items-center space-x-1.5 shadow-sm"
              title="Demonstrate that a second similar incident recalls this newly retained lesson!"
            >
              <span>Test Recall on Next Incident</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>

          {/* Lesson Content Callout */}
          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 text-slate-100 text-sm leading-relaxed font-medium">
            &ldquo;{synthesizedLesson}&rdquo;
          </div>

          {/* Memory Lifecycle Timeline */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Resolved Incident Lifecycle Completed</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {[
                { label: 'Incident Created', state: 'done' },
                { label: 'Memory Recalled', state: 'done' },
                { label: 'AI Recommendation', state: 'done' },
                { label: 'Engineer Action', state: 'done' },
                { label: 'Outcome Recorded', state: 'done' },
                { label: 'Hindsight Reflection', state: 'done' },
                { label: 'Memory Stored', state: 'done' },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-center"
                >
                  <div className="flex items-center justify-center mb-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[10px] font-bold text-emerald-300">{step.label}</div>
                  <div className="text-[9px] font-mono text-emerald-500 mt-0.5">Verified</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
