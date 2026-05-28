import { describe, expect, it } from "vitest";
import { buildActivityHeatmap, summarizeActivityHeatmap } from "./activity";
import type { WorkspaceEntry } from "./types";

function entry(id: string, kind: WorkspaceEntry["kind"], updatedAt: string): WorkspaceEntry {
  return {
    id,
    kind,
    title: id,
    body: "",
    tags: [],
    favorite: false,
    archived: false,
    createdAt: updatedAt,
    updatedAt,
  };
}

describe("activity heatmap", () => {
  it("builds fixed date buckets and levels from entry update dates", () => {
    const heatmap = buildActivityHeatmap(
      [
        entry("note_1", "note", "2026-05-25T09:00:00.000Z"),
        entry("todo_1", "todo", "2026-05-25T12:00:00.000Z"),
        entry("day_1", "day", "2026-05-27T12:00:00.000Z"),
      ],
      { days: 5, now: "2026-05-27T23:00:00.000Z" },
    );

    expect(heatmap.map((day) => day.date)).toEqual([
      "2026-05-23",
      "2026-05-24",
      "2026-05-25",
      "2026-05-26",
      "2026-05-27",
    ]);
    expect(heatmap.map((day) => day.count)).toEqual([0, 0, 2, 0, 1]);
    expect(heatmap.find((day) => day.date === "2026-05-25")?.level).toBeGreaterThan(0);
  });

  it("summarizes active days, totals, and streaks", () => {
    const summary = summarizeActivityHeatmap([
      { date: "2026-05-22", count: 0, level: 0 },
      { date: "2026-05-23", count: 1, level: 1 },
      { date: "2026-05-24", count: 2, level: 2 },
      { date: "2026-05-25", count: 0, level: 0 },
      { date: "2026-05-26", count: 4, level: 3 },
      { date: "2026-05-27", count: 1, level: 1 },
    ]);

    expect(summary.total).toBe(8);
    expect(summary.activeDays).toBe(4);
    expect(summary.currentStreak).toBe(2);
    expect(summary.longestStreak).toBe(2);
    expect(summary.busiestDay?.date).toBe("2026-05-26");
    expect(summary.lastActiveDate).toBe("2026-05-27");
  });
});
