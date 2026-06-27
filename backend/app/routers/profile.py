"""Profile + target-suggestion endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, nutrition, schemas
from ..db import get_db

router = APIRouter(prefix="/api/profile", tags=["profile"])


def _get_or_create_profile(db: Session) -> models.Profile:
    profile = db.get(models.Profile, 1)
    if profile is None:
        profile = models.Profile(id=1)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("", response_model=schemas.ProfileOut)
def read_profile(db: Session = Depends(get_db)) -> models.Profile:
    return _get_or_create_profile(db)


@router.put("", response_model=schemas.ProfileOut)
def update_profile(
    payload: schemas.ProfileUpdate, db: Session = Depends(get_db)
) -> models.Profile:
    profile = _get_or_create_profile(db)
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/suggest", response_model=schemas.SuggestResponse)
def suggest(payload: schemas.SuggestRequest) -> schemas.SuggestResponse:
    """Compute suggested targets without persisting anything."""
    result = nutrition.suggest_targets(
        sex=payload.sex,
        weight_kg=payload.weight_kg,
        height_cm=payload.height_cm,
        age=payload.age,
        activity_level=payload.activity_level,
        goal=payload.goal,
    )
    return schemas.SuggestResponse(
        bmr=result.bmr,
        tdee=result.tdee,
        training=schemas.MacroTargetOut(**result.training.__dict__),
        rest=schemas.MacroTargetOut(**result.rest.__dict__),
    )
