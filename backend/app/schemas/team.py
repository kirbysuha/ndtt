from datetime import datetime
from pydantic import BaseModel, Field


class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    leader: str | None = None
    members: str | None = None


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    leader: str | None = None
    members: str | None = None


class TeamResponse(TeamBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
