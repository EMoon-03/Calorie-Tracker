// Trends: bodyweight trajectory (with a 7-day moving average to cut daily
// noise) and calories consumed vs target over the last two weeks.

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAddWeight, useRange, useWeights } from "../api/hooks";
import {
  movingAverage,
  shiftISO,
  shortDate,
  todayISO,
} from "../lib/format";

const tooltipStyle = {
  background: "#16181d",
  border: "1px solid #353a45",
  borderRadius: 8,
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 12,
  color: "#f2f3f5",
};

export function Trends() {
  const today = todayISO();
  const start = shiftISO(today, -13);
  const { data: weights = [] } = useWeights();
  const { data: range = [] } = useRange(start, today);
  const addWeight = useAddWeight();
  const [w, setW] = useState("");

  const avg = movingAverage(weights.map((x) => x.weight_kg), 7);
  const weightData = weights.map((x, i) => ({
    date: shortDate(x.date),
    weight: x.weight_kg,
    avg: avg[i],
  }));

  const calData = range.map((d) => ({
    date: shortDate(d.date),
    consumed: Math.round(d.consumed.calories),
    target: Math.round(d.target.calories),
    over: d.consumed.calories > d.target.calories,
  }));

  const avgTarget =
    range.length > 0
      ? Math.round(range.reduce((s, d) => s + d.target.calories, 0) / range.length)
      : 0;

  function submitWeight() {
    const val = parseFloat(w);
    if (!val) return;
    addWeight.mutate({ date: today, weight_kg: val });
    setW("");
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <p className="card-title">Bodyweight &middot; 7-day average</p>
        {weightData.length === 0 ? (
          <div className="empty">No weigh-ins yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weightData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#262a33" vertical={false} />
              <XAxis dataKey="date" stroke="#5a606b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#5a606b"
                fontSize={11}
                tickLine={false}
                domain={["dataMin - 1", "dataMax + 1"]}
                width={44}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="weight"
                name="Daily"
                stroke="#5a606b"
                strokeWidth={1.5}
                dot={{ r: 2, fill: "#8a9099" }}
              />
              <Line
                type="monotone"
                dataKey="avg"
                name="7-day avg"
                stroke="#36d399"
                strokeWidth={2.5}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="row" style={{ gridTemplateColumns: "1fr auto", marginTop: 12, alignItems: "end", gap: 10 }}>
          <div className="field">
            <label>Log today&apos;s weight (kg)</label>
            <input value={w} onChange={(e) => setW(e.target.value)} inputMode="decimal" placeholder="84.0" />
          </div>
          <button className="btn" onClick={submitWeight}>Save</button>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Calories vs target &middot; last 14 days</p>
        {calData.length === 0 ? (
          <div className="empty">No logged days yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={calData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#262a33" vertical={false} />
              <XAxis dataKey="date" stroke="#5a606b" fontSize={11} tickLine={false} />
              <YAxis stroke="#5a606b" fontSize={11} tickLine={false} width={44} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              {avgTarget > 0 && (
                <ReferenceLine
                  y={avgTarget}
                  stroke="#f5a524"
                  strokeDasharray="4 4"
                  label={{ value: `avg target ${avgTarget}`, fill: "#f5a524", fontSize: 10, position: "insideTopRight" }}
                />
              )}
              <Bar dataKey="consumed" name="Consumed" radius={[3, 3, 0, 0]}>
                {calData.map((d, i) => (
                  <Cell key={i} fill={d.over ? "#ff5436" : "#36d399"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="legend">
          <span><i style={{ background: "#36d399" }} /> At or under target</span>
          <span><i style={{ background: "#ff5436" }} /> Over target</span>
          <span><i style={{ background: "#f5a524" }} /> Avg target line</span>
        </div>
      </div>
    </div>
  );
}
