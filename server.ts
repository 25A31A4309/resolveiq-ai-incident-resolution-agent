import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const STORE_FILE = path.join(__dirname, 'hindsight_store.json');

app.use(express.json());

// Initialize Google GenAI if key available
let genai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.warn('Gemini client init warning:', err);
  }
}

// Data structures
export interface RetainedMemory {
  memory_id: string;
  incident_id: string;
  title: string;
  service: string;
  environment: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  error_message: string;
  description: string;
  logs?: string;
  root_cause: string;
  final_resolution: string;
  actions_taken: string[];
  failed_approaches: string[];
  outcome: 'Successful' | 'Failed' | 'Inconclusive';
  engineer_feedback?: string;
  lesson?: string;
  tags: string[];
  retained_at: string;
  relevance_tier?: 'High relevance' | 'Relevant memory';
  similarity_score?: number;
}

export interface LessonModel {
  lesson_id: string;
  incident_id: string;
  service: string;
  title: string;
  lesson: string;
  root_cause_summary: string;
  successful_pattern: string;
  avoid_pattern?: string;
  tags: string[];
  created_at: string;
}

export interface RecommendationStep {
  step_number: number;
  title: string;
  action: string;
  reason: string;
  is_historically_grounded: boolean;
  source_incident_id?: string;
}

export interface LikelyCause {
  hypothesis: string;
  likelihood: 'High' | 'Medium' | 'Low';
  basis: string;
  is_hypothesis: boolean;
}

export interface AnalysisResult {
  incident_id: string;
  historical_memory_found: boolean;
  recalled_memories: RetainedMemory[];
  summary: string;
  historical_context?: string;
  why_relevant?: string;
  likely_causes: LikelyCause[];
  recommendations: RecommendationStep[];
  analyzed_at: string;
}

export interface IncidentModel {
  id: string;
  title: string;
  service: string;
  environment: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Reported' | 'Analyzing' | 'Action Pending' | 'Resolved' | 'Closed';
  error_message: string;
  description: string;
  logs?: string;
  incident_time?: string;
  recent_changes?: string;
  created_at: string;
  updated_at: string;
  has_analysis: boolean;
  historical_memory_found: boolean;
  recalled_memories: RetainedMemory[];
  analysis?: AnalysisResult;
  action_taken?: string;
  result?: 'Successful' | 'Failed' | 'Inconclusive';
  root_cause?: string;
  final_resolution?: string;
  engineer_feedback?: string;
  lesson?: string;
  retained_in_hindsight: boolean;
  resolved_at?: string;
}

// Memory Store & State
let memories: RetainedMemory[] = [];
let lessons: LessonModel[] = [];
const incidentsDb: Map<string, IncidentModel> = new Map();

function loadStore() {
  if (fs.existsSync(STORE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
      memories = data.memories || [];
      lessons = data.lessons || [];
      console.log(`[Hindsight] Loaded ${memories.length} memories, ${lessons.length} lessons from store.`);
    } catch (err) {
      console.error('[Hindsight] Error reading store:', err);
      memories = [];
      lessons = [];
    }
  } else {
    memories = [];
    lessons = [];
  }
}

function saveStore() {
  try {
    fs.writeFileSync(
      STORE_FILE,
      JSON.stringify(
        {
          agent_id: process.env.HINDSIGHT_AGENT_ID || 'resolveiq-sre-agent',
          updated_at: new Date().toISOString(),
          memories,
          lessons,
        },
        null,
        2
      )
    );
  } catch (err) {
    console.error('[Hindsight] Error writing store:', err);
  }
}

loadStore();

