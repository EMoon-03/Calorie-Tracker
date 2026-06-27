// Small presentation helpers shared across pages.

export const MACRO_COLORS = {
  protein: "var(--protein)",
  carbs: "var(--carbs)",
  fat: "var(--fat)",
} as const;

export function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function shiftISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function prettyDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const today = todayISO();
  if (iso === today) return "Today";
  if (iso === shiftISO(today, -1)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const round = (n: number) => Math.round(n);

// 7-point trailing moving average for noisy daily bodyweight.
export function movingAverage(values: number[], window = 7): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    const slice = values.slice(i - window + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / window;
  });
}
