from datetime import date as date_type
from datetime import datetime
from datetime import time as time_type
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_serializer, field_validator

from .models import WorkoutType

DATE_FORMAT = "%m/%d/%y"


def parse_mmddyy(value: str) -> date_type:
    return datetime.strptime(value, DATE_FORMAT).date()


def format_mmddyy(value: date_type) -> str:
    return value.strftime(DATE_FORMAT)


# ---------- Weight Entries ----------


class WeightEntryCreate(BaseModel):
    weight_lbs: float
    timestamp: Optional[datetime] = None


class WeightEntryUpdate(BaseModel):
    weight_lbs: Optional[float] = None
    timestamp: Optional[datetime] = None


class WeightEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    weight_lbs: float
    timestamp: datetime


# ---------- Exercise Sets ----------


class ExerciseSetCreate(BaseModel):
    exercise_type: str
    reps: int
    time_spent: Optional[time_type] = None
    calories_burned: Optional[int] = None


class ExerciseSetUpdate(BaseModel):
    reps: Optional[int] = None
    time_spent: Optional[time_type] = None
    calories_burned: Optional[int] = None


class ExerciseSetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workout_id: int
    exercise_type: str
    set_number: int
    reps: int
    time_spent: Optional[time_type] = None
    calories_burned: Optional[int] = None
    created_at: datetime


# ---------- Workouts ----------


class WorkoutCreate(BaseModel):
    name: str
    date: str
    type: WorkoutType

    @field_validator("date")
    @classmethod
    def validate_date(cls, value: str) -> str:
        parse_mmddyy(value)
        return value


class WorkoutUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None
    type: Optional[WorkoutType] = None

    @field_validator("date")
    @classmethod
    def validate_date(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            parse_mmddyy(value)
        return value


class WorkoutRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    date: date_type
    type: WorkoutType
    created_at: datetime

    @field_serializer("date")
    def serialize_date(self, value: date_type) -> str:
        return format_mmddyy(value)


class WorkoutReadWithSets(WorkoutRead):
    sets: List[ExerciseSetRead] = []