// Tokenizer & Scorer for Hindsight Recall
function tokenize(text: string): Set<string> {
  if (!text) return new Set();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/[\s_\-/:]+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

// Hindsight Operations
async function hindsightRecall(query: string, service?: string, threshold = 0.3): Promise<RetainedMemory[]> {
  if (memories.length === 0) {
    return [];
  }

  const queryTokens = tokenize(query);
  const scored: { score: number; mem: RetainedMemory }[] = [];

  for (const mem of memories) {
    const docText = `${mem.title} ${mem.service} ${mem.error_message} ${mem.description} ${mem.root_cause} ${mem.final_resolution}`;
    const docTokens = tokenize(docText);

    let matchCount = 0;
    for (const t of queryTokens) {
      if (docTokens.has(t)) matchCount++;
    }

    if (matchCount === 0) continue;

    let score = matchCount / Math.max(queryTokens.size, 1);

    // Boost for exact service match
    if (service && mem.service.toLowerCase() === service.toLowerCase()) {
      score += 0.35;
    }

    // Boost if error message keywords overlap
    const errTokens = tokenize(mem.error_message);
    for (const t of errTokens) {
      if (queryTokens.has(t)) {
        score += 0.2;
        break;
      }
    }

    if (score >= threshold) {
      const tier: 'High relevance' | 'Relevant memory' = score >= 0.6 ? 'High relevance' : 'Relevant memory';
      scored.push({
        score,
        mem: {
          ...mem,
          relevance_tier: tier,
          similarity_score: Math.min(Math.round(score * 100) / 100, 1.0),
        },
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map((s) => s.mem);
}

async function hindsightRetain(data: Omit<RetainedMemory, 'memory_id' | 'retained_at'>): Promise<RetainedMemory> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const memory_id = `MEM-${dateStr}-${String(memories.length + 1).padStart(3, '0')}`;
  const record: RetainedMemory = {
    ...data,
    memory_id,
    retained_at: new Date().toISOString(),
    tags: Array.from(new Set([...(data.tags || []), data.service.toLowerCase()])),
  };
  memories.push(record);
  saveStore();
  return record;
}

async function hindsightReflect(
  incidentData: Partial<IncidentModel>,
  feedback: string = ''
): Promise<LessonModel> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lesson_id = `LES-${dateStr}-${String(lessons.length + 1).padStart(3, '0')}`;

  const service = incidentData.service || 'General';
  const title = incidentData.title || 'Incident';
  const rootCause = incidentData.root_cause || 'Root cause identified';
  const resolution = incidentData.final_resolution || 'Applied mitigation';
  const feedbackPart = feedback ? ` Note: ${feedback}.` : '';

  // Use Gemini if available for richer reflection synthesis
  let lessonText = `For recurring ${service} incidents exhibiting symptoms of '${title}', first inspect for ${rootCause.toLowerCase()}. Verified successful remediation is to ${resolution.toLowerCase()}.${feedbackPart}`;

  if (genai) {
    try {
      const response = await genai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an expert Site Reliability Engineering (SRE) reflection agent.
Synthesize a concise, high-impact, reusable organizational lesson (1-2 sentences) from this resolved production outage:
- Service: ${service}
- Outage: ${title}
- Error: ${incidentData.error_message}
- Root Cause: ${rootCause}
- Successful Resolution: ${resolution}
- Engineer Feedback: ${feedback}
Output ONLY the lesson text starting with: "For recurring..." without markdown wrapping.`,
      });
      if (response.text && response.text.trim().length > 20) {
        lessonText = response.text.trim();
      }
    } catch (e) {
      console.warn('Gemini reflection fallback to deterministic lesson:', e);
    }
  }

  const lesson: LessonModel = {
    lesson_id,
    incident_id: incidentData.id || '',
    service,
    title: `Lesson from: ${title}`,
    lesson: lessonText,
    root_cause_summary: rootCause,
    successful_pattern: resolution,
    tags: [service.toLowerCase(), 'remediation', 'sre-best-practice'],
    created_at: new Date().toISOString(),
  };

  lessons.push(lesson);
  saveStore();
  return lesson;
}

// AI Investigation Reasoning Engine
async function reasonIncidentInvestigation(
  incident: IncidentModel,
  historicalMemories: RetainedMemory[]
): Promise<Omit<AnalysisResult, 'incident_id' | 'analyzed_at'>> {
  const hasHistory = historicalMemories.length > 0;
  const service = incident.service;
  const title = incident.title;
  const errorMsg = incident.error_message;

  // If Gemini is available, generate contextual analysis grounded in historical memories
  if (genai) {
    try {
      const systemInstruction = `You are ResolveIQ, an elite AI Incident Resolution Agent for DevOps/SRE teams.
CRITICAL RULES:
1. Grounding: If Historical Memory is provided, you MUST explicitly reference past incident resolutions and explain that this has been solved before.
2. If NO Historical Memory is provided, you MUST state "No relevant historical memory found. This appears to be a new organizational incident." Never fabricate past incidents.
3. Clearly distinguish Historical Facts from AI Hypotheses. Label likely causes as hypotheses.
4. Output STRICT JSON with keys:
{
  "summary": string,
  "historical_context": string or null,
  "likely_causes": [
    { "hypothesis": string, "likelihood": "High" | "Medium" | "Low", "basis": string, "is_hypothesis": true }
  ],
  "recommendations": [
    { "step_number": number, "title": string, "action": string, "reason": string, "is_historically_grounded": boolean, "source_incident_id": string or null }
  ]
}`;

      const userContent = JSON.stringify({
        current_incident: {
          title: incident.title,
          service: incident.service,
          environment: incident.environment,
          severity: incident.severity,
          error_message: incident.error_message,
          description: incident.description,
          logs: incident.logs,
        },
        hindsight_recalled_memories: historicalMemories.map((m) => ({
          incident_id: m.incident_id,
          title: m.title,
          service: m.service,
          root_cause: m.root_cause,
          final_resolution: m.final_resolution,
          failed_approaches: m.failed_approaches,
          outcome: m.outcome,
          lesson: m.lesson,
        })),
      });

      const response = await genai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nIncident Data:\n${userContent}` }] },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          historical_memory_found: hasHistory,
          recalled_memories: historicalMemories,
          summary: parsed.summary,
          historical_context: hasHistory ? (parsed.historical_context || null) : null,
          likely_causes: parsed.likely_causes || [],
          recommendations: parsed.recommendations || [],
        };
      }
    } catch (e) {
      console.warn('Gemini reasoning fallback to deterministic analysis:', e);
    }
  }

  // Deterministic rule-based investigation synthesis (when offline / no API key)
  if (hasHistory) {
    const top = historicalMemories[0];
    const summary = `Incident investigation for ${service} alert '${title}'. Hindsight organizational memory identified ${historicalMemories.length} similar previous incident(s). Previous successful remediation: "${top.final_resolution}".`;

    const historical_context = `Previous incident ${top.incident_id} on service '${top.service}' presented identical error patterns ('${top.error_message}'). Confirmed root cause was "${top.root_cause}". Successfully resolved by: "${top.final_resolution}".${
      top.failed_approaches?.length ? ` Note: [${top.failed_approaches.join(', ')}] was previously attempted and failed.` : ''
    }`;

    const likely_causes: LikelyCause[] = [
      {
        hypothesis: top.root_cause,
        likelihood: 'High',
        basis: `Direct match with historical incident ${top.incident_id} under identical service and error conditions.`,
        is_hypothesis: true,
      },
      {
        hypothesis: 'Upstream connection backpressure or network socket exhaustion',
        likelihood: 'Medium',
        basis: 'Typical secondary cascade effect in high-throughput microservices.',
        is_hypothesis: true,
      },
      {
        hypothesis: 'Deployment regression or rolling update drift',
        likelihood: 'Low',
        basis: 'Standard configuration risk in production cluster.',
        is_hypothesis: true,
      },
    ];

    const recommendations: RecommendationStep[] = [
      {
        step_number: 1,
        title: `Execute verified resolution: ${top.final_resolution}`,
        action: `Perform verified action: ${top.final_resolution}`,
        reason: `A previous similar incident (${top.incident_id}) was resolved by this exact action after root cause '${top.root_cause}'.`,
        is_historically_grounded: true,
        source_incident_id: top.incident_id,
      },
      {
        step_number: 2,
        title: `Verify ${service} connection pool health and saturation`,
        action: `Inspect connection pool gauges and active thread capacity for ${service}.`,
        reason: `Corroborates whether current symptoms match historical incident ${top.incident_id}.`,
        is_historically_grounded: true,
        source_incident_id: top.incident_id,
      },
      ...(top.failed_approaches?.length
        ? [
            {
              step_number: 3,
              title: `Avoid previously failed approaches: ${top.failed_approaches.join(', ')}`,
              action: `Do NOT attempt: ${top.failed_approaches.join(', ')}.`,
              reason: 'Historical organizational memory records indicate these steps were ineffective.',
              is_historically_grounded: true,
              source_incident_id: top.incident_id,
            },
          ]
        : []),
      {
        step_number: top.failed_approaches?.length ? 4 : 3,
        title: 'Execute synthetic health probes',
        action: 'Validate latency and response code metrics across dependent paths.',
        reason: 'Confirm service stabilization and ensure 0% error rate across traffic endpoints.',
        is_historically_grounded: false,
      },
    ];

    return {
      historical_memory_found: true,
      recalled_memories: historicalMemories,
      summary,
      historical_context,
      likely_causes,
      recommendations,
    };
  } else {
    // SCENARIO B: NO RELEVANT MEMORY FOUND
    const summary = `Incident investigation for ${service} alert '${title}'. No relevant historical memory found in Hindsight. This appears to be a new incident for your organization. Generating baseline diagnostic investigation path.`;

    const likely_causes: LikelyCause[] = [
      {
        hypothesis: 'Database or backing dependency connection pool saturation',
        likelihood: 'Medium',
        basis: `Standard failure mode causing '${errorMsg}' when database connection limits are exceeded.`,
        is_hypothesis: true,
      },
      {
        hypothesis: 'Recent deployment or configuration variable drift',
        likelihood: 'Medium',
        basis: 'Recent deployment changes or secrets rotation frequently trigger gateway errors.',
        is_hypothesis: true,
      },
      {
        hypothesis: 'Resource exhaustion (CPU throttling or container OOMKilled)',
        likelihood: 'Low',
        basis: 'Memory leaks or sudden concurrency spikes causing pod restarts.',
        is_hypothesis: true,
      },
    ];

    const recommendations: RecommendationStep[] = [
      {
        step_number: 1,
        title: 'Check database connection pool health',
        action: `Inspect database active connection metrics and pool utilization for ${service}.`,
        reason: 'Gateway and service errors commonly occur when connection pool starvation stalls worker threads.',
        is_historically_grounded: false,
      },
      {
        step_number: 2,
        title: 'Verify recent deployment changes',
        action: `Review recent deployment rollouts and image tags for ${service} within the past 2 hours.`,
        reason: 'Recent configuration or code updates can introduce regression or misconfigured timeouts.',
        is_historically_grounded: false,
      },
      {
        step_number: 3,
        title: 'Inspect API gateway and edge proxy logs',
        action: `Filter gateway ingress logs for HTTP status codes matching '${errorMsg}'.`,
        reason: 'Determine whether failure originates at edge proxy, service mesh, or backend container.',
        is_historically_grounded: false,
      },
      {
        step_number: 4,
        title: 'Check dependent microservice latencies',
        action: 'Check distributed tracing spans (OpenTelemetry/Jaeger) for downstream service bottlenecks.',
        reason: 'Cascading latency in downstream dependencies often bubbles up as gateway timeout/bad gateway.',
        is_historically_grounded: false,
      },
    ];

    return {
      historical_memory_found: false,
      recalled_memories: [],
      summary,
      historical_context: undefined,
      likely_causes,
      recommendations,
    };
  }
}

