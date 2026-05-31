from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://tradelens:tradelens@localhost:5432/tradelens"
    secret_key: str = "changeme-use-a-real-secret-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Comma-separated string: CORS_ORIGINS=https://tradelens.vercel.app,http://localhost:5173
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
