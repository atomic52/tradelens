import time
from collections import defaultdict

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.router import router
from app.core.config import settings

# Disable interactive docs in production (non-local database = production)
_is_local = "localhost" in settings.database_url or "127.0.0.1" in settings.database_url

app = FastAPI(
    title="TradeLens API",
    version="0.1.0",
    docs_url="/docs" if _is_local else None,
    redoc_url="/redoc" if _is_local else None,
    openapi_url="/openapi.json" if _is_local else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if not _is_local:
            # Fly.io terminates TLS; tell browsers to always use HTTPS
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app.add_middleware(SecurityHeadersMiddleware)


# ---------------------------------------------------------------------------
# Simple in-process rate limiter for auth endpoints
# Limits: 10 attempts per IP per 60 seconds on login/register
# ---------------------------------------------------------------------------
_AUTH_PATHS = {"/api/v1/auth/jwt/login", "/api/v1/auth/register"}
_RATE_WINDOW = 60        # seconds
_RATE_MAX    = 10        # requests per window per IP
_rate_store: dict[str, list[float]] = defaultdict(list)


class AuthRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in _AUTH_PATHS and request.method == "POST":
            ip = request.client.host if request.client else "unknown"
            key = f"{ip}:{request.url.path}"
            now = time.monotonic()
            # Purge timestamps outside the window
            _rate_store[key] = [t for t in _rate_store[key] if now - t < _RATE_WINDOW]
            if len(_rate_store[key]) >= _RATE_MAX:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please wait before trying again."},
                )
            _rate_store[key].append(now)
        return await call_next(request)


app.add_middleware(AuthRateLimitMiddleware)

app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok"}
