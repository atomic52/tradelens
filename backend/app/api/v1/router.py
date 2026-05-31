from fastapi import APIRouter

from app.api.v1.endpoints import accounts, analytics, imports, trades
from app.core.auth import auth_backend, current_active_user, fastapi_users
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/api/v1")

# Auth routes
router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)

# Only expose /users/me — not the admin GET/PATCH/DELETE /users/{id} routes
router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

# App routes
router.include_router(accounts.router, tags=["accounts"])
router.include_router(trades.router, tags=["trades"])
router.include_router(imports.router, tags=["imports"])
router.include_router(analytics.router, tags=["analytics"])
