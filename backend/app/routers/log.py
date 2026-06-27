"""Daily log, day-type, and summary endpoints.

This router intentionally uses no shared prefix because it spans three resource
roots (``/api/log``, ``/api/day``, ``/api/summary``).
"""

from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db

router = APIRouter(tags=["log"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _entries_for_date(db: Session, day: date_type) -> list[models.LogEntry]:
    stmt = (
        select(models.LogEntry)
        .where(models.LogEntry.date == day)
        .order_by(models.LogEntry.created_at)
    )
    return list(db.scalars(stmt).all())


def _totals(entries: list[models.LogEntry]) -> schemas.Totals:
    return schemas.Totals(
        calories=round(sum(e.calories for e in entries), 1),
        protein_g=round(sum(e.protein_g for e in entries), 1),
        carbs_g=round(sum(e.carbs_g for e in entries), 1),
        fat_g=round(sum(e.fat_g for e in entries), 1),
    )


def _day_type(db: Session, day: date_type) -> str:
    meta = db.get(models.DayMeta, day)
    return meta.day_type if meta else "training"


def _target_for(profile: models.Profile, day_type: str) -> schemas.Totals:
    if day_type == "rest":
        return schemas.Totals(
            calories=profile.rest_calories,
            protein_g=profile.rest_protein_g,
            carbs_g=profile.rest_carbs_g,
            fat_g=profile.rest_fat_g,
        )
    return schemas.Totals(
        calories=profile.train_calories,
        protein_g=profile.train_protein_g,
        carbs_g=profile.train_carbs_g,
        fat_g=profile.train_fat_g,
    )


def _profile(db: Session) -> models.Profile:
    profile = db.get(models.Profile, 1)
    if profile is None:
        profile = models.Profile(id=1)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


# ---------------------------------------------------------------------------
# Log entries
# ---------------------------------------------------------------------------


@router.get("/api/log", response_model=list[schemas.LogEntryOut])
def list_log(
    date: date_type = Query(...), db: Session = Depends(get_db)
) -> list[models.LogEntry]:
    return _entries_for_date(db, date)


@router.post("/api/log", response_model=schemas.LogEntryOut, status_code=201)
def create_log(
    payload: schemas.LogEntryCreate, db: Session = Depends(get_db)
) -> models.LogEntry:
    servings = payload.servings

    if payload.food_id is not None:
        food = db.get(models.Food, payload.food_id)
        if food is None:
            raise HTTPException(status_code=404, detail="Food not found")
        name = payload.name or food.name
        per_serving = (food.calories, food.protein_g, food.carbs_g, food.fat_g)
    else:
        if not payload.name:
            raise HTTPException(
                status_code=422,
                detail="Provide a food_id or a name with macros for a quick add.",
            )
        name = payload.name
        per_serving = (
            payload.calories or 0.0,
            payload.protein_g or 0.0,
            payload.carbs_g or 0.0,
            payload.fat_g or 0.0,
        )

    cal, pro, carb, fat = per_serving
    entry = models.LogEntry(
        date=payload.date,
        meal=payload.meal,
        name=name,
        servings=servings,
        calories=round(cal * servings, 2),
        protein_g=round(pro * servings, 2),
        carbs_g=round(carb * servings, 2),
        fat_g=round(fat * servings, 2),
        food_id=payload.food_id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/api/log/{entry_id}", status_code=204)
def delete_log(entry_id: int, db: Session = Depends(get_db)) -> None:
    entry = db.get(models.LogEntry, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Log entry not found")
    db.delete(entry)
    db.commit()


# ---------------------------------------------------------------------------
# Day metadata
# ---------------------------------------------------------------------------


@router.get("/api/day", response_model=schemas.DayMetaOut)
def get_day(date: date_type = Query(...), db: Session = Depends(get_db)) -> schemas.DayMetaOut:
    return schemas.DayMetaOut(date=date, day_type=_day_type(db, date))


@router.put("/api/day", response_model=schemas.DayMetaOut)
def set_day(
    payload: schemas.DayMetaUpdate,
    date: date_type = Query(...),
    db: Session = Depends(get_db),
) -> schemas.DayMetaOut:
    if payload.day_type not in ("training", "rest"):
        raise HTTPException(status_code=422, detail="day_type must be training or rest")
    meta = db.get(models.DayMeta, date)
    if meta is None:
        meta = models.DayMeta(date=date, day_type=payload.day_type)
        db.add(meta)
    else:
        meta.day_type = payload.day_type
    db.commit()
    return schemas.DayMetaOut(date=date, day_type=payload.day_type)


# ---------------------------------------------------------------------------
# Summaries
# ---------------------------------------------------------------------------


def _remaining(target: schemas.Totals, consumed: schemas.Totals) -> schemas.Totals:
    return schemas.Totals(
        calories=round(target.calories - consumed.calories, 1),
        protein_g=round(target.protein_g - consumed.protein_g, 1),
        carbs_g=round(target.carbs_g - consumed.carbs_g, 1),
        fat_g=round(target.fat_g - consumed.fat_g, 1),
    )


@router.get("/api/summary", response_model=schemas.DaySummary)
def day_summary(date: date_type = Query(...), db: Session = Depends(get_db)) -> schemas.DaySummary:
    profile = _profile(db)
    entries = _entries_for_date(db, date)
    day_type = _day_type(db, date)
    consumed = _totals(entries)
    target = _target_for(profile, day_type)
    return schemas.DaySummary(
        date=date,
        day_type=day_type,
        consumed=consumed,
        target=target,
        remaining=_remaining(target, consumed),
        entries=entries,  # type: ignore[arg-type]
    )


@router.get("/api/summary/range")
def summary_range(
    start: date_type = Query(...),
    end: date_type = Query(...),
    db: Session = Depends(get_db),
):
    """Lightweight per-day totals + targets for charting (no entry detail)."""
    profile = _profile(db)
    stmt = (
        select(models.LogEntry)
        .where(models.LogEntry.date >= start, models.LogEntry.date <= end)
        .order_by(models.LogEntry.date)
    )
    by_date: dict[date_type, list[models.LogEntry]] = {}
    for entry in db.scalars(stmt).all():
        by_date.setdefault(entry.date, []).append(entry)

    out = []
    for day, entries in sorted(by_date.items()):
        day_type = _day_type(db, day)
        consumed = _totals(entries)
        target = _target_for(profile, day_type)
        out.append(
            {
                "date": day.isoformat(),
                "day_type": day_type,
                "consumed": consumed.model_dump(),
                "target": target.model_dump(),
            }
        )
    return out
