import type { WorkspaceEntry } from "./types";

export interface ActivityHeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityHeatmapSummary {
  days: number;
  total: number;
  activeDays: number;
  activeRate: number;
  currentStreak: number;
  longestStreak: number;
  busiestDay?: ActivityHeatmapDay;
  lastActiveDate?: string;
}

export interface BuildActivityHeatmapOptions {
  days: number;
  now?: string;
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function levelFor(count: number): ActivityHeatmapDay["level"] {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

export function buildActivityHeatmap(
  entries: WorkspaceEntry[],
  options: BuildActivityHeatmapOptions,
): ActivityHeatmapDay[] {
  const days = Math.max(1, Math.floor(options.days));
  const end = new Date(options.now ?? new Date().toISOString());
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - days + 1);

  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (entry.archived) continue;
    const updated = new Date(entry.updatedAt || entry.createdAt);
    updated.setUTCHours(0, 0, 0, 0);
    if (updated < start || updated > end) continue;
    const key = dateKey(updated);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = dateKey(date);
    const count = counts.get(key) ?? 0;
    return {
      date: key,
      count,
      level: levelFor(count),
    };
  });
}

export function summarizeActivityHeatmap(heatmap: ActivityHeatmapDay[]): ActivityHeatmapSummary {
  let total = 0;
  let activeDays = 0;
  let currentRun = 0;
  let longestStreak = 0;
  let busiestDay: ActivityHeatmapDay | undefined;
  let lastActiveDate: string | undefined;

  for (const day of heatmap) {
    total += day.count;
    if (!busiestDay || day.count > busiestDay.count) busiestDay = day;

    if (day.count > 0) {
      activeDays += 1;
      currentRun += 1;
      longestStreak = Math.max(longestStreak, currentRun);
      lastActiveDate = day.date;
    } else {
      currentRun = 0;
    }
  }

  let currentStreak = 0;
  for (let index = heatmap.length - 1; index >= 0; index -= 1) {
    if (heatmap[index].count <= 0) break;
    currentStreak += 1;
  }

  return {
    days: heatmap.length,
    total,
    activeDays,
    activeRate: heatmap.length ? activeDays / heatmap.length : 0,
    currentStreak,
    longestStreak,
    busiestDay: busiestDay && busiestDay.count > 0 ? busiestDay : undefined,
    lastActiveDate,
  };
}
