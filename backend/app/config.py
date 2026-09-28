import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "ResolveIQ"
    environment: str = "development"
    port: int = 8000
    
    # LLM Settings
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    llm_provider: str = os.getenv("LLM_PROVIDER", "gemini")
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3")
    
    # Hindsight Memory Engine
    hindsight_api_url: str = os.getenv("HINDSIGHT_API_URL", "")
    hindsight_agent_id: str = os.getenv("HINDSIGHT_AGENT_ID", "resolveiq-sre-agent")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
