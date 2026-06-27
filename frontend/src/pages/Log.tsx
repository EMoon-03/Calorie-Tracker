// Log: add foods to the selected date and manage the day's entries.

import { useState } from "react";

import {
  useAddLog,
  useDeleteLog,
  useFoods,
  useSummary,
} from "../api/hooks";
import type { Food, LogEntry, Meal } from "../api/types";
import { round } from "../lib/format";

const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

export function Log({ date }: { date: string }) {
  const { data: summary } = useSummary(date);
  const addLog = useAddLog(date);
  const deleteLog = useDeleteLog(date);

  const [meal, setMeal] = useState<Meal>("breakfast");
  const [search, setSearch] = useState("");
  const { data: foods = [] } = useFoods(search);

  function logFood(food: Food, servings: number) {
    addLog.mutate({ date, meal, servings, food_id: food.id });
  }

  const grouped = MEALS.map((m) => ({
    meal: m,
    items: (summary?.entries ?? []).filter((e) => e.meal === m),
  }));

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div className="card">
        <p className="card-title">Add food</p>

        <div className="field" style={{ marginBottom: 12 }}>
          <label>Meal</label>
          <select value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
            {MEALS.map((m) => (
              <option key={m} value={m}>
                {m[0].toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="field" style={{ marginBottom: 10 }}>
          <label>Search library</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="chicken, rice, whey…"
          />
        </div>

        <div className="picker-list">
          {foods.length === 0 && (
            <div className="empty">No foods match. Try a different term.</div>
          )}
          {foods.map((f) => (
            <PickerRow key={f.id} food={f} onAdd={(s) => logFood(f, s)} />
          ))}
        </div>

        <div className="section-gap">
          <QuickAdd
            onAdd={(payload) => addLog.mutate({ date, meal, servings: 1, ...payload })}
          />
        </div>
      </div>

      <div className="card">
        <p className="card-title">
          {summary ? `${round(summary.consumed.calories)} kcal logged` : "Log"}
        </p>
        {grouped.every((g) => g.items.length === 0) && (
          <div className="empty">Nothing logged yet. Add something on the left.</div>
        )}
        {grouped.map(
          (g) =>
            g.items.length > 0 && (
              <div key={g.meal} className="meal-group">
                <div className="meal-label">
                  <span>{g.meal}</span>
                  <span>
                    {round(g.items.reduce((s, e) => s + e.calories, 0))} kcal
                  </span>
                </div>
                {g.items.map((e) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onDelete={() => deleteLog.mutate(e.id)}
                  />
                ))}
              </div>
            ),
        )}
      </div>
    </div>
  );
}

function PickerRow({ food, onAdd }: { food: Food; onAdd: (servings: number) => void }) {
  const [servings, setServings] = useState("1");
  return (
    <div className="picker-item">
      <div>
        <div className="pname">{food.name}</div>
        <div className="pserv">
          {food.serving_label} &middot; {round(food.calories)} kcal &middot; P
          {round(food.protein_g)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          style={{ width: 52, padding: "5px 6px", textAlign: "center" }}
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          inputMode="decimal"
          aria-label={`servings of ${food.name}`}
        />
        <button
          className="btn"
          style={{ padding: "6px 12px" }}
          onClick={() => onAdd(parseFloat(servings) || 1)}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function EntryRow({ entry, onDelete }: { entry: LogEntry; onDelete: () => void }) {
  return (
    <div className="entry">
      <div>
        <div className="name">{entry.name}</div>
        <div className="meta">
          {entry.servings} &times; serving
        </div>
      </div>
      <div className="macros">
        P{round(entry.protein_g)} &middot; C{round(entry.carbs_g)} &middot; F
        {round(entry.fat_g)}
      </div>
      <div className="kcal">{round(entry.calories)}</div>
      <button className="del" onClick={onDelete} aria-label="Delete entry">
        &times;
      </button>
    </div>
  );
}

interface QuickPayload {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

function QuickAdd({ onAdd }: { onAdd: (p: QuickPayload) => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "" });

  if (!open)
    return (
      <button className="btn ghost" style={{ width: "100%" }} onClick={() => setOpen(true)}>
        + Quick add custom food
      </button>
    );

  const num = (v: string) => parseFloat(v) || 0;
  const submit = () => {
    if (!f.name.trim()) return;
    onAdd({
      name: f.name.trim(),
      calories: num(f.calories),
      protein_g: num(f.protein_g),
      carbs_g: num(f.carbs_g),
      fat_g: num(f.fat_g),
    });
    setF({ name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "" });
    setOpen(false);
  };

  return (
    <div className="row" style={{ gap: 10 }}>
      <div className="field">
        <label>Name</label>
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </div>
      <div className="row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="field">
          <label>Kcal</label>
          <input value={f.calories} onChange={(e) => setF({ ...f, calories: e.target.value })} inputMode="decimal" />
        </div>
        <div className="field">
          <label>P (g)</label>
          <input value={f.protein_g} onChange={(e) => setF({ ...f, protein_g: e.target.value })} inputMode="decimal" />
        </div>
        <div className="field">
          <label>C (g)</label>
          <input value={f.carbs_g} onChange={(e) => setF({ ...f, carbs_g: e.target.value })} inputMode="decimal" />
        </div>
        <div className="field">
          <label>F (g)</label>
          <input value={f.fat_g} onChange={(e) => setF({ ...f, fat_g: e.target.value })} inputMode="decimal" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" onClick={submit}>Add to log</button>
        <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
