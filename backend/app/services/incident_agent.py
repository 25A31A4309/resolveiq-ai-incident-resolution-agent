import logging
from typing import Dict, Any, List
from datetime import datetime
from .hindsight_service import hindsight_service
from .llm_service import llm_service
from ..models import AnalysisResult, RetainedMemory, LessonModel

logger = logging.getLogger("incident_agent")

class IncidentAgent:
    """
    Agent Orchestration for ResolveIQ:
    Coordinates recall, reasoning, recommendation, outcome tracking, and reflection.
    """

    async def analyze_incident(self, incident: Dict[str, Any]) -> AnalysisResult:
        """
        Investigation workflow:
        1. Construct recall query from incident title, service, error message, and description.
        2. Query Hindsight organizational memory.
        3. Determine if relevant historical memory exists (never fabricate).
        4. Pass context to reasoning engine.
        5. Return structured analysis separating facts, hypotheses, and recommendations.
        """
        incident_id = incident.get("id", "")
        service = incident.get("service", "")
        query = f"{incident.get('title', '')} {incident.get('error_message', '')} {incident.get('description', '')}"

        # Search Hindsight organizational memory
        recalled = await hindsight_service.recall(query=query, service=service, threshold=0.35)
        has_memory = len(recalled) > 0

        # Run AI reasoning
        recalled_dicts = [m.model_dump() for m in recalled]
        analysis_data = await llm_service.generate_investigation(incident, recalled_dicts)

        return AnalysisResult(
            incident_id=incident_id,
            historical_memory_found=has_memory,
            recalled_memories=recalled,
            summary=analysis_data.get("summary", ""),
            historical_context=analysis_data.get("historical_context"),
            likely_causes=analysis_data.get("likely_causes", []),
            recommendations=analysis_data.get("recommendations", [])
        )

    async def learn_from_incident(
        self,
        incident: Dict[str, Any],
        outcome_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Learning & Reflection workflow:
        1. Consolidate full incident lifecycle (symptoms -> actions -> root cause -> outcome).
        2. Execute Hindsight reflection to synthesize an organizational lesson.
        3. Retain the completed incident experience in Hindsight long-term memory.
        """
        # Consolidate complete incident experience
        merged = {
            **incident,
            "action_taken": outcome_data.get("action_taken", ""),
            "result": outcome_data.get("result", "Successful"),
            "root_cause": outcome_data.get("root_cause", ""),
            "final_resolution": outcome_data.get("final_resolution", ""),
            "engineer_feedback": outcome_data.get("engineer_feedback", ""),
            "failed_approaches": incident.get("failed_approaches", [])
        }

        # Call Hindsight reflection to synthesize lesson
        lesson: LessonModel = await hindsight_service.reflect(
            incident_data=merged,
            feedback=outcome_data.get("engineer_feedback", "")
        )

        # Retain complete experience into Hindsight
        memory_payload = {
            "incident_id": incident.get("id"),
            "title": incident.get("title"),
            "service": incident.get("service"),
            "environment": incident.get("environment", "Production"),
            "severity": incident.get("severity", "High"),
            "error_message": incident.get("error_message"),
            "description": incident.get("description"),
            "logs": incident.get("logs"),
            "root_cause": outcome_data.get("root_cause"),
            "final_resolution": outcome_data.get("final_resolution"),
            "actions_taken": [outcome_data.get("action_taken")],
            "failed_approaches": incident.get("failed_approaches", []),
            "outcome": outcome_data.get("result", "Successful"),
            "engineer_feedback": outcome_data.get("engineer_feedback", ""),
            "lesson": lesson.lesson,
            "tags": [incident.get("service", "").lower(), "incident-experience", outcome_data.get("result", "").lower()]
        }

        retained_mem: RetainedMemory = await hindsight_service.retain(memory_payload)

        return {
            "lesson": lesson,
            "retained_memory": retained_mem
        }

incident_agent = IncidentAgent()
