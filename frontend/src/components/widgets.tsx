// Presentational building blocks for the dashboard.

import { round } from "../lib/format";

interface RingProps {
  consumed: number;
  target: number;
}

/** Circular calorie gauge. Center shows kcal remaining; ring fills with intake
 *  and turns to the accent when over budget. */
export function CalorieRing({ consumed, target }: RingProps) {
  const size = 230;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const over = consumed > target;
  const remaining = round(target - consumed);

  return (
    <div className="ring-wrap">
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label="Calorie progress">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={over ? "var(--accent)" : "var(--protein)"}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="ring-center">
          <div className="ring-big" style={{ color: over ? "var(--accent)" : "var(--text)" }}>
            {over ? `+${Math.abs(remaining)}` : remaining}
          </div>
          <div className="ring-unit">{over ? "kcal over" : "kcal left"}</div>
          <div className="ring-sub">
            {round(consumed)} / {round(target)}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RailProps {
  label: string;
  color: string;
  consumed: number;
  target: number;
}

/** Horizontal macro "loading rail" — fills toward the target like loading a bar. */
export function MacroRail({ label, color, consumed, target }: RailProps) {
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const over = consumed > target;
  const left = round(target - consumed);

  return (
    <div className="rail">
      <div className="rail-head">
        <span className="rail-name">
          <span className="dot" style={{ background: color }} />
          {label}
        </span>
        <span className="rail-val">
          <b>{round(consumed)}</b> / {round(target)} g
          {over ? (
            <span style={{ color: "var(--accent)" }}> &middot; +{Math.abs(left)}</span>
          ) : (
            <span> &middot; {left} left</span>
          )}
        </span>
      </div>
      <div className="rail-track">
        <div
          className={`rail-fill${over ? " over" : ""}`}
          style={{ width: `${pct * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}
