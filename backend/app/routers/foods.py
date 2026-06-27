"""Food library endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db

router = APIRouter(prefix="/api/foods", tags=["foods"])


@router.get("", response_model=list[schemas.FoodOut])
def list_foods(
    query: str | None = Query(default=None, description="Case-insensitive name filter"),
    db: Session = Depends(get_db),
) -> list[models.Food]:
    stmt = select(models.Food)
    if query:
        stmt = stmt.where(models.Food.name.ilike(f"%{query}%"))
    stmt = stmt.order_by(models.Food.name)
    return list(db.scalars(stmt).all())


@router.post("", response_model=schemas.FoodOut, status_code=201)
def create_food(
    payload: schemas.FoodCreate, db: Session = Depends(get_db)
) -> models.Food:
    food = models.Food(**payload.model_dump())
    db.add(food)
    db.commit()
    db.refresh(food)
    return food


@router.delete("/{food_id}", status_code=204)
def delete_food(food_id: int, db: Session = Depends(get_db)) -> None:
    food = db.get(models.Food, food_id)
    if food is None:
        raise HTTPException(status_code=404, detail="Food not found")
    db.delete(food)
    db.commit()
