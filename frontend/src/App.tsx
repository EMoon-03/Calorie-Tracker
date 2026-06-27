import { useState } from "react";
import { Today } from "./pages/Today";
import { Log } from "./pages/Log";
import { Trends } from "./pages/Trends";
import { Goals } from "./pages/Goals";
import { useSummary, useSetDayType } from "./api/hooks";
import { todayISO, shiftISO, prettyDate } from "./lib/format";
import type { DayType } from "./api/types";

type Tab = "today" | "log" | "trends" | "goals";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "log", label: "Log" },
  { id: "trends", label: "Trends" },
  { id: "goals", label: "Goals" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [date, setDate] = useState<string>(todayISO());

  // Summary owns the authoritative day_type for the selected date.
  const summary = useSummary(date);
  const setDayType = useSetDayType(date);
  const dayType: DayType = summary.data?.day_type ?? "training";

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="tick" />
          <h1>Ironlog</h1>
          <span className="sub">macro instrument</span>
        </div>

        <div className="controls">
          <div className="daytoggle">
            <button
              data-kind="training"
              className={dayType === "training" ? "on" : ""}
              onClick={() => setDayType.mutate("training")}
            >
              Training
            </button>
            <button
              data-kind="rest"
              className={dayType === "rest" ? "on" : ""}
              onClick={() => setDayType.mutate("rest")}
            >
              Rest
            </button>
          </div>

          <div className="stepper">
            <button onClick={() => setDate((d) => shiftISO(d, -1))} aria-label="Previous day">
              ‹
            </button>
            <span className="label">{prettyDate(date)}</span>
            <button
              onClick={() => setDate((d) => shiftISO(d, 1))}
              aria-label="Next day"
              disabled={date >= todayISO()}
              style={date >= todayISO() ? { opacity: 0.3, pointerEvents: "none" } : undefined}
            >
              ›
            </button>
          </div>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === "today" && <Today date={date} />}
        {tab === "log" && <Log date={date} />}
        {tab === "trends" && <Trends />}
        {tab === "goals" && <Goals />}
      </main>
    </div>
  );
}
