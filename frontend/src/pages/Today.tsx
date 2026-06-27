// Today: the at-a-glance standing for the selected date.

import { CalorieRing, MacroRail } from "../components/widgets";
import { useSummary } from "../api/hooks";
import { MACRO_COLORS, round } from "../lib/format";

export function Today({ date }: { date: string }) {
  const { data, isLoading, isError, error } = useSummary(date);

  if (isLoading) return <div className="empty">Loading the day…</div>;
  if (isError)
    return (
      <div className="empty">
        Couldn&apos;t reach the API ({String(error)}). Is the backend running on
        port 8000?
      </div>
    );
  if (!data) return null;

  const { consumed, target } = data;

  return (
    <div className="grid today">
      <div className="card">
        <p className="card-title">Calories</p>
        <CalorieRing consumed={consumed.calories} target={target.calories} />
        <div className="chips">
          <div className="chip">
            <div className="k">Eaten</div>
            <div className="v">{round(consumed.calories)}</div>
          </div>
          <div className="chip">
            <div className="k">Target</div>
            <div className="v">{round(target.calories)}</div>
          </div>
          <div className="chip">
            <div className="k">Left</div>
            <div className="v" style={{ color: consumed.calories > target.calories ? "var(--accent)" : undefined }}>
              {round(target.calories - consumed.calories)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Macros &middot; {data.day_type} day</p>
        <MacroRail
          label="Protein"
          color={MACRO_COLORS.protein}
          consumed={consumed.protein_g}
          target={target.protein_g}
        />
        <MacroRail
          label="Carbs"
          color={MACRO_COLORS.carbs}
          consumed={consumed.carbs_g}
          target={target.carbs_g}
        />
        <MacroRail
          label="Fat"
          color={MACRO_COLORS.fat}
          consumed={consumed.fat_g}
          target={target.fat_g}
        />
        <div className="legend">
          <span>
            {data.entries.length} item{data.entries.length === 1 ? "" : "s"} logged
          </span>
          <span>
            {round((consumed.protein_g * 4) || 0)} kcal from protein
          </span>
        </div>
      </div>
    </div>
  );
}
