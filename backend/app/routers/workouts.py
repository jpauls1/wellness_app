from datetime import date as date_type
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, select

from ..database import get_session
from ..models import ExerciseSet, Workout, WorkoutType
from ..schemas import (
    ExerciseSetCreate,
    ExerciseSetRead,
    ExerciseSetUpdate,
    WorkoutCreate,
    WorkoutRead,
    WorkoutReadWithSets,
    WorkoutUpdate,
    parse_mmddyy,
)

router = APIRouter(prefix="/api/workouts", tags=["workouts"])


def _get_workout_or_404(session: Session, workout_id: int) -> Workout:
    workout = session.get(Workout, workout_id)
    if workout is None:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout


def _get_set_or_404(session: Session, workout_id: int, set_id: int) -> ExerciseSet:
    exercise_set = session.get(ExerciseSet, set_id)
    if exercise_set is None or exercise_set.workout_id != workout_id:
        raise HTTPException(status_code=404, detail="Set not found")
    return exercise_set


# ---------- Workouts ----------


@router.post("", response_model=WorkoutRead, status_code=201)
def create_workout(payload: WorkoutCreate, session: Session = Depends(get_session)) -> Workout:
    workout = Workout(name=payload.name, date=parse_mmddyy(payload.date), type=payload.type)
    session.add(workout)
    session.commit()
    session.refresh(workout)
    return workout


@router.get("", response_model=List[WorkoutRead])
def list_workouts(
    from_: Optional[date_type] = Query(default=None, alias="from"),
    to: Optional[date_type] = Query(default=None),
    type: Optional[WorkoutType] = Query(default=None),
    session: Session = Depends(get_session),
) -> List[Workout]:
    statement = select(Workout)
    if from_ is not None:
        statement = statement.where(Workout.date >= from_)
    if to is not None:
        statement = statement.where(Workout.date <= to)
    if type is not None:
        statement = statement.where(Workout.type == type)
    statement = statement.order_by(Workout.date)
    return list(session.exec(statement).all())


@router.get("/{workout_id}", response_model=WorkoutReadWithSets)
def get_workout(workout_id: int, session: Session = Depends(get_session)) -> Workout:
    return _get_workout_or_404(session, workout_id)


@router.put("/{workout_id}", response_model=WorkoutRead)
def update_workout(
    workout_id: int, payload: WorkoutUpdate, session: Session = Depends(get_session)
) -> Workout:
    workout = _get_workout_or_404(session, workout_id)
    data = payload.model_dump(exclude_unset=True)
    if "date" in data and data["date"] is not None:
        data["date"] = parse_mmddyy(data["date"])
    for key, value in data.items():
        setattr(workout, key, value)
    session.add(workout)
    session.commit()
    session.refresh(workout)
    return workout


@router.delete("/{workout_id}", status_code=204)
def delete_workout(workout_id: int, session: Session = Depends(get_session)) -> None:
    workout = _get_workout_or_404(session, workout_id)
    session.delete(workout)
    session.commit()


# ---------- Exercise Sets (nested under a workout) ----------


@router.post("/{workout_id}/sets", response_model=ExerciseSetRead, status_code=201)
def create_set(
    workout_id: int, payload: ExerciseSetCreate, session: Session = Depends(get_session)
) -> ExerciseSet:
    _get_workout_or_404(session, workout_id)

    highest_set_number = session.exec(
        select(func.max(ExerciseSet.set_number)).where(
            ExerciseSet.workout_id == workout_id,
            ExerciseSet.exercise_type == payload.exercise_type,
        )
    ).one()

    exercise_set = ExerciseSet(
        workout_id=workout_id,
        exercise_type=payload.exercise_type,
        set_number=(highest_set_number or 0) + 1,
        reps=payload.reps,
        time_spent=payload.time_spent,
        calories_burned=payload.calories_burned,
    )
    session.add(exercise_set)
    session.commit()
    session.refresh(exercise_set)
    return exercise_set


@router.get("/{workout_id}/sets", response_model=List[ExerciseSetRead])
def list_sets(workout_id: int, session: Session = Depends(get_session)) -> List[ExerciseSet]:
    _get_workout_or_404(session, workout_id)
    statement = (
        select(ExerciseSet)
        .where(ExerciseSet.workout_id == workout_id)
        .order_by(ExerciseSet.created_at)
    )
    return list(session.exec(statement).all())


@router.put("/{workout_id}/sets/{set_id}", response_model=ExerciseSetRead)
def update_set(
    workout_id: int,
    set_id: int,
    payload: ExerciseSetUpdate,
    session: Session = Depends(get_session),
) -> ExerciseSet:
    exercise_set = _get_set_or_404(session, workout_id, set_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(exercise_set, key, value)
    session.add(exercise_set)
    session.commit()
    session.refresh(exercise_set)
    return exercise_set


@router.delete("/{workout_id}/sets/{set_id}", status_code=204)
def delete_set(workout_id: int, set_id: int, session: Session = Depends(get_session)) -> None:
    exercise_set = _get_set_or_404(session, workout_id, set_id)
    session.delete(exercise_set)
    session.commit()
