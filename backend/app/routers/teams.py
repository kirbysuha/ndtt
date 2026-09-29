from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.team import Team
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("", response_model=list[TeamResponse])
async def list_teams(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Team).order_by(Team.name))
    return result.scalars().all()


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(data: TeamCreate, db: AsyncSession = Depends(get_db)):
    # Aynı isimde ekip var mı kontrol et
    existing = await db.scalar(select(Team).where(Team.name == data.name))
    if existing:
        raise HTTPException(status_code=400, detail="Bu isimde bir ekip zaten var")

    team = Team(
        name=data.name,
        description=data.description,
        leader=data.leader,
        members=data.members,
    )
    db.add(team)
    await db.flush()
    return team


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(team_id: str, db: AsyncSession = Depends(get_db)):
    team = await db.scalar(select(Team).where(Team.id == team_id))
    if not team:
        raise HTTPException(status_code=404, detail="Ekip bulunamadı")
    return team


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(team_id: str, data: TeamUpdate, db: AsyncSession = Depends(get_db)):
    team = await db.scalar(select(Team).where(Team.id == team_id))
    if not team:
        raise HTTPException(status_code=404, detail="Ekip bulunamadı")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(team, field, value)
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(team_id: str, db: AsyncSession = Depends(get_db)):
    team = await db.scalar(select(Team).where(Team.id == team_id))
    if not team:
        raise HTTPException(status_code=404, detail="Ekip bulunamadı")
    await db.delete(team)
