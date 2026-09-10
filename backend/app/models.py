from datetime import date, datetime, time, timezone
from enum import Enum
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class WorkoutType(str, Enum):
    LIFTING = "Lifting"
    CARDIO = "Cardio"
    HIIT = "HIIT"
    YOGA = "Yoga"
    COMBO = "Combo"
    OTHER = "Other"


class WeightEntry(SQLModel, table=True):
    __tablename__ = "weight_entries"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    weight_lbs: float
    timestamp: datetime = Field(default_factory=utc_now)


class Workout(SQLModel, table=True):
    __tablename__ = "workouts"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    name: str
    date: date
    type: WorkoutType
    created_at: datetime = Field(default_factory=utc_now)

    sets: List["ExerciseSet"] = Relationship(
        back_populates="workout",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class ExerciseSet(SQLModel, table=True):
    __tablename__ = "exercise_sets"

    id: Optional[int] = Field(default=None, primary_key=True)
    workout_id: int = Field(foreign_key="workouts.id")
    exercise_type: str
    set_number: int
    reps: int
    time_spent: Optional[time] = None
    calories_burned: Optional[int] = None
    created_at: datetime = Field(default_factory=utc_now)

    workout: Optional[Workout] = Relationship(back_populates="sets")
