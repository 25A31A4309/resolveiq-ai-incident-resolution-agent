import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from datetime import datetime

from .models import (
    IncidentCreate, IncidentModel, IncidentOutcomeRequest,
    AnalysisResult, RetainedMemory, LessonModel, DashboardStats
)
from .services.hindsight_service import hindsight_service
from .services.incident_agent import incident_agent

app = FastAPI(
    title="ResolveIQ - AI Incident Resolution Agent API",
    description="Backend API powered by Hindsight organizational memory for SRE/DevOps incident resolution.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for incidents during session
incidents_db: Dict[str, IncidentModel] = {}

@app.get("/health")
async def health_check():
    h_health = await hindsight_service.check_health()
    mem_count = len(hindsight_service.get_all_memories())
    return {
        "status": "ok",
        "app": "ResolveIQ",
        "hindsight": h_health,
        "memories_count": mem_count,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/incidents", response_model=IncidentModel)
async def create_incident(payload: IncidentCreate):
    inc_id = f"INC-{datetime.utcnow().strftime('%Y%m%d')}-{len(incidents_db) + 1:03d}"
    incident = IncidentModel(
        id=inc_id,
        title=payload.title,
        service=payload.service,
        environment=payload.environment,
        severity=payload.severity,
        error_message=payload.error_message,
        description=payload.description,
        logs=payload.logs,
        status="Open",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    incidents_db[inc_id] = incident
    return incident

@app.post("/problems/investigate")
async def investigate_problem(payload: dict):
    title = payload.get("title", "")
    service = payload.get("service", "")
    environment = payload.get("environment", "Production")
    severity = payload.get("severity", "High")
    error_message = payload.get("error_message", "")
    what_happened = payload.get("what_happened", "")
    logs = payload.get("logs")
    recent_changes = payload.get("recent_changes")

    inc_id = f"INC-{datetime.utcnow().strftime('%Y%m%d')}-{len(incidents_db) + 1:03d}"

    # 1. Hindsight Recall First
    query = f"{title} {error_message} {what_happened} {recent_changes or ''}"
    recalled = await hindsight_service.recall(query=query, service=service)

    incident_dict = {
        "id": inc_id,
        "title": title,
        "service": service,
        "environment": environment,
        "severity": severity,
        "status": "Analyzing",
        "error_message": error_message,
        "description": what_happened,
        "logs": logs,
        "recent_changes": recent_changes,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    # 2. AI Reasoning
    recalled_dicts = [m.model_dump() for m in recalled]
    from .services.llm_service import llm_service
    analysis_data = await llm_service.generate_investigation(incident_dict, recalled_dicts)

    why_relevant = None
    if len(recalled) > 0:
        top = recalled[0]
        why_relevant = f"Past incident on service '{top.service}' ({top.incident_id}) had identical symptom '{top.error_message}'. Root cause was {top.root_cause} with resolution {top.final_resolution}."
        ai_recommendation_summary = f"Based on a previous incident with similar symptoms, inspect {top.root_cause} and verify {top.final_resolution} first."
    else:
        ai_recommendation_summary = "ResolveIQ does not have previous organizational experience for this problem. Formulating baseline diagnostic investigation from available technical telemetry."

    incident = IncidentModel(
        id=inc_id,
        title=title,
        service=service,
        environment=environment,
        severity=severity,
        error_message=error_message,
        description=what_happened,
        logs=logs,
        status="Action Pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        has_analysis=True,
        historical_memory_found=len(recalled) > 0,
        recalled_memories=recalled
    )
    incidents_db[inc_id] = incident

    return {
        "incident": incident,
        "historical_memory_found": len(recalled) > 0,
        "recalled_memories": recalled,
        "why_relevant": why_relevant,
        "summary": analysis_data.get("summary", ""),
        "ai_recommendation_summary": ai_recommendation_summary,
        "recommendations": analysis_data.get("recommendations", []),
        "likely_causes": analysis_data.get("likely_causes", [])
    }

@app.get("/incidents", response_model=List[IncidentModel])
async def list_incidents():
    return list(incidents_db.values())

@app.get("/incidents/{incident_id}", response_model=IncidentModel)
async def get_incident(incident_id: str):
    if incident_id not in incidents_db:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return incidents_db[incident_id]

@app.post("/incidents/{incident_id}/analyze", response_model=AnalysisResult)
async def analyze_incident(incident_id: str):
    if incident_id not in incidents_db:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    
    incident = incidents_db[incident_id]
    incident.status = "Analyzing"
    
    analysis = await incident_agent.analyze_incident(incident.model_dump())
    
    incident.has_analysis = True
    incident.historical_memory_found = analysis.historical_memory_found
    incident.recalled_memories = analysis.recalled_memories
    incident.analysis = analysis
    incident.status = "Action Pending"
    incident.updated_at = datetime.utcnow()
    
    return analysis

@app.post("/incidents/{incident_id}/outcome")
async def record_outcome(incident_id: str, payload: IncidentOutcomeRequest):
    if incident_id not in incidents_db:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    
    incident = incidents_db[incident_id]
    incident.action_taken = payload.action_taken
    incident.result = payload.result
    incident.root_cause = payload.root_cause
    incident.final_resolution = payload.final_resolution
    incident.engineer_feedback = payload.engineer_feedback
    incident.updated_at = datetime.utcnow()
    
    # Automatically execute learning and retention loop
    learn_res = await incident_agent.learn_from_incident(
        incident=incident.model_dump(),
        outcome_data=payload.model_dump()
    )
    
    incident.lesson = learn_res["lesson"].lesson
    incident.retained_in_hindsight = True
    incident.status = "Resolved"
    incident.resolved_at = datetime.utcnow()
    
    return {
        "incident": incident,
        "lesson": learn_res["lesson"],
        "retained_memory": learn_res["retained_memory"],
        "message": "Incident outcome recorded and retained into Hindsight organizational memory"
    }

@app.post("/incidents/{incident_id}/learn")
async def learn_from_incident_endpoint(incident_id: str):
    if incident_id not in incidents_db:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    
    incident = incidents_db[incident_id]
    if not incident.root_cause or not incident.final_resolution:
        raise HTTPException(status_code=400, detail="Cannot learn without root cause and final resolution")
        
    outcome_data = {
        "action_taken": incident.action_taken or "Resolved",
        "result": incident.result or "Successful",
        "root_cause": incident.root_cause,
        "final_resolution": incident.final_resolution,
        "engineer_feedback": incident.engineer_feedback or ""
    }
    
    learn_res = await incident_agent.learn_from_incident(
        incident=incident.model_dump(),
        outcome_data=outcome_data
    )
    
    incident.lesson = learn_res["lesson"].lesson
    incident.retained_in_hindsight = True
    incident.status = "Resolved"
    incident.resolved_at = datetime.utcnow()
    
    return learn_res

@app.get("/memory", response_model=List[RetainedMemory])
async def get_memories():
    return hindsight_service.get_all_memories()

@app.get("/memory/search", response_model=List[RetainedMemory])
async def search_memory(q: str = Query(..., description="Query string for memory recall")):
    return await hindsight_service.recall(query=q)

@app.get("/lessons", response_model=List[LessonModel])
async def get_lessons():
    return hindsight_service.get_all_lessons()

@app.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    memories = hindsight_service.get_all_memories()
    lessons = hindsight_service.get_all_lessons()
    incidents = list(incidents_db.values())
    
    succ_res = sum(1 for m in memories if m.outcome == "Successful")
    failed_approaches = sum(len(m.failed_approaches) for m in memories)
    inc_with_mem = sum(1 for inc in incidents if inc.historical_memory_found)
    inc_without_mem = sum(1 for inc in incidents if not inc.historical_memory_found)
    
    h_health = await hindsight_service.check_health()

    return DashboardStats(
        incidents_remembered=len(memories),
        lessons_learned=len(lessons),
        successful_resolutions=succ_res,
        failed_approaches=failed_approaches,
        total_incidents=len(incidents),
        incidents_with_memory=inc_with_mem,
        incidents_without_memory=inc_without_mem,
        hindsight_connected=h_health["connected"],
        hindsight_status=h_health["status"]
    )

@app.post("/seed")
async def seed_data():
    """Seeds synthetic demo incidents into Hindsight via actual retain calls."""
    demo_scenarios = [
        {
            "incident_id": "INC-20260901-001",
            "title": "API Gateway 504 Gateway Timeout",
            "service": "api-gateway",
            "environment": "Production",
            "severity": "High",
            "error_message": "504 Gateway Timeout: Upstream service dead",
            "description": "Ingress edge proxy unable to reach auth-service cluster.",
            "root_cause": "Backend auth-service connection thread pool starvation",
            "final_resolution": "Increased upstream timeout buffer and scaled auth-service replicas from 3 to 8",
            "actions_taken": ["Scaled auth pods", "Flushed DNS cache"],
            "failed_approaches": ["Restarted ingress gateway without scaling auth backend"],
            "outcome": "Successful",
            "engineer_feedback": "Ensure auto-scaling triggers on thread pool latency rather than simple CPU.",
            "lesson": "For recurring api-gateway incidents with 504 Gateway Timeout, scale auth-service backend replicas before restarting edge proxies."
        },
        {
            "incident_id": "INC-20260902-002",
            "title": "User Authentication Failure Loop",
            "service": "auth-service",
            "environment": "Production",
            "severity": "Critical",
            "error_message": "OAuth 401 Unauthorized: Token signing key mismatch",
            "description": "Users rejected during session refresh cycle across all regions.",
            "root_cause": "Expired service credentials and JWKS rotation race condition",
            "final_resolution": "Promoted standby JWKS key in KMS and triggered credential sync",
            "actions_taken": ["Force refreshed KMS rotation", "Purged stale Redis tokens"],
            "failed_approaches": ["Reverted auth deployment image"],
            "outcome": "Successful",
            "engineer_feedback": "Rotate JWKS 48 hours before hard expiration window.",
            "lesson": "For recurring auth-service token signing key mismatches, promote standby JWKS keys in KMS rather than rolling back deployment images."
        }
    ]

    retained = []
    for item in demo_scenarios:
        mem = await hindsight_service.retain(item)
        await hindsight_service.reflect(item, item.get("engineer_feedback", ""))
        retained.append(mem)

    return {"status": "seeded", "retained_count": len(retained)}

@app.post("/reset")
async def reset_state():
    """Resets memory store and in-memory incidents for a clean-slate demo."""
    hindsight_service.reset()
    incidents_db.clear()
    return {"status": "reset", "message": "Memory store and incidents cleared for clean demo"}
