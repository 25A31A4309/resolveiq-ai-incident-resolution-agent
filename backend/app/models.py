from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

SeverityType = Literal["Critical", "High", "Medium", "Low"]
IncidentStatusType = Literal["Open", "Reported", "Analyzing", "Action Pending", "Resolved", "Closed"]
OutcomeType = Literal["Successful", "Failed", "Inconclusive"]

class IncidentCreate(BaseModel):
    title: str = Field(..., description="Short title describing the failure")
    service: str = Field(..., description="Affected service or microservice")
    environment: str = Field(default="Production", description="Environment (Production, Staging, etc.)")
    severity: SeverityType = Field(default="High", description="Severity level")
    error_message: str = Field(..., description="Error message, HTTP code, or exception")
    description: str = Field(..., description="Detailed description of symptoms")
    logs: Optional[str] = Field(default=None, description="Optional logs, stack traces, or metrics")
    incident_time: Optional[str] = Field(default=None, description="Reported time of incident")

class ProblemInvestigateRequest(BaseModel):
    title: str
    service: str
    environment: str = "Production"
    severity: SeverityType = "High"
    error_message: str
    what_happened: str
    logs: Optional[str] = None
    recent_changes: Optional[str] = None

class IncidentOutcomeRequest(BaseModel):
    action_taken: str = Field(..., description="The remediation or mitigation step performed by the engineer")
    result: OutcomeType = Field(..., description="Result of the action taken")
    root_cause: str = Field(..., description="The confirmed underlying root cause")
    final_resolution: str = Field(..., description="Permanent or mitigating resolution deployed")
    engineer_feedback: Optional[str] = Field(default="", description="Post-incident observations or follow-ups")

class RecommendationStep(BaseModel):
    step_number: int
    title: str
    action: str
    reason: str
    is_historically_grounded: bool = False
    source_incident_id: Optional[str] = None

class LikelyCause(BaseModel):
    hypothesis: str
    likelihood: Literal["High", "Medium", "Low"]
    basis: str
    is_hypothesis: bool = True

class RetainedMemory(BaseModel):
    memory_id: str
    incident_id: str
    title: str
    service: str
    environment: str
    severity: SeverityType
    error_message: str
    description: str
    logs: Optional[str] = None
    root_cause: str
    final_resolution: str
    actions_taken: List[str] = []
    failed_approaches: List[str] = []
    outcome: OutcomeType
    engineer_feedback: Optional[str] = ""
    lesson: Optional[str] = None
    tags: List[str] = []
    retained_at: datetime = Field(default_factory=datetime.utcnow)
    relevance_tier: Optional[Literal["High relevance", "Relevant memory"]] = None
    similarity_score: Optional[float] = None

class AnalysisResult(BaseModel):
    incident_id: str
    historical_memory_found: bool
    recalled_memories: List[RetainedMemory] = []
    summary: str
    historical_context: Optional[str] = None
    likely_causes: List[LikelyCause] = []
    recommendations: List[RecommendationStep] = []
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)

class LessonModel(BaseModel):
    lesson_id: str
    incident_id: str
    service: str
    title: str
    lesson: str
    root_cause_summary: str
    successful_pattern: str
    avoid_pattern: Optional[str] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class IncidentModel(BaseModel):
    id: str
    title: str
    service: str
    environment: str
    severity: SeverityType
    status: IncidentStatusType = "Reported"
    error_message: str
    description: str
    logs: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Analysis & memory state
    has_analysis: bool = False
    historical_memory_found: bool = False
    recalled_memories: List[RetainedMemory] = []
    analysis: Optional[AnalysisResult] = None
    
    # Outcome state
    action_taken: Optional[str] = None
    result: Optional[OutcomeType] = None
    root_cause: Optional[str] = None
    final_resolution: Optional[str] = None
    engineer_feedback: Optional[str] = None
    
    # Reflection & learning state
    lesson: Optional[str] = None
    retained_in_hindsight: bool = False
    resolved_at: Optional[datetime] = None

class DashboardStats(BaseModel):
    incidents_remembered: int
    lessons_learned: int
    successful_resolutions: int
    failed_approaches: int
    total_incidents: int
    incidents_with_memory: int
    incidents_without_memory: int
    hindsight_connected: bool
    hindsight_status: str
