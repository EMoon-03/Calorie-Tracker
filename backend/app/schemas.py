"""Pydantic v2 schemas (the API request/response contracts)."""

from datetime import date as date_type

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------


class ProfileBase(BaseModel):
    sex: str = "male"
    age: int = Field(default=25, ge=10, le=100)
    height_cm: float = Field(default=178.0, gt=0)
    weight_kg: float = Field(default=82.0, gt=0)
    activity_level: str = "moderate"
    goal: str = "maintain"

    train_calories: int = Field(default=2800, ge=0)
    train_protein_g: int = Field(default=180, ge=0)
    train_carbs_g: int = Field(default=320, ge=0)
    train_fat_g: int = Field(default=78, ge=0)

    rest_calories: int = Field(default=2400, ge=0)
    rest_protein_g: int = Field(default=180, ge=0)
    rest_carbs_g: int = Field(default=220, ge=0)
    rest_fat_g: int = Field(default=80, ge=0)


class ProfileUpdate(ProfileBase):
    pass


class ProfileOut(ProfileBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SuggestRequest(BaseModel):
    sex: str
    age: int = Field(ge=10, le=100)
    height_cm: float = Field(gt=0)
    weight_kg: float = Field(gt=0)
    activity_level: str
    goal: str


class MacroTargetOut(BaseModel):
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int


class SuggestResponse(BaseModel):
    bmr: int
    tdee: int
    training: MacroTargetOut
    rest: MacroTargetOut


# ---------------------------------------------------------------------------
# Foods
# ---------------------------------------------------------------------------


class FoodBase(BaseModel):
    name: str
    brand: str | None = None
    serving_label: str = "1 serving"
    calories: float = Field(default=0.0, ge=0)
    protein_g: float = Field(default=0.0, ge=0)
    carbs_g: float = Field(default=0.0, ge=0)
    fat_g: float = Field(default=0.0, ge=0)


class FoodCreate(FoodBase):
    pass


class FoodOut(FoodBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------------------------------------------------------------------------
# Log entries
# ---------------------------------------------------------------------------


class LogEntryCreate(BaseModel):
    date: date_type
    meal: str = "snack"
    servings: float = Field(default=1.0, gt=0)
    # Provide a food_id to log an existing food, OR inline macros for a quick add.
    food_id: int | None = None
    name: str | None = None
    calories: float | None = Field(default=None, ge=0)
    protein_g: float | None = Field(default=None, ge=0)
    carbs_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)


class LogEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    date: date_type
    meal: str
    name: str
    servings: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    food_id: int | None


# ---------------------------------------------------------------------------
# Day metadata + daily summary
# ---------------------------------------------------------------------------


class DayMetaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    date: date_type
    day_type: str


class DayMetaUpdate(BaseModel):
    day_type: str  # "training" or "rest"


class Totals(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class DaySummary(BaseModel):
    date: date_type
    day_type: str
    consumed: Totals
    target: Totals
    remaining: Totals
    entries: list[LogEntryOut]


# ---------------------------------------------------------------------------
# Weight
# ---------------------------------------------------------------------------


class WeightCreate(BaseModel):
    date: date_type
    weight_kg: float = Field(gt=0)


class WeightOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    date: date_type
    weight_kg: float
