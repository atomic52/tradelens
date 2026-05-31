import os

from pydantic_settings import BaseSettings, SettingsConfigDict

_INSECURE_DEFAULT_KEY = "changeme-use-a-real-secret-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://tradelens:tradelens@localhost:5432/tradelens"
    secret_key: str = _INSECURE_DEFAULT_KEY
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Comma-separated string: CORS_ORIGINS=https://tradelens.vercel.app,http://localhost:5173
    cors_origins: str = "http://localhost:5173"

    # Email (Resend) — required in production for password reset
    resend_api_key: str = ""
    from_email: str = "noreply@tradelens.app"
    frontend_url: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

# Refuse to start in production with the insecure default key.
# "Production" = DATABASE_URL points somewhere other than localhost.
_is_local_db = "localhost" in settings.database_url or "127.0.0.1" in settings.database_url
if settings.secret_key == _INSECURE_DEFAULT_KEY and not _is_local_db:
    raise RuntimeError(
        "SECRET_KEY is set to the insecure default. "
        "Set a real SECRET_KEY env var before deploying. "
        "Generate one with: openssl rand -hex 32"
    )
