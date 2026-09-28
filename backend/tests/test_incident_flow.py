import pytest
import asyncio
from backend.app.services.hindsight_service import hindsight_service
from backend.app.services.incident_agent import incident_agent

@pytest.mark.asyncio
async def test_learning_loop_workflow():
    """
    Test the fundamental ResolveIQ learning loop:
    1. Incident 1: No previous memory exists
    2. Incident 1: Solved and retained in Hindsight
    3. Incident 2: Similar incident arrives
    4. Incident 2: Hindsight recalls Incident 1
    5. Incident 2: AI recommendation leverages Incident 1's successful resolution
    """
    # 0. Clean state
    hindsight_service.reset()
    assert len(hindsight_service.get_all_memories()) == 0

    # 1. Incident 1 - Payment API 502 (Brand new problem)
    inc1 = {
        "id": "INC-TEST-001",
        "title": "Payment API returning 502",
        "service": "payment-api",
        "environment": "Production",
        "severity": "High",
        "error_message": "502 Bad Gateway: Upstream connection refused",
        "description": "Users are unable to complete checkout orders.",
        "failed_approaches": ["Restarted payment-api pod"]
    }

    # Step A: Analyze Incident 1 - Hindsight should find NOTHING
    analysis1 = await incident_agent.analyze_incident(inc1)
    assert analysis1.historical_memory_found is False
    assert len(analysis1.recalled_memories) == 0
    assert analysis1.historical_context is None

    # Step B: Engineer solves Incident 1
    outcome1 = {
        "action_taken": "Reset database connection pool and scaled max_connections to 200",
        "result": "Successful",
        "root_cause": "Database connection pool exhaustion",
        "final_resolution": "Reset database connection pool",
        "engineer_feedback": "Ensure DB connection pool size is monitored under peak spikes."
    }

    # Step C: Hindsight reflects and retains Incident 1 experience
    learn_res1 = await incident_agent.learn_from_incident(inc1, outcome1)
    assert learn_res1["lesson"] is not None
    assert "Database connection pool exhaustion" in learn_res1["lesson"].lesson or "payment-api" in learn_res1["lesson"].lesson
    assert len(hindsight_service.get_all_memories()) == 1

    # 2. Incident 2 - Another Payment API 502 outage happens!
    inc2 = {
        "id": "INC-TEST-002",
        "title": "Payment API 502 recurring error",
        "service": "payment-api",
        "environment": "Production",
        "severity": "High",
        "error_message": "502 Bad Gateway: Connection timeout",
        "description": "Checkout transactions failing intermittently with 502."
    }

    # Step D: Analyze Incident 2 - Hindsight MUST recall Incident 1!
    analysis2 = await incident_agent.analyze_incident(inc2)
    assert analysis2.historical_memory_found is True
    assert len(analysis2.recalled_memories) >= 1
    recalled_inc = analysis2.recalled_memories[0]
    assert recalled_inc.incident_id == "INC-TEST-001"
    assert recalled_inc.root_cause == "Database connection pool exhaustion"
    assert recalled_inc.final_resolution == "Reset database connection pool"

    # Step E: Verify recommendation incorporates previous successful resolution
    top_rec = analysis2.recommendations[0]
    assert "Reset database connection pool" in top_rec.action or "Reset database connection pool" in top_rec.title
    assert top_rec.is_historically_grounded is True
    assert top_rec.source_incident_id == "INC-TEST-001"

    print("SUCCESS: 2-stage ResolveIQ Hindsight Learning Loop verified!")

if __name__ == "__main__":
    asyncio.run(test_learning_loop_workflow())
