#!/usr/bin/env python3
"""
Seed script for ResolveIQ Hindsight Memory Engine.
Populates realistic synthetic incident resolution experiences into Hindsight using actual retain calls.
"""
import asyncio
from app.services.hindsight_service import hindsight_service

DEMO_INCIDENTS = [
    {
        "incident_id": "INC-20260810-001",
        "title": "Payment API 502 Bad Gateway",
        "service": "payment-api",
        "environment": "Production",
        "severity": "High",
        "error_message": "502 Bad Gateway: Upstream pool exhausted",
        "description": "Payment authorization endpoint dropped to 12% success rate.",
        "root_cause": "Database connection pool exhaustion caused by unclosed cursor leaks",
        "final_resolution": "Reset database connection pool and patched ORM connection leak",
        "actions_taken": ["Reset DB pool", "Deployed ORM cursor fix"],
        "failed_approaches": ["Restarted payment-api ingress proxy", "Flushed Redis token cache"],
        "outcome": "Successful",
        "engineer_feedback": "Monitor connection pool metrics closely during flash checkout campaigns.",
        "lesson": "For recurring Payment API 502 incidents, check database connection pool health before restarting proxies or clearing cache."
    },
    {
        "incident_id": "INC-20260814-002",
        "title": "API Gateway 504 Timeout",
        "service": "api-gateway",
        "environment": "Production",
        "severity": "High",
        "error_message": "504 Gateway Timeout: auth-service unresponsive",
        "description": "User requests hanging at public API gateway boundary.",
        "root_cause": "Backend auth-service CPU throttling and thread pool saturation",
        "final_resolution": "Scaled auth-service HPA minimum replicas from 2 to 6",
        "actions_taken": ["Scaled auth-service replicas", "Applied circuit breaker on non-critical auth routes"],
        "failed_approaches": ["Increased ingress proxy timeout without backend scaling"],
        "outcome": "Successful",
        "engineer_feedback": "Adjust HPA target CPU utilization to 65% instead of 85%.",
        "lesson": "For recurring api-gateway 504 timeouts, scale upstream auth service pods before touching ingress gateway configs."
    },
    {
        "incident_id": "INC-20260822-003",
        "title": "Authentication Token Rotation Failure",
        "service": "auth-service",
        "environment": "Production",
        "severity": "Critical",
        "error_message": "401 Unauthorized: Invalid JWT signature",
        "description": "All mobile and web users intermittently logged out upon token refresh.",
        "root_cause": "Expired service credentials and async JWKS key synchronization delay",
        "final_resolution": "Promoted standby JWKS key in KMS and triggered credential sync",
        "actions_taken": ["Synced JWKS keys across all availability zones", "Purged stale token cache"],
        "failed_approaches": ["Reverted latest container image build"],
        "outcome": "Successful",
        "engineer_feedback": "Automate proactive rotation checks 72h ahead of key expiry.",
        "lesson": "For authentication failures with token signing mismatches, verify KMS JWKS key propagation instead of reverting application images."
    }
]

async def seed():
    print("Seeding synthetic incident experiences into Hindsight memory...")
    for inc in DEMO_INCIDENTS:
        retained = await hindsight_service.retain(inc)
        lesson = await hindsight_service.reflect(inc, inc.get("engineer_feedback", ""))
        print(f"✓ Retained [{retained.memory_id}] {inc['title']} (Lesson: {lesson.lesson_id})")
    
    total = len(hindsight_service.get_all_memories())
    print(f"\nCompleted! Total Hindsight memories retained: {total}")

if __name__ == "__main__":
    asyncio.run(seed())
