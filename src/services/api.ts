import {
  IncidentModel,
  AnalysisResult,
  RetainedMemory,
  LessonModel,
  DashboardStats,
  SeverityType,
  OutcomeType,
  ProblemInvestigateRequest,
  ProblemInvestigateResponse,
} from '../types';

const BASE_URL = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${BASE_URL}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to load dashboard stats');
    return res.json();
  },

  async createIncident(data: {
    title: string;
    service: string;
    environment: string;
    severity: SeverityType;
    error_message: string;
    description: string;
    logs?: string;
    incident_time?: string;
  }): Promise<IncidentModel> {
    const res = await fetch(`${BASE_URL}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create incident');
    return res.json();
  },

  async investigateProblem(data: ProblemInvestigateRequest): Promise<ProblemInvestigateResponse> {
    const res = await fetch(`${BASE_URL}/problems/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to investigate problem');
    return res.json();
  },

  async getIncidents(): Promise<IncidentModel[]> {
    const res = await fetch(`${BASE_URL}/incidents`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncident(id: string): Promise<IncidentModel> {
    const res = await fetch(`${BASE_URL}/incidents/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch incident ${id}`);
    return res.json();
  },

  async analyzeIncident(id: string): Promise<AnalysisResult> {
    const res = await fetch(`${BASE_URL}/incidents/${id}/analyze`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to analyze incident ${id}`);
    return res.json();
  },

  async recordOutcome(
    id: string,
    outcome: {
      action_taken: string;
      result: OutcomeType;
      root_cause: string;
      final_resolution: string;
      engineer_feedback?: string;
    }
  ): Promise<{ incident: IncidentModel; lesson: LessonModel; retained_memory: RetainedMemory }> {
    const res = await fetch(`${BASE_URL}/incidents/${id}/outcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outcome),
    });
    if (!res.ok) throw new Error('Failed to record outcome');
    return res.json();
  },

  async getMemories(): Promise<RetainedMemory[]> {
    const res = await fetch(`${BASE_URL}/memory`);
    if (!res.ok) throw new Error('Failed to fetch memories');
    return res.json();
  },

  async searchMemory(query: string, service?: string): Promise<RetainedMemory[]> {
    const params = new URLSearchParams({ q: query });
    if (service) params.set('service', service);
    const res = await fetch(`${BASE_URL}/memory/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search memory');
    return res.json();
  },

  async getLessons(): Promise<LessonModel[]> {
    const res = await fetch(`${BASE_URL}/lessons`);
    if (!res.ok) throw new Error('Failed to fetch lessons');
    return res.json();
  },

  async seedDemo(): Promise<{ status: string; message: string; total_memories: number }> {
    const res = await fetch(`${BASE_URL}/seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed demo data');
    return res.json();
  },

  async resetAll(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${BASE_URL}/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset memory');
    return res.json();
  },
};
