export type SeverityType = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentStatusType = 'Open' | 'Reported' | 'Analyzing' | 'Action Pending' | 'Resolved' | 'Closed';
export type OutcomeType = 'Successful' | 'Failed' | 'Inconclusive';

export interface RetainedMemory {
  memory_id: string;
  incident_id: string;
  title: string;
  service: string;
  environment: string;
  severity: SeverityType;
  error_message: string;
  description: string;
  logs?: string;
  root_cause: string;
  final_resolution: string;
  actions_taken: string[];
  failed_approaches: string[];
  outcome: OutcomeType;
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
  severity: SeverityType;
  status: IncidentStatusType;
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
  result?: OutcomeType;
  root_cause?: string;
  final_resolution?: string;
  engineer_feedback?: string;
  lesson?: string;
  retained_in_hindsight: boolean;
  resolved_at?: string;
}

export interface ProblemInvestigateRequest {
  title: string;
  service: string;
  environment: string;
  severity: SeverityType;
  error_message: string;
  what_happened: string;
  logs?: string;
  recent_changes?: string;
}

export interface ProblemInvestigateResponse {
  incident: IncidentModel;
  historical_memory_found: boolean;
  recalled_memories: RetainedMemory[];
  why_relevant?: string;
  summary: string;
  ai_recommendation_summary?: string;
  recommendations: RecommendationStep[];
  likely_causes: LikelyCause[];
}

export interface DashboardStats {
  incidents_remembered: number;
  lessons_learned: number;
  successful_resolutions: number;
  failed_approaches: number;
  total_incidents: number;
  incidents_with_memory: number;
  incidents_without_memory: number;
  hindsight_connected: boolean;
  hindsight_status: string;
}
