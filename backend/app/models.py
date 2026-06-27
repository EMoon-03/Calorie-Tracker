"""ORM models for the calorie tracker.

Design notes
------------
* ``Profile`` is a single-row table (id == 1) holding the athlete's stats plus
  explicit training-day and rest-day targets. Targets are stored rather than
  recomputed so the user can override the suggestions.
* ``LogEntry`` snapshots the macros at log time (``calories``, ``protein_g``,
  etc.) instead of only referencing a ``Food``. Editing or deleting a food
  later must not silently rewrite history, so each entry is self-contained.
* ``DayMeta`` records whether a given date is a training or rest day, which
  determines which target set the summary endpoint compares against.
"""

from datetime import date as date_type
from datetime import datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Profile(Base):
    __tablename__ = "profile"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)

    # Athlete stats used to suggest targets.
    sex: Mapped[str] = mapped_column(String, default="male")
    age: Mapped[int] = mapped_column(Integer, default=25)
    height_cm: Mapped[float] = mapped_column(Float, default=178.0)
    weight_kg: Mapped[float] = mapped_column(Float, default=82.0)
    activity_level: Mapped[str] = mapped_column(String, default="moderate")
    goal: Mapped[str] = mapped_column(String, default="maintain")

    # Training-day targets.
    train_calories: Mapped[int] = mapped_column(Integer, default=2800)
    train_protein_g: Mapped[int] = mapped_column(Integer, default=180)
    train_carbs_g: Mapped[int] = mapped_column(Integer, default=320)
    train_fat_g: Mapped[int] = mapped_column(Integer, default=78)

    # Rest-day targets.
    rest_calories: Mapped[int] = mapped_column(Integer, default=2400)
    rest_protein_g: Mapped[int] = mapped_column(Integer, default=180)
    rest_carbs_g: Mapped[int] = mapped_column(Integer, default=220)
    rest_fat_g: Mapped[int] = mapped_column(Integer, default=80)


class Food(Base):
    """A reusable food/ingredient with macros per single serving."""

    __tablename__ = "foods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, index=True)
    brand: Mapped[str | None] = mapped_column(String, nullable=True)
    serving_label: Mapped[str] = mapped_column(String, default="1 serving")
    calories: Mapped[float] = mapped_column(Float, default=0.0)
    protein_g: Mapped[float] = mapped_column(Float, default=0.0)
    carbs_g: Mapped[float] = mapped_column(Float, default=0.0)
    fat_g: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class LogEntry(Base):
    """A food eaten on a date. Macros are snapshotted at log time."""

    __tablename__ = "log_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date_type] = mapped_column(Date, index=True)
    meal: Mapped[str] = mapped_column(String, default="snack")  # breakfast/lunch/dinner/snack
    name: Mapped[str] = mapped_column(String)
    servings: Mapped[float] = mapped_column(Float, default=1.0)

    # Snapshotted totals for this entry (already multiplied by servings).
    calories: Mapped[float] = mapped_column(Float, default=0.0)
    protein_g: Mapped[float] = mapped_column(Float, default=0.0)
    carbs_g: Mapped[float] = mapped_column(Float, default=0.0)
    fat_g: Mapped[float] = mapped_column(Float, default=0.0)

    # Soft link back to the source food, if any.
    food_id: Mapped[int | None] = mapped_column(
        ForeignKey("foods.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class DayMeta(Base):
    """Per-date metadata. Currently just training vs rest day."""

    __tablename__ = "day_meta"

    date: Mapped[date_type] = mapped_column(Date, primary_key=True)
    day_type: Mapped[str] = mapped_column(String, default="training")  # training/rest


class WeightEntry(Base):
    __tablename__ = "weight_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date_type] = mapped_column(Date, unique=True, index=True)
    weight_kg: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
