from datetime import date, datetime, time
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from ..auth import get_current_user_id
from ..database import get_session
from ..models import WeightEntry
from ..schemas import WeightEntryCreate, WeightEntryRead, WeightEntryUpdate

router = APIRouter(prefix="/api/weight-entries", tags=["weight-entries"])


def _get_entry_or_404(session: Session, entry_id: int, user_id: str) -> WeightEntry:
    entry = session.exec(
        select(WeightEntry).where(WeightEntry.id == entry_id, WeightEntry.user_id == user_id)
    ).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Weight entry not found")
    return entry


@router.post("", response_model=WeightEntryRead, status_code=201)
def create_weight_entry(
    payload: WeightEntryCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
) -> WeightEntry:
    entry = WeightEntry(user_id=user_id, weight_lbs=payload.weight_lbs)
    if payload.timestamp is not None:
        entry.timestamp = payload.timestamp
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


@router.get("", response_model=List[WeightEntryRead])
def list_weight_entries(
    from_: Optional[date] = Query(default=None, alias="from"),
    to: Optional[date] = Query(default=None),
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
) -> List[WeightEntry]:
    statement = select(WeightEntry).where(WeightEntry.user_id == user_id)
    if from_ is not None:
        statement = statement.where(WeightEntry.timestamp >= datetime.combine(from_, time.min))
    if to is not None:
        statement = statement.where(WeightEntry.timestamp <= datetime.combine(to, time.max))
    statement = statement.order_by(WeightEntry.timestamp)
    return list(session.exec(statement).all())


@router.get("/{entry_id}", response_model=WeightEntryRead)
def get_weight_entry(
    entry_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
) -> WeightEntry:
    return _get_entry_or_404(session, entry_id, user_id)


@router.put("/{entry_id}", response_model=WeightEntryRead)
def update_weight_entry(
    entry_id: int,
    payload: WeightEntryUpdate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
) -> WeightEntry:
    entry = _get_entry_or_404(session, entry_id, user_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, key, value)
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=204)
def delete_weight_entry(
    entry_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
) -> None:
    entry = _get_entry_or_404(session, entry_id, user_id)
    session.delete(entry)
    session.commit()
