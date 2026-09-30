from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.config import get_settings

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    username: str = "admin"
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    username: str
    role: str


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bu işlem için yönetici yetkisi gerekiyor. Lütfen giriş yapın.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str | None = payload.get("sub")
        role: str | None = payload.get("role")
        if username != settings.ADMIN_USERNAME or role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Yetkisiz erişim",
            )
        return {"username": username, "role": role}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş oturum.",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    if data.username != settings.ADMIN_USERNAME or data.password != settings.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı kullanıcı adı veya şifre",
        )
    access_token = create_access_token(
        data={"sub": settings.ADMIN_USERNAME, "role": "admin"}
    )
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(admin: dict = Depends(get_current_admin)):
    return UserResponse(username=admin["username"], role=admin["role"])
