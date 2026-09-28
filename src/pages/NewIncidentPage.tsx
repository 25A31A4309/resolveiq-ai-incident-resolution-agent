import React, { useState } from 'react';
import {
  PlusCircle,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { SeverityType } from '../types';
import { api } from '../services/api';

interface NewIncidentPageProps {
  onIncidentCreated: (incidentId: string) => void;
  presetData?: {
    title: string;
    service: string;
    environment: string;
    severity: SeverityType;
    error_message: string;
    description: string;
    logs?: string;
    incident_time?: string;
  } | null;
}

export const NewIncidentPage: React.FC<NewIncidentPageProps> = ({
  onIncidentCreated,
  presetData,
}) => {
  const [title, setTitle] = useState(presetData?.title || '');
  const [service, setService] = useState(presetData?.service || '');
  const [environment, setEnvironment] = useState(presetData?.environment || 'Production');
  const [severity, setSeverity] = useState<SeverityType>(presetData?.severity || 'High');
  const [errorMessage, setErrorMessage] = useState(presetData?.error_message || '');
  const [description, setDescription] = useState(presetData?.description || '');
  const [logs, setLogs] = useState(presetData?.logs || '');
  const [incidentTime, setIncidentTime] = useState(
    presetData?.incident_time || new Date().toISOString().slice(0, 16)
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const applyPreset = (preset: {
    title: string;
    service: string;
    environment: string;
    severity: SeverityType;
    error_message: string;
    description: string;
    logs: string;
  }) => {
    setTitle(preset.title);
    setService(preset.service);
    setEnvironment(preset.environment);
    setSeverity(preset.severity);
    setErrorMessage(preset.error_message);
    setDescription(preset.description);
    setLogs(preset.logs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !service.trim() || !errorMessage.trim() || !description.trim()) {
      setErrorNotice('Please fill in all required fields (Title, Service, Error Message, and Description).');
      return;
    }

    setSubmitting(true);
    setErrorNotice(null);

    try {
      // 1. Create real incident in backend with status "Open"
      const created = await api.createIncident({
        title: title.trim(),
        service: service.trim(),
        environment: environment.trim(),
        severity,
        error_message: errorMessage.trim(),
        description: description.trim(),
        logs: logs.trim() || undefined,
        incident_time: incidentTime,
      });

      // 2. Navigate to the incident investigation page (does not retain to Hindsight yet)
      onIncidentCreated(created.id);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to create incident');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Incident Reporting &amp; Intake</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">➕ Add New Incident</h1>
          <p className="text-xs text-slate-400 mt-1">
            Register and declare an active production outage. The incident is saved with status{' '}
            <span className="font-mono text-cyan-300 font-semibold">&ldquo;Open&rdquo;</span>.
          </p>
        </div>

        {/* Quick Demo Scenario Loaders */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] text-slate-400 font-mono">Example Presets:</span>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                title: 'Payment API returning 502',
                service: 'payment-api',
                environment: 'Production',
                severity: 'High',
                error_message: '502 Bad Gateway: Upstream connection refused',
                description:
                  'Customers are unable to complete payments at checkout. Transactions fail intermittently with HTTP 502 Bad Gateway errors.',
                logs: `[error] 2026-09-27T12:04:11.234Z client_ip=192.168.1.42 POST /api/v1/charge -> 502 Bad Gateway\n[crit]  upstream_connect_timed_out: socket hang up waiting for payment-worker:5432\n[warn]  pool_stat: active_connections=100 max_connections=100 queue_depth=48`,
              })
            }
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono border border-slate-700 transition-colors"
          >
            Payment 502 Outage
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                title: 'Database connection pool saturation',
                service: 'order-service',
                environment: 'Production',
                severity: 'Critical',
                error_message: 'FATAL: remaining connection slots are reserved for non-replication superuser connections',
                description:
                  'Order processing workers unable to check out Postgres connection. Queue length growing rapidly.',
                logs: `[crit] ConnectionPoolTimeoutException: Timeout waiting for connection from pool after 30000ms`,
              })
            }
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-mono border border-slate-700 transition-colors"
          >
            DB Pool Outage
          </button>
        </div>
      </div>

      {/* Lifecycle Notice Banner */}
      <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-slate-300 flex items-start space-x-3">
        <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-cyan-300 font-semibold">Incident Lifecycle Notice:</strong> Creating an incident registers it as an active{' '}
          <span className="font-mono text-cyan-300 font-semibold">Open</span> incident. It does{' '}
          <strong>not</strong> automatically become a Hindsight memory yet. Retaining the complete experience in Hindsight occurs only after investigation, actions taken, confirmed root cause, and verified outcome.
        </div>
      </div>

      {errorNotice && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Main Incident Intake Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          {/* Incident Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Incident Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Payment API returning 502"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              required
            />
          </div>

          {/* Grid Row: Service, Environment, Severity, Incident Time */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityType)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-cyan-400 transition-colors"
              >
                <option value="Critical" className="text-rose-400">Critical (Sev-1 / Major Outage)</option>
                <option value="High" className="text-amber-400">High (Sev-2 / Major Degradation)</option>
                <option value="Medium" className="text-blue-400">Medium (Sev-3 / Partial)</option>
                <option value="Low" className="text-slate-400">Low (Sev-4 / Minor)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Incident Time
              </label>
              <input
                type="datetime-local"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          {/* Error Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Error Message / HTTP Code <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="e.g. 502 Bad Gateway"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-rose-300 placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-cyan-400 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Customers are unable to complete payments at checkout."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              required
            />
          </div>

          {/* Logs / Additional Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Logs / Additional Details</span>
              <span className="text-[11px] text-slate-500 font-mono">Optional</span>
            </label>
            <textarea
              rows={4}
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              placeholder="Paste stack traces, proxy logs, or metric alerts..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Saves incident with status &ldquo;Open&rdquo; and opens the investigation workspace.</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 border border-blue-400/30 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Registering Incident...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Create Incident</span>
                <ArrowRight className="w-4 h-4 text-cyan-300" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
