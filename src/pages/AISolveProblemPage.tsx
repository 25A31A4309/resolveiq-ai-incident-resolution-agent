import React, { useState } from 'react';
import {
  Bot,
  Brain,
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Terminal,
  Save,
  BookOpen,
  Layers,
  History,
  RotateCcw,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  SeverityType,
  OutcomeType,
  ProblemInvestigateResponse,
  RetainedMemory,
  IncidentModel,
} from '../types';
import { api } from '../services/api';

interface AISolveProblemPageProps {
  onNavigateToIncident: (incidentId: string) => void;
  onNavigateToMemory: () => void;
  onRefreshData: () => void;
}

export const AISolveProblemPage: React.FC<AISolveProblemPageProps> = ({
  onNavigateToIncident,
  onNavigateToMemory,
  onRefreshData,
}) => {
  // Input form state
  const [title, setTitle] = useState('');
  const [service, setService] = useState('');
  const [environment, setEnvironment] = useState('Production');
  const [severity, setSeverity] = useState<SeverityType>('High');
  const [errorMessage, setErrorMessage] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [logs, setLogs] = useState('');
  const [recentChanges, setRecentChanges] = useState('');

  // Investigation result state
  const [investigating, setInvestigating] = useState(false);
  const [investigationResult, setInvestigationResult] = useState<ProblemInvestigateResponse | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Engineer Action form state
  const [actionTaken, setActionTaken] = useState('');
  const [result, setResult] = useState<OutcomeType>('Successful');
  const [rootCause, setRootCause] = useState('');
  const [finalResolution, setFinalResolution] = useState('');
  const [engineerFeedback, setEngineerFeedback] = useState('');
  const [savingOutcome, setSavingOutcome] = useState(false);

  // Learned state
  const [learnedData, setLearnedData] = useState<{
    incidentId: string;
    rootCause: string;
    resolution: string;
    lesson: string;
  } | null>(null);

  // Example Presets for Testing
  const applyPreset = (preset: {
    title: string;
    service: string;
    environment: string;
    severity: SeverityType;
    error_message: string;
    what_happened: string;
    logs: string;
    recent_changes: string;
  }) => {
    setTitle(preset.title);
    setService(preset.service);
    setEnvironment(preset.environment);
    setSeverity(preset.severity);
    setErrorMessage(preset.error_message);
    setWhatHappened(preset.what_happened);
    setLogs(preset.logs);
    setRecentChanges(preset.recent_changes);
    setInvestigationResult(null);
    setLearnedData(null);
  };

  // Submit Investigation: Hindsight Recall FIRST -> AI Reasoning
  const handleInvestigate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !service.trim() || !errorMessage.trim() || !whatHappened.trim()) {
      setErrorNotice('Please fill out Title, Service, Error Message, and What Happened.');
      return;
    }

    setInvestigating(true);
    setErrorNotice(null);
    setLearnedData(null);

    try {
      const res = await api.investigateProblem({
        title: title.trim(),
        service: service.trim(),
        environment,
        severity,
        error_message: errorMessage.trim(),
        what_happened: whatHappened.trim(),
        logs: logs.trim() || undefined,
        recent_changes: recentChanges.trim() || undefined,
      });

      setInvestigationResult(res);

      // Pre-fill action hints if historical resolution is available
      if (res.historical_memory_found && res.recalled_memories.length > 0) {
        const top = res.recalled_memories[0];
        setRootCause(top.root_cause || '');
        setFinalResolution(top.final_resolution || '');
        setActionTaken(top.final_resolution || '');
      } else {
        setRootCause('');
        setFinalResolution('');
        setActionTaken('');
      }

      onRefreshData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to investigate problem');
    } finally {
      setInvestigating(false);
    }
  };

  // Save Outcome & Learn in Hindsight
  const handleSaveOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investigationResult) return;
    if (!actionTaken.trim() || !rootCause.trim() || !finalResolution.trim()) {
      setErrorNotice('Action taken, root cause, and final resolution are required.');
      return;
    }

    setSavingOutcome(true);
    setErrorNotice(null);

    try {
      const incId = investigationResult.incident.id;
      const res = await api.recordOutcome(incId, {
        action_taken: actionTaken.trim(),
        result,
        root_cause: rootCause.trim(),
        final_resolution: finalResolution.trim(),
        engineer_feedback: engineerFeedback.trim(),
      });

      setLearnedData({
        incidentId: incId,
        rootCause: rootCause.trim(),
        resolution: finalResolution.trim(),
        lesson: res.lesson.lesson,
      });

      onRefreshData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to save outcome');
    } finally {
      setSavingOutcome(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span>Intelligent Diagnostic Agent</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
          🤖 AI Solve New Problem
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Investigate a new technical problem using organizational memory and AI reasoning.
        </p>

        {/* Preset Selector */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-[11px] text-slate-400 font-mono">Quick Scenarios:</span>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                title: 'Payment API suddenly failing',
                service: 'payment-api',
                environment: 'Production',
                severity: 'Critical',
                error_message: 'PAY-7392 Invalid Payment Configuration',
                what_happened: 'Customers are unable to complete payments at checkout.',
                logs: `[error] 2026-09-27T12:45:01Z ClientError: Gateway config mismatch code=PAY-7392`,
                recent_changes: 'A configuration deployment happened 20 minutes ago.',
              })
            }
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono border border-slate-700 transition-colors"
          >
            Config Failure (Test Flow)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                title: 'Payment API returning 502',
                service: 'payment-api',
                environment: 'Production',
                severity: 'High',
                error_message: '502 Bad Gateway: Upstream connection pool exhausted',
                what_happened: 'Checkout transactions failing intermittently with HTTP 502.',
                logs: `[crit] active_connections=100 max_connections=100 queue_depth=52`,
                recent_changes: 'No deployments in last 24 hours. Spike in checkout traffic.',
              })
            }
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-mono border border-slate-700 transition-colors"
          >
            Payment 502 (Test Recall)
          </button>
        </div>
      </div>

      {errorNotice && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* STEP 1: PROBLEM INTAKE FORM */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">
              1
            </span>
            <span>Describe Problem</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            Hindsight Memory Checked First
          </span>
        </div>

        <form onSubmit={handleInvestigate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Problem Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Payment API suddenly failing"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Service <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. payment-api"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Canary">Canary</option>
                <option value="Development">Development</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityType)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-cyan-400 transition-colors"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Error Message <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="e.g. PAY-7392 Invalid Payment Configuration"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-rose-300 placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-cyan-400 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              What Happened? <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              placeholder="e.g. Customers are unable to complete payments."
              className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>Logs / Technical Details</span>
                <span className="text-[10px] text-slate-500 font-mono">Optional</span>
              </label>
              <textarea
                rows={3}
                value={logs}
                onChange={(e) => setLogs(e.target.value)}
                placeholder="Paste logs, stack traces, or exception details..."
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>Optional Recent Changes</span>
                <span className="text-[10px] text-slate-500 font-mono">Optional</span>
              </label>
              <textarea
                rows={3}
                value={recentChanges}
                onChange={(e) => setRecentChanges(e.target.value)}
                placeholder="e.g. A configuration deployment happened 20 minutes ago."
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-200 placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={investigating}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 border border-blue-400/30 disabled:opacity-50 cursor-pointer"
            >
              {investigating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Searching Hindsight &amp; Reasoning...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>🔍 Investigate Problem</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* STEP 2: INVESTIGATION RESULTS (CASE A vs CASE B) */}
      {investigationResult && (
        <div className="space-y-6">
          {/* CASE A — PREVIOUS MEMORY EXISTS */}
          {investigationResult.historical_memory_found ? (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-cyan-500/40 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-cyan-500/20 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      🧠 HISTORICAL EXPERIENCE FOUND
                    </h3>
                    <p className="text-xs text-slate-400">
                      Hindsight retrieved matching organizational memory from a past outage.
                    </p>
                  </div>
                </div>

                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-semibold self-start sm:self-auto">
                  Historical Memory Grounded
                </span>
              </div>

              {/* Past Incident Experience Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {investigationResult.recalled_memories.map((mem) => (
                  <div
                    key={mem.memory_id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono font-bold text-cyan-400">
                          Previous Incident: {mem.incident_id}
                        </span>
                        <span className="text-slate-600">&bull;</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                          {mem.service}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {mem.relevance_tier || 'High relevance'}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white">{mem.title}</div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <strong className="text-slate-500 text-[11px] uppercase">Problem:</strong>{' '}
                        <span className="text-slate-300">{mem.description}</span>
                      </div>
                      <div>
                        <strong className="text-slate-500 text-[11px] uppercase">Root Cause:</strong>{' '}
                        <span className="text-amber-300 font-medium">{mem.root_cause}</span>
                      </div>
                      <div>
                        <strong className="text-slate-500 text-[11px] uppercase">Previous Resolution:</strong>{' '}
                        <span className="text-emerald-400 font-semibold">{mem.final_resolution}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <strong className="text-slate-500 text-[11px] uppercase">Outcome:</strong>{' '}
                        <span className="text-emerald-300 flex items-center space-x-1 font-mono text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{mem.outcome}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Why This Memory Is Relevant */}
              {investigationResult.why_relevant && (
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs space-y-1.5">
                  <div className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">
                    Why This Memory Is Relevant:
                  </div>
                  <p className="text-slate-200 leading-relaxed text-xs">
                    {investigationResult.why_relevant}
                  </p>
                </div>
              )}

              {/* 🤖 AI RECOMMENDATION */}
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs space-y-3">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
                  <Bot className="w-4 h-4" />
                  <span>🤖 AI Recommendation</span>
                </div>
                <p className="text-slate-200 font-medium text-xs leading-relaxed">
                  {investigationResult.ai_recommendation_summary || investigationResult.summary}
                </p>

                {/* Recommended Investigation Steps */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="font-bold text-white text-[11px] uppercase tracking-wider">
                    Recommended Investigation Steps
                  </div>
                  <div className="space-y-2">
                    {investigationResult.recommendations.map((step) => (
                      <div
                        key={step.step_number}
                        className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-start space-x-2.5 text-xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {step.step_number}
                        </span>
                        <div className="flex-1">
                          <div className="font-bold text-white flex items-center space-x-2">
                            <span>{step.title}</span>
                            {step.is_historically_grounded && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Grounded in Memory
                              </span>
                            )}
                          </div>
                          <div className="text-slate-300 mt-0.5">{step.action}</div>
                          <div className="text-cyan-300/80 italic text-[11px] mt-1">
                            Reason: {step.reason}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear Separation Note */}
                <div className="pt-2 text-[10px] text-slate-400 font-mono flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Historical Facts: Verified</span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">Hypotheses: Unconfirmed</span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">Recommendations: Actionable</span>
                </div>
              </div>
            </div>
          ) : (
            /* CASE B — NO PREVIOUS MEMORY */
            <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-xl space-y-5">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>🆕 NEW ORGANIZATIONAL PROBLEM</span>
                </div>
                <div className="text-xs font-semibold text-white">
                  &ldquo;No relevant historical memory was found for this incident.&rdquo;
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ResolveIQ does not have previous organizational experience for this problem. It will investigate the current incident using the available technical information and reasoning.
                </p>
              </div>

              {/* 🤖 AI INVESTIGATION */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold uppercase tracking-wider text-xs">
                  <Bot className="w-4 h-4" />
                  <span>🤖 AI Investigation</span>
                </div>

                {/* Likely Causes / Hypotheses */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Likely Causes</span>
                    <span className="text-[11px] font-mono text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      Hypotheses — not yet confirmed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {investigationResult.likely_causes.map((cause, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-500">Hypothesis #{idx + 1}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {cause.likelihood}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white">{cause.hypothesis}</div>
                        <div className="text-[11px] text-slate-400">{cause.basis}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Investigation Steps */}
                <div className="space-y-2 pt-2">
                  <div className="font-bold text-white text-xs uppercase tracking-wider">
                    Recommended Investigation Steps
                  </div>
                  <div className="space-y-2">
                    {investigationResult.recommendations.map((step) => (
                      <div
                        key={step.step_number}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start space-x-2.5 text-xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {step.step_number}
                        </span>
                        <div className="flex-1">
                          <div className="font-bold text-white">{step.title}</div>
                          <div className="text-slate-300 mt-0.5">{step.action}</div>
                          <div className="text-cyan-300/80 italic text-[11px] mt-1">
                            Reason: {step.reason}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: 👨‍💻 ENGINEER ACTION FORM */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-mono">
                  2
                </span>
                <span>👨‍💻 Engineer Action &amp; Remediation</span>
              </h2>
              <span className="text-[11px] font-mono text-emerald-400">
                Resolution Phase
              </span>
            </div>

            <form onSubmit={handleSaveOutcome} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Action Taken <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="e.g. Rollback configuration to version 2.4.1"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Result <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={result}
                    onChange={(e) => setResult(e.target.value as OutcomeType)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                  >
                    <option value="Successful">Successful</option>
                    <option value="Failed">Failed</option>
                    <option value="Inconclusive">Inconclusive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Root Cause <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="e.g. Incorrect payment configuration deployed without schema validation"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Final Resolution <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={finalResolution}
                  onChange={(e) => setFinalResolution(e.target.value)}
                  placeholder="e.g. Rollback configuration"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>Engineer Feedback</span>
                  <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                </label>
                <textarea
                  rows={2}
                  value={engineerFeedback}
                  onChange={(e) => setEngineerFeedback(e.target.value)}
                  placeholder="Add pre-deployment configuration linter to CI/CD pipeline."
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div className="flex justify-end pt-2">
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
                      <span>Save Outcome</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 4: 🧠 EXPERIENCE LEARNED SUCCESS PANEL */}
      {learnedData && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-2xl space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-indigo-500/20 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                <Brain className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>🧠 EXPERIENCE LEARNED</span>
                </h3>
                <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                  &ldquo;ResolveIQ has learned from this incident.&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigateToIncident(learnedData.incidentId)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center space-x-1"
              >
                <span>View Incident</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </button>
              <button
                onClick={onNavigateToMemory}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center space-x-1"
              >
                <span>View Organizational Memory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <strong className="text-slate-500 uppercase text-[10px]">Root Cause:</strong>
              <div className="text-amber-300 font-medium text-sm">{learnedData.rootCause}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <strong className="text-slate-500 uppercase text-[10px]">Successful Resolution:</strong>
              <div className="text-emerald-400 font-bold text-sm">{learnedData.resolution}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-1 text-xs">
            <strong className="text-indigo-400 uppercase text-[10px] tracking-wider block">
              Lesson Learned:
            </strong>
            <p className="text-slate-200 font-medium leading-relaxed italic text-sm">
              &ldquo;{learnedData.lesson}&rdquo;
            </p>
          </div>

          {/* Memory Status Checkpoints */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap gap-4 text-xs font-mono">
            <span className="text-slate-400">Memory Status:</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reflected</span>
            </span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Retained in Hindsight</span>
            </span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Available for future incidents</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
