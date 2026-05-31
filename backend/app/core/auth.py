import uuid
from typing import AsyncGenerator

from fastapi import Depends
from fastapi_users import BaseUserManager, FastAPIUsers, InvalidPasswordException, UUIDIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    CookieTransport,
    JWTStrategy,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.base import get_async_session
from app.models.user import User


async def get_user_db(
    session: AsyncSession = Depends(get_async_session),
) -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    yield SQLAlchemyUserDatabase(session, User)


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.secret_key
    verification_token_secret = settings.secret_key

    async def validate_password(self, password: str, user: User | None = None) -> None:  # type: ignore[override]
        if len(password) < 8:
            raise InvalidPasswordException("Password must be at least 8 characters.")
        if not any(c.isupper() for c in password):
            raise InvalidPasswordException("Password must contain at least one uppercase letter.")
        if not any(c.isdigit() for c in password):
            raise InvalidPasswordException("Password must contain at least one number.")
        # Prevent using email address as password
        if user and hasattr(user, "email") and user.email and user.email.lower() in password.lower():
            raise InvalidPasswordException("Password must not contain your email address.")


async def get_user_manager(
    user_db: SQLAlchemyUserDatabase = Depends(get_user_db),
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)


_is_local = "localhost" in settings.database_url or "127.0.0.1" in settings.database_url

cookie_transport = CookieTransport(
    cookie_name="tradelens_token",
    cookie_max_age=settings.access_token_expire_minutes * 60,
    cookie_secure=not _is_local,  # False on localhost (HTTP), True in production (HTTPS)
    cookie_httponly=True,         # not accessible via JS — prevents XSS token theft
    cookie_samesite="lax",
)


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=settings.secret_key,
        lifetime_seconds=settings.access_token_expire_minutes * 60,
    )


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=cookie_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
