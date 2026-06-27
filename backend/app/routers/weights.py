"""Bodyweight logging endpoints."""

from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db

router = APIRouter(prefix="/api/weights", tags=["weights"])


@router.get("", response_model=list[schemas.WeightOut])
def list_weights(db: Session = Depends(get_db)) -> list[models.WeightEntry]:
    stmt = select(models.WeightEntry).order_by(models.WeightEntry.date)
    return list(db.scalars(stmt).all())


@router.post("", response_model=schemas.WeightOut, status_code=201)
def upsert_weight(
    payload: schemas.WeightCreate, db: Session = Depends(get_db)
) -> models.WeightEntry:
    # One weigh-in per day: update in place if the date already exists.
    existing = db.scalar(
        select(models.WeightEntry).where(models.WeightEntry.date == payload.date)
    )
    if existing is not None:
        existing.weight_kg = payload.weight_kg
        db.commit()
        db.refresh(existing)
        return existing

    entry = models.WeightEntry(date=payload.date, weight_kg=payload.weight_kg)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=204)
def delete_weight(entry_id: int, db: Session = Depends(get_db)) -> None:
    entry = db.get(models.WeightEntry, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Weight entry not found")
    db.delete(entry)
    db.commit()
