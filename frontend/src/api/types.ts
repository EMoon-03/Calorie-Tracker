// API contract types. These mirror the Pydantic schemas on the backend.

export type DayType = "training" | "rest";
export type Meal = "breakfast" | "lunch" | "dinner" | "snack";

export interface Profile {
  id: number;
  sex: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: string;
  goal: string;
  train_calories: number;
  train_protein_g: number;
  train_carbs_g: number;
  train_fat_g: number;
  rest_calories: number;
  rest_protein_g: number;
  rest_carbs_g: number;
  rest_fat_g: number;
}

export interface Food {
  id: number;
  name: string;
  brand: string | null;
  serving_label: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export type FoodCreate = Omit<Food, "id">;

export interface LogEntry {
  id: number;
  date: string;
  meal: Meal;
  name: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  food_id: number | null;
}

export interface LogEntryCreate {
  date: string;
  meal: Meal;
  servings: number;
  food_id?: number | null;
  name?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

export interface Totals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DaySummary {
  date: string;
  day_type: DayType;
  consumed: Totals;
  target: Totals;
  remaining: Totals;
  entries: LogEntry[];
}

export interface MacroTarget {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface SuggestResponse {
  bmr: number;
  tdee: number;
  training: MacroTarget;
  rest: MacroTarget;
}

export interface WeightEntry {
  id: number;
  date: string;
  weight_kg: number;
}

export interface RangeDay {
  date: string;
  day_type: DayType;
  consumed: Totals;
  target: Totals;
}