// API Routes
app.get('/api/health', async (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'ResolveIQ',
    tagline: 'Remember. Reflect. Resolve Better.',
    hindsight: {
      connected: true,
      mode: process.env.HINDSIGHT_API_URL ? 'remote' : 'embedded',
      status: 'Hindsight Connected',
    },
    memories_count: memories.length,
    lessons_count: lessons.length,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/incidents', (req: Request, res: Response) => {
  const { title, service, environment, severity, error_message, description, logs, incident_time } = req.body;
  if (!title || !service || !error_message || !description) {
    return res.status(400).json({ error: 'Missing required incident fields' });
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const id = `INC-${dateStr}-${String(incidentsDb.size + 1).padStart(3, '0')}`;

  const incident: IncidentModel = {
    id,
    title,
    service,
    environment: environment || 'Production',
    severity: severity || 'High',
    status: 'Open',
    error_message,
    description,
    logs: logs || '',
    incident_time: incident_time || new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_analysis: false,
    historical_memory_found: false,
    recalled_memories: [],
    retained_in_hindsight: false,
  };

  incidentsDb.set(id, incident);
  res.status(201).json(incident);
});

app.post('/api/problems/investigate', async (req: Request, res: Response) => {
  const { title, service, environment, severity, error_message, what_happened, logs, recent_changes } = req.body;
  if (!title || !service || !error_message || !what_happened) {
    return res.status(400).json({ error: 'Title, service, error message, and what happened are required.' });
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const id = `INC-${dateStr}-${String(incidentsDb.size + 1).padStart(3, '0')}`;

  // STEP 1: HINDSIGHT RECALL FIRST
  const query = `${title} ${error_message} ${what_happened} ${recent_changes || ''}`;
  const recalledMemories = await hindsightRecall(query, service);

  const incident: IncidentModel = {
    id,
    title,
    service,
    environment: environment || 'Production',
    severity: severity || 'High',
    status: 'Analyzing',
    error_message,
    description: what_happened,
    logs: logs || '',
    recent_changes: recent_changes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_analysis: true,
    historical_memory_found: recalledMemories.length > 0,
    recalled_memories: recalledMemories,
    retained_in_hindsight: false,
  };

  // STEP 2: AI REASONING (Grounds on Hindsight memories if found; otherwise generic hypotheses)
  const analysisData = await reasonIncidentInvestigation(incident, recalledMemories);

  let why_relevant = '';
  let ai_recommendation_summary = '';

  if (recalledMemories.length > 0) {
    const top = recalledMemories[0];
    why_relevant = `A past outage on service '${top.service}' (${top.incident_id}) involved identical failure symptoms '${top.error_message}'. Confirmed root cause was ${top.root_cause}, and resolution was verified via ${top.final_resolution}.`;
    ai_recommendation_summary = `Based on a previous incident with similar symptoms, inspect ${top.root_cause} and verify ${top.final_resolution} first.`;
  } else {
    ai_recommendation_summary = `ResolveIQ does not have previous organizational experience for this problem. Formulating baseline diagnostic investigation from available technical telemetry.`;
  }

  const fullAnalysis: AnalysisResult = {
    ...analysisData,
    incident_id: id,
    why_relevant: why_relevant || undefined,
    analyzed_at: new Date().toISOString(),
  };

  incident.analysis = fullAnalysis;
  incident.status = 'Action Pending';
  incidentsDb.set(id, incident);

  res.json({
    incident,
    historical_memory_found: recalledMemories.length > 0,
    recalled_memories: recalledMemories,
    why_relevant: why_relevant || undefined,
    summary: analysisData.summary,
    ai_recommendation_summary,
    recommendations: analysisData.recommendations,
    likely_causes: analysisData.likely_causes,
  });
});

app.get('/api/incidents', (_req: Request, res: Response) => {
  const list = Array.from(incidentsDb.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json(list);
});

app.get('/api/incidents/:id', (req: Request, res: Response) => {
  const incident = incidentsDb.get(req.params.id);
  if (!incident) {
    return res.status(404).json({ error: `Incident ${req.params.id} not found` });
  }
  res.json(incident);
});

app.post('/api/incidents/:id/analyze', async (req: Request, res: Response) => {
  const incident = incidentsDb.get(req.params.id);
  if (!incident) {
    return res.status(404).json({ error: `Incident ${req.params.id} not found` });
  }

  incident.status = 'Analyzing';

  // 1. Build recall query
  const query = `${incident.title} ${incident.error_message} ${incident.description}`;

  // 2. Query Hindsight organizational memory
  const recalledMemories = await hindsightRecall(query, incident.service);

  // 3. AI Reasoning
  const analysisData = await reasonIncidentInvestigation(incident, recalledMemories);

  const fullAnalysis: AnalysisResult = {
    ...analysisData,
    incident_id: incident.id,
    analyzed_at: new Date().toISOString(),
  };

  incident.has_analysis = true;
  incident.historical_memory_found = fullAnalysis.historical_memory_found;
  incident.recalled_memories = fullAnalysis.recalled_memories;
  incident.analysis = fullAnalysis;
  incident.status = 'Action Pending';
  incident.updated_at = new Date().toISOString();

  res.json(fullAnalysis);
});

app.post('/api/incidents/:id/outcome', async (req: Request, res: Response) => {
  const incident = incidentsDb.get(req.params.id);
  if (!incident) {
    return res.status(404).json({ error: `Incident ${req.params.id} not found` });
  }

  const { action_taken, result, root_cause, final_resolution, engineer_feedback } = req.body;
  if (!action_taken || !result || !root_cause || !final_resolution) {
    return res.status(400).json({ error: 'Action taken, result, root cause, and final resolution are required' });
  }

  incident.action_taken = action_taken;
  incident.result = result;
  incident.root_cause = root_cause;
  incident.final_resolution = final_resolution;
  incident.engineer_feedback = engineer_feedback || '';
  incident.updated_at = new Date().toISOString();

  // Trigger Hindsight Reflect & Retain learning loop
  const lesson = await hindsightReflect(incident, engineer_feedback);

  const retainedMemory = await hindsightRetain({
    incident_id: incident.id,
    title: incident.title,
    service: incident.service,
    environment: incident.environment,
    severity: incident.severity,
    error_message: incident.error_message,
    description: incident.description,
    logs: incident.logs,
    root_cause,
    final_resolution,
    actions_taken: [action_taken],
    failed_approaches: [],
    outcome: result,
    engineer_feedback: engineer_feedback || '',
    lesson: lesson.lesson,
    tags: [incident.service.toLowerCase(), 'incident-experience', result.toLowerCase()],
  });

  incident.lesson = lesson.lesson;
  incident.retained_in_hindsight = true;
  incident.status = 'Resolved';
  incident.resolved_at = new Date().toISOString();

  res.json({
    incident,
    lesson,
    retained_memory: retainedMemory,
    message: 'Incident outcome saved and experience retained in Hindsight organizational memory',
  });
});

app.post('/api/incidents/:id/learn', async (req: Request, res: Response) => {
  const incident = incidentsDb.get(req.params.id);
  if (!incident) {
    return res.status(404).json({ error: `Incident ${req.params.id} not found` });
  }

  if (!incident.root_cause || !incident.final_resolution) {
    return res.status(400).json({ error: 'Root cause and final resolution must be recorded before learning' });
  }

  const lesson = await hindsightReflect(incident, incident.engineer_feedback);
  incident.lesson = lesson.lesson;
  incident.retained_in_hindsight = true;
  incident.status = 'Resolved';
  incident.resolved_at = new Date().toISOString();

  res.json({ lesson });
});

app.get('/api/memory', (_req: Request, res: Response) => {
  res.json(memories);
});

app.get('/api/memory/search', async (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const service = req.query.service as string | undefined;
  if (!query) {
    return res.json(memories);
  }
  const results = await hindsightRecall(query, service, 0.15);
  res.json(results);
});

app.get('/api/lessons', (_req: Request, res: Response) => {
  res.json(lessons);
});

app.get('/api/dashboard/stats', (_req: Request, res: Response) => {
  const successfulResolutions = memories.filter((m) => m.outcome === 'Successful').length;
  const failedApproaches = memories.reduce((acc, m) => acc + (m.failed_approaches?.length || 0), 0);
  const incidentsList = Array.from(incidentsDb.values());
  const withMemory = incidentsList.filter((i) => i.historical_memory_found).length;
  const withoutMemory = incidentsList.filter((i) => i.has_analysis && !i.historical_memory_found).length;

  res.json({
    incidents_remembered: memories.length,
    lessons_learned: lessons.length,
    successful_resolutions: successfulResolutions,
    failed_approaches: failedApproaches,
    total_incidents: incidentsList.length,
    incidents_with_memory: withMemory,
    incidents_without_memory: withoutMemory,
    hindsight_connected: true,
    hindsight_status: 'Hindsight Connected',
  });
});

app.post('/api/seed', async (_req: Request, res: Response) => {
  const demoScenarios = [
    {
      incident_id: 'INC-20260810-001',
      title: 'Payment API 502 Bad Gateway',
      service: 'payment-api',
      environment: 'Production',
      severity: 'High' as const,
      error_message: '502 Bad Gateway: Upstream pool exhausted',
      description: 'Payment authorization endpoint dropped to 12% success rate due to thread backpressure.',
      root_cause: 'Database connection pool exhaustion caused by unclosed cursor leaks',
      final_resolution: 'Reset database connection pool and patched ORM connection leak',
      actions_taken: ['Reset DB pool', 'Deployed ORM cursor fix'],
      failed_approaches: ['Restarted payment-api ingress proxy', 'Flushed Redis token cache'],
      outcome: 'Successful' as const,
      engineer_feedback: 'Monitor connection pool metrics closely during flash checkout campaigns.',
      tags: ['payment-api', 'database', 'connection-pool'],
    },
    {
      incident_id: 'INC-20260814-002',
      title: 'API Gateway 504 Gateway Timeout',
      service: 'api-gateway',
      environment: 'Production',
      severity: 'High' as const,
      error_message: '504 Gateway Timeout: auth-service unresponsive',
      description: 'User requests hanging at public API gateway boundary during peak login surge.',
      root_cause: 'Backend auth-service CPU throttling and thread pool saturation',
      final_resolution: 'Scaled auth-service HPA minimum replicas from 2 to 6',
      actions_taken: ['Scaled auth-service replicas', 'Applied circuit breaker on non-critical auth routes'],
      failed_approaches: ['Increased ingress proxy timeout without backend scaling'],
      outcome: 'Successful' as const,
      engineer_feedback: 'Adjust HPA target CPU utilization to 65% instead of 85%.',
      tags: ['api-gateway', 'auth-service', 'timeout'],
    },
    {
      incident_id: 'INC-20260822-003',
      title: 'Authentication Token Rotation Failure',
      service: 'auth-service',
      environment: 'Production',
      severity: 'Critical' as const,
      error_message: '401 Unauthorized: Invalid JWT signature',
      description: 'All mobile and web users intermittently logged out upon token refresh.',
      root_cause: 'Expired service credentials and async JWKS key synchronization delay',
      final_resolution: 'Promoted standby JWKS key in KMS and triggered credential sync',
      actions_taken: ['Synced JWKS keys across all availability zones', 'Purged stale token cache'],
      failed_approaches: ['Reverted latest container image build'],
      outcome: 'Successful' as const,
      engineer_feedback: 'Automate proactive rotation checks 72h ahead of key expiry.',
      tags: ['auth-service', 'jwt', 'security'],
    },
  ];

  const added = [];
  for (const demo of demoScenarios) {
    const mem = await hindsightRetain(demo);
    await hindsightReflect(demo, demo.engineer_feedback);
    added.push(mem);
  }

  res.json({
    status: 'seeded',
    message: `Seeded ${added.length} synthetic incidents into Hindsight organizational memory`,
    total_memories: memories.length,
  });
});

app.post('/api/reset', (_req: Request, res: Response) => {
  memories = [];
  lessons = [];
  incidentsDb.clear();
  if (fs.existsSync(STORE_FILE)) {
    try {
      fs.unlinkSync(STORE_FILE);
    } catch {}
  }
  res.json({ status: 'reset', message: 'All memories, lessons, and incidents reset to 0' });
});

// Vite Middleware for dev or static in prod
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ResolveIQ] Full-stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ResolveIQ] Server startup failed:', err);
});
