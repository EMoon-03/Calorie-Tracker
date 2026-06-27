"""Seed the database with a realistic physique-athlete dataset.

Creates a profile on a lean bulk, a library of common training foods, two weeks
of daily logs alternating training/rest days, and a bodyweight trend. Safe to
re-run: it clears existing rows first.

Usage:  python seed.py
"""

from datetime import date, timedelta

from app.db import Base, SessionLocal, engine
from app import models

Base.metadata.create_all(bind=engine)

# Common foods: (name, brand, serving_label, kcal, protein, carbs, fat) per serving.
FOODS = [
    ("Chicken breast, grilled", None, "100 g", 165, 31.0, 0.0, 3.6),
    ("White rice, cooked", None, "100 g", 130, 2.7, 28.0, 0.3),
    ("Rolled oats, dry", None, "40 g", 150, 5.0, 27.0, 3.0),
    ("Whey protein isolate", "Generic", "1 scoop (30 g)", 120, 25.0, 2.0, 1.5),
    ("Whole egg, large", None, "1 egg", 72, 6.3, 0.4, 4.8),
    ("Egg whites", None, "100 g", 52, 11.0, 0.7, 0.2),
    ("Sweet potato, baked", None, "100 g", 90, 2.0, 21.0, 0.1),
    ("Greek yogurt, nonfat", None, "170 g", 100, 17.0, 6.0, 0.7),
    ("Lean ground beef 93/7", None, "100 g", 152, 21.0, 0.0, 7.0),
    ("Banana", None, "1 medium", 105, 1.3, 27.0, 0.4),
    ("Almonds", None, "28 g", 164, 6.0, 6.0, 14.0),
    ("Olive oil", None, "1 tbsp", 119, 0.0, 0.0, 13.5),
    ("Broccoli, steamed", None, "100 g", 35, 2.4, 7.0, 0.4),
    ("Salmon, baked", None, "100 g", 208, 20.0, 0.0, 13.0),
    ("Peanut butter", None, "1 tbsp", 94, 4.0, 3.0, 8.0),
]


def run() -> None:
    db = SessionLocal()
    try:
        # Clear existing data.
        for model in (
            models.LogEntry,
            models.WeightEntry,
            models.DayMeta,
            models.Food,
            models.Profile,
        ):
            db.query(model).delete()
        db.commit()

        # Profile: lean bulk.
        db.add(
            models.Profile(
                id=1,
                sex="male",
                age=25,
                height_cm=180.0,
                weight_kg=84.0,
                activity_level="very",
                goal="bulk",
                train_calories=3050,
                train_protein_g=185,
                train_carbs_g=370,
                train_fat_g=70,
                rest_calories=2700,
                rest_protein_g=185,
                rest_carbs_g=280,
                rest_fat_g=72,
            )
        )

        # Foods.
        foods: list[models.Food] = []
        for name, brand, serving, kcal, p, c, f in FOODS:
            food = models.Food(
                name=name,
                brand=brand,
                serving_label=serving,
                calories=kcal,
                protein_g=p,
                carbs_g=c,
                fat_g=f,
            )
            db.add(food)
            foods.append(food)
        db.commit()
        for food in foods:
            db.refresh(food)

        by_name = {f.name: f for f in foods}

        # Two weeks of logs ending today. 5 training days / week pattern.
        today = date.today()
        start = today - timedelta(days=13)
        weight = 83.4

        def add_entry(day: date, meal: str, food_name: str, servings: float) -> None:
            food = by_name[food_name]
            db.add(
                models.LogEntry(
                    date=day,
                    meal=meal,
                    name=food.name,
                    servings=servings,
                    calories=round(food.calories * servings, 2),
                    protein_g=round(food.protein_g * servings, 2),
                    carbs_g=round(food.carbs_g * servings, 2),
                    fat_g=round(food.fat_g * servings, 2),
                    food_id=food.id,
                )
            )

        for offset in range(14):
            day = start + timedelta(days=offset)
            # Rest on Sundays (weekday 6) and Wednesdays (weekday 2).
            is_rest = day.weekday() in (2, 6)
            db.add(
                models.DayMeta(date=day, day_type="rest" if is_rest else "training")
            )

            # Breakfast.
            add_entry(day, "breakfast", "Rolled oats, dry", 1.5)
            add_entry(day, "breakfast", "Whey protein isolate", 1)
            add_entry(day, "breakfast", "Banana", 1)
            # Lunch.
            add_entry(day, "lunch", "Chicken breast, grilled", 2.0)
            add_entry(day, "lunch", "White rice, cooked", 2.0 if not is_rest else 1.5)
            add_entry(day, "lunch", "Broccoli, steamed", 1.5)
            # Dinner.
            add_entry(day, "dinner", "Lean ground beef 93/7", 2.0)
            add_entry(day, "dinner", "Sweet potato, baked", 2.0 if not is_rest else 1.0)
            add_entry(day, "dinner", "Olive oil", 1)
            # Snack.
            add_entry(day, "snack", "Greek yogurt, nonfat", 1)
            if not is_rest:
                add_entry(day, "snack", "Almonds", 1)

            # Weight trend: slow lean-bulk gain with daily noise.
            noise = 0.3 if offset % 2 == 0 else -0.2
            db.add(
                models.WeightEntry(date=day, weight_kg=round(weight + noise, 1))
            )
            weight += 0.045

        db.commit()
        print(f"Seeded {len(foods)} foods and 14 days of logs/weights.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
