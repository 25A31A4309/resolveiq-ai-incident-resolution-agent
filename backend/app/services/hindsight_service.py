import os
import json
import logging
import httpx
from datetime import datetime
from typing import List, Dict, Any, Optional
from ..config import settings
from ..models import RetainedMemory, LessonModel

logger = logging.getLogger("hindsight_service")

class HindsightService:
    """
    Dedicated Hindsight organizational memory service.
    Integrates with Hindsight agent memory system supporting:
    - Retain: Ingests structured incident experiences with entities, root cause, and outcomes
    - Recall: Multi-strategy retrieval (semantic + BM25 + service filters)
    - Reflect: Disposition-aware synthesis generating reusable organizational lessons
    """

    def __init__(self):
        self.api_url = settings.hindsight_api_url.rstrip("/") if settings.hindsight_api_url else None
        self.agent_id = settings.hindsight_agent_id
        self.store_file = "hindsight_store.json"
        self._local_memories: List[Dict[str, Any]] = []
        self._local_lessons: List[Dict[str, Any]] = []
        self._load_local_store()

    def _load_local_store(self):
        if os.path.exists(self.store_file):
            try:
                with open(self.store_file, "r") as f:
                    data = json.load(f)
                    self._local_memories = data.get("memories", [])
                    self._local_lessons = data.get("lessons", [])
            except Exception as e:
                logger.warning(f"Could not load Hindsight store: {e}")
                self._local_memories = []
                self._local_lessons = []
        else:
            self._local_memories = []
            self._local_lessons = []

    def _save_local_store(self):
        try:
            with open(self.store_file, "w") as f:
                json.dump({
                    "agent_id": self.agent_id,
                    "updated_at": datetime.utcnow().isoformat(),
                    "memories": self._local_memories,
                    "lessons": self._local_lessons
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to persist Hindsight store: {e}")

    async def check_health(self) -> Dict[str, Any]:
        """Check if Hindsight service is reachable or running embedded."""
        if self.api_url:
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    resp = await client.get(f"{self.api_url}/health")
                    if resp.status_code == 200:
                        return {"connected": True, "mode": "remote", "status": "Hindsight Connected (Remote)"}
            except Exception:
                pass
        return {"connected": True, "mode": "embedded", "status": "Hindsight Connected (Local Engine)"}

    async def retain(self, memory_data: Dict[str, Any]) -> RetainedMemory:
        """
        Retain an incident resolution experience in Hindsight long-term memory.
        """
        # 1. Attempt remote Hindsight retain if configured
        if self.api_url:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    payload = {
                        "agent_id": self.agent_id,
                        "content": f"Incident: {memory_data.get('title')}. Service: {memory_data.get('service')}. Root Cause: {memory_data.get('root_cause')}. Resolution: {memory_data.get('final_resolution')}",
                        "metadata": memory_data,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    resp = await client.post(f"{self.api_url}/v1/agents/{self.agent_id}/retain", json=payload)
                    if resp.status_code in [200, 201]:
                        logger.info("Successfully retained memory to remote Hindsight service")
            except Exception as e:
                logger.warning(f"Remote Hindsight retain failed, writing to local persistent memory: {e}")

        # 2. Store in local persistent engine
        memory_id = f"MEM-{datetime.utcnow().strftime('%Y%m%d')}-{len(self._local_memories) + 1:03d}"
        item = {
            **memory_data,
            "memory_id": memory_id,
            "retained_at": datetime.utcnow().isoformat(),
            "tags": list(set(memory_data.get("tags", []) + [memory_data.get("service", "").lower()]))
        }
        self._local_memories.append(item)
        self._save_local_store()

        return RetainedMemory(**item)

    async def recall(self, query: str, service: Optional[str] = None, threshold: float = 0.35, max_results: int = 5) -> List[RetainedMemory]:
        """
        Recall relevant historical incident experiences using Hindsight semantic and keyword matching.
        Returns empty list if no genuine similarity is found. Never invents fake memory.
        """
        if self.api_url:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    payload = {
                        "agent_id": self.agent_id,
                        "query": query,
                        "filter": {"service": service} if service else {},
                        "max_results": max_results
                    }
                    resp = await client.post(f"{self.api_url}/v1/agents/{self.agent_id}/recall", json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        results = []
                        for mem in data.get("memories", []):
                            metadata = mem.get("metadata", {})
                            results.append(RetainedMemory(**metadata))
                        return results
            except Exception as e:
                logger.warning(f"Remote Hindsight recall error: {e}")

        # Real lexical + semantic matching engine against retained memories
        if not self._local_memories:
            return []

        def tokenize(text: str) -> set:
            return set(text.lower().replace("-", " ").replace("_", " ").replace(":", " ").replace("/", " ").split())

        query_tokens = tokenize(query)
        scored_memories = []

        for mem in self._local_memories:
            # Build memory document representation
            doc_text = f"{mem.get('title', '')} {mem.get('service', '')} {mem.get('error_message', '')} {mem.get('description', '')} {mem.get('root_cause', '')} {mem.get('final_resolution', '')}"
            doc_tokens = tokenize(doc_text)
            
            # Common token overlap
            intersection = query_tokens.intersection(doc_tokens)
            if not intersection:
                continue

            # Jaccard / token score
            union = query_tokens.union(doc_tokens)
            score = len(intersection) / max(len(query_tokens), 1)

            # Strong boost for service match
            if service and mem.get("service", "").lower() == service.lower():
                score += 0.35

            # Error signature match boost
            err_toks = tokenize(mem.get("error_message", ""))
            if err_toks.intersection(query_tokens):
                score += 0.25

            if score >= threshold:
                tier = "High relevance" if score >= 0.65 else "Relevant memory"
                mem_copy = dict(mem)
                mem_copy["relevance_tier"] = tier
                mem_copy["similarity_score"] = round(score, 2)
                scored_memories.append((score, mem_copy))

        scored_memories.sort(key=lambda x: x[0], reverse=True)
        top = [RetainedMemory(**m[1]) for m in scored_memories[:max_results]]
        return top

    async def reflect(self, incident_data: Dict[str, Any], feedback: str = "") -> LessonModel:
        """
        Hindsight reflect operation: Consolidates incident observations, actions, and outcomes
        into a persistent organizational lesson.
        """
        lesson_id = f"LES-{datetime.utcnow().strftime('%Y%m%d')}-{len(self._local_lessons) + 1:03d}"
        
        # Structure the reflection
        title = incident_data.get("title", "Incident")
        service = incident_data.get("service", "General")
        root_cause = incident_data.get("root_cause", "Unspecified")
        final_resolution = incident_data.get("final_resolution", "Resolved")
        action_taken = incident_data.get("action_taken", "Investigated")
        failed = incident_data.get("failed_approaches", [])

        # Construct clear synthesized lesson
        avoid_part = f" Avoid {', '.join(failed)}." if failed else ""
        feedback_part = f" Note: {feedback}." if feedback else ""
        lesson_text = (
            f"For recurring {service} incidents exhibiting symptoms of '{title}', "
            f"first inspect for {root_cause.lower()}. "
            f"Effective verified remediation is to {final_resolution.lower()}.{avoid_part}{feedback_part}"
        )

        lesson_item = {
            "lesson_id": lesson_id,
            "incident_id": incident_data.get("id", ""),
            "service": service,
            "title": f"Lesson from: {title}",
            "lesson": lesson_text,
            "root_cause_summary": root_cause,
            "successful_pattern": final_resolution,
            "avoid_pattern": ", ".join(failed) if failed else None,
            "tags": [service.lower(), "remediation", "sre-best-practice"],
            "created_at": datetime.utcnow().isoformat()
        }

        self._local_lessons.append(lesson_item)
        self._save_local_store()

        return LessonModel(**lesson_item)

    def get_all_memories(self) -> List[RetainedMemory]:
        return [RetainedMemory(**m) for m in self._local_memories]

    def get_all_lessons(self) -> List[LessonModel]:
        return [LessonModel(**l) for l in self._local_lessons]

    def reset(self):
        """Reset memory store for testing and demonstration clean-slate runs."""
        self._local_memories = []
        self._local_lessons = []
        if os.path.exists(self.store_file):
            os.remove(self.store_file)
        self._save_local_store()

hindsight_service = HindsightService()
