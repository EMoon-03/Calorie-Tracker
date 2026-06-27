"""Nutrition calculations.

Suggests training-day and rest-day targets from athlete stats using the
Mifflin-St Jeor equation. Protein is held constant across both day types at a
physique-oriented ~1 g per lb of bodyweight; calories flex by day type and the
difference is absorbed mostly by carbohydrate (carb cycling). Fat is set to a
floor proportional to bodyweight so it never collapses on low-calorie days.
"""

from dataclasses import dataclass

KG_TO_LB = 2.20462

ACTIVITY_FACTORS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "very": 1.725,
    "athlete": 1.9,
}

# Calorie delta applied to maintenance (TDEE) per goal, by day type.
GOAL_ADJUSTMENTS = {
    "cut": {"training": -400, "rest": -600},
    "maintain": {"training": 0, "rest": 0},
    "bulk": {"training": 250, "rest": 100},
}

PROTEIN_G_PER_LB = 1.0
FAT_G_PER_LB = 0.35


@dataclass
class MacroTarget:
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int


@dataclass
class TargetSuggestion:
    bmr: int
    tdee: int
    training: MacroTarget
    rest: MacroTarget


def mifflin_st_jeor_bmr(sex: str, weight_kg: float, height_cm: float, age: int) -> float:
    """Resting metabolic rate via Mifflin-St Jeor."""
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    return base + (5 if sex.lower() == "male" else -161)


def _macros_for_calories(calories: int, weight_kg: float) -> MacroTarget:
    lb = weight_kg * KG_TO_LB
    protein_g = round(PROTEIN_G_PER_LB * lb)
    fat_g = round(FAT_G_PER_LB * lb)
    remaining = calories - (protein_g * 4 + fat_g * 9)
    carbs_g = max(0, round(remaining / 4))
    return MacroTarget(
        calories=calories, protein_g=protein_g, carbs_g=carbs_g, fat_g=fat_g
    )


def suggest_targets(
    sex: str,
    weight_kg: float,
    height_cm: float,
    age: int,
    activity_level: str,
    goal: str,
) -> TargetSuggestion:
    """Return suggested training-day and rest-day macro targets."""
    bmr = mifflin_st_jeor_bmr(sex, weight_kg, height_cm, age)
    factor = ACTIVITY_FACTORS.get(activity_level, 1.55)
    tdee = bmr * factor

    adjustments = GOAL_ADJUSTMENTS.get(goal, GOAL_ADJUSTMENTS["maintain"])
    train_cal = round(tdee + adjustments["training"])
    rest_cal = round(tdee + adjustments["rest"])

    return TargetSuggestion(
        bmr=round(bmr),
        tdee=round(tdee),
        training=_macros_for_calories(train_cal, weight_kg),
        rest=_macros_for_calories(rest_cal, weight_kg),
    )
