// Goals: athlete stats, one-click target suggestion, and editable
// training-day / rest-day macro targets.

import { useEffect, useState } from "react";

import { useProfile, useSuggestTargets, useUpdateProfile } from "../api/hooks";
import type { Profile, SuggestResponse } from "../api/types";

const ACTIVITY = [
  ["sedentary", "Sedentary"],
  ["light", "Light (1-2 d/wk)"],
  ["moderate", "Moderate (3-4 d/wk)"],
  ["very", "Very active (5-6 d/wk)"],
  ["athlete", "Athlete (2x/day)"],
];
const GOALS = [
  ["cut", "Cut"],
  ["maintain", "Maintain"],
  ["bulk", "Bulk"],
];

export function Goals() {
  const { data } = useProfile();
  const update = useUpdateProfile();
  const suggest = useSuggestTargets();
  const [form, setForm] = useState<Profile | null>(null);
  const [tip, setTip] = useState<SuggestResponse | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  if (!form) return <div className="empty">Loading profile…</div>;

  const set = (patch: Partial<Profile>) => {
    setForm({ ...form, ...patch });
    setSaved(false);
  };
  const numSet = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set({ [key]: parseFloat(e.target.value) || 0 } as Partial<Profile>);

  async function runSuggest() {
    const res = await suggest.mutateAsync({
      sex: form!.sex,
      age: form!.age,
      height_cm: form!.height_cm,
      weight_kg: form!.weight_kg,
      activity_level: form!.activity_level,
      goal: form!.goal,
    });
    setTip(res);
  }

  function applySuggestion() {
    if (!tip) return;
    set({
      train_calories: tip.training.calories,
      train_protein_g: tip.training.protein_g,
      train_carbs_g: tip.training.carbs_g,
      train_fat_g: tip.training.fat_g,
      rest_calories: tip.rest.calories,
      rest_protein_g: tip.rest.protein_g,
      rest_carbs_g: tip.rest.carbs_g,
      rest_fat_g: tip.rest.fat_g,
    });
  }

  async function save() {
    await update.mutateAsync(form!);
    setSaved(true);
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div className="card">
        <p className="card-title">Athlete stats</p>
        <div className="row" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label>Sex</label>
            <select value={form.sex} onChange={(e) => set({ sex: e.target.value })}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="field">
            <label>Age</label>
            <input value={form.age} onChange={numSet("age")} inputMode="numeric" />
          </div>
          <div className="field">
            <label>Height (cm)</label>
            <input value={form.height_cm} onChange={numSet("height_cm")} inputMode="decimal" />
          </div>
          <div className="field">
            <label>Weight (kg)</label>
            <input value={form.weight_kg} onChange={numSet("weight_kg")} inputMode="decimal" />
          </div>
          <div className="field">
            <label>Activity</label>
            <select value={form.activity_level} onChange={(e) => set({ activity_level: e.target.value })}>
              {ACTIVITY.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Goal</label>
            <select value={form.goal} onChange={(e) => set({ goal: e.target.value })}>
              {GOALS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="section-gap" style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost" onClick={runSuggest} disabled={suggest.isPending}>
            {suggest.isPending ? "Calculating…" : "Suggest targets"}
          </button>
          {tip && (
            <button className="btn" onClick={applySuggestion}>
              Apply suggestion
            </button>
          )}
        </div>

        {tip && (
          <div className="section-gap" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
            BMR {tip.bmr} &middot; TDEE {tip.tdee} kcal
            <br />
            Train: {tip.training.calories} kcal &middot; P{tip.training.protein_g} C
            {tip.training.carbs_g} F{tip.training.fat_g}
            <br />
            Rest: {tip.rest.calories} kcal &middot; P{tip.rest.protein_g} C
            {tip.rest.carbs_g} F{tip.rest.fat_g}
          </div>
        )}
      </div>

      <div className="card">
        <p className="card-title">Daily targets</p>
        <TargetBlock label="Training day" color="var(--accent)" form={form} prefix="train" onChange={numSet} />
        <div className="section-gap" />
        <TargetBlock label="Rest day" color="#6bb6ff" form={form} prefix="rest" onChange={numSet} />

        <div className="section-gap" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn" onClick={save} disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save targets"}
          </button>
          {saved && <span className="muted" style={{ fontSize: 13 }}>Saved ✓</span>}
        </div>
      </div>
    </div>
  );
}

function TargetBlock({
  label,
  color,
  form,
  prefix,
  onChange,
}: {
  label: string;
  color: string;
  form: Profile;
  prefix: "train" | "rest";
  onChange: (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const k = (s: string) => `${prefix}_${s}` as keyof Profile;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
        <span style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 14 }}>{label}</span>
      </div>
      <div className="row" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <div className="field">
          <label>Kcal</label>
          <input value={form[k("calories")] as number} onChange={onChange(k("calories"))} inputMode="numeric" />
        </div>
        <div className="field">
          <label>P (g)</label>
          <input value={form[k("protein_g")] as number} onChange={onChange(k("protein_g"))} inputMode="numeric" />
        </div>
        <div className="field">
          <label>C (g)</label>
          <input value={form[k("carbs_g")] as number} onChange={onChange(k("carbs_g"))} inputMode="numeric" />
        </div>
        <div className="field">
          <label>F (g)</label>
          <input value={form[k("fat_g")] as number} onChange={onChange(k("fat_g"))} inputMode="numeric" />
        </div>
      </div>
    </div>
  );
}
