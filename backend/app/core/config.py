from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://tradelens:tradelens@localhost:5432/tradelens"
    secret_key: str = "changeme-use-a-real-secret-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Comma-separated in env: CORS_ORIGINS=https://tradelens.vercel.app,http://localhost:5173
    cors_origins: list[str] = ["http://localhost:5173"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v: object) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v  # type: ignore[return-value]


settings = Settings()
