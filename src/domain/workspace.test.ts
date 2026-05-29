import { describe, expect, it } from "vitest";
import {
  createEntryDraft,
  createEmptyWorkspace,
  moduleStats,
  queryEntries,
  upsertEntry,
  updateEntry,
} from "./workspace";
import type { ToolKind } from "./types";

describe("workspace domain", () => {
  it("creates one empty bucket for every first-version tool", () => {
    const workspace = createEmptyWorkspace("2026-05-27T08:00:00.000Z");

    expect(workspace.version).toBe(1);
    expect(Object.keys(workspace.entriesById)).toEqual([]);
    expect(workspace.modules.map((module) => module.kind)).toEqual([
      "note",
      "memo",
      "todo",
      "day",
      "reading",
      "habit",
      "expense",
      "password",
    ] satisfies ToolKind[]);
    expect(workspace.settings).toEqual({
      theme: "paper",
      accent: "bamboo",
      animations: true,
      compactList: false,
      autoStart: false,
      fontScale: 1,
      quickCaptureShortcut: "Ctrl+Shift+Space",
      quickCaptureDefaultKind: "note",
      showActivityHeatmap: true,
      heatmapDays: 84,
      editorDensity: "comfortable",
      background: {
        opacity: 0.34,
        blur: 0,
        maskOpacity: 0.48,
        vignette: 0.22,
        fit: "cover",
      },
    });
  });

  it("upserts entries with stable metadata and descending update order", () => {
    const workspace = createEmptyWorkspace("2026-05-27T08:00:00.000Z");
    const note = createEntryDraft("note", {
      title: "灵感",
      body: "一个本地优先工具箱",
      now: "2026-05-27T08:01:00.000Z",
    });
    const todo = createEntryDraft("todo", {
      title: "完成 MVP",
      body: "先做本地便签、备忘录和待办",
      now: "2026-05-27T08:02:00.000Z",
    });

    const withNote = upsertEntry(workspace, note);
    const withBoth = upsertEntry(withNote, todo);

    expect(queryEntries(withBoth, { kind: "note" }).map((entry) => entry.title)).toEqual(["灵感"]);
    expect(queryEntries(withBoth, {}).map((entry) => entry.title)).toEqual(["完成 MVP", "灵感"]);
    expect(withBoth.entriesById[note.id].createdAt).toBe("2026-05-27T08:01:00.000Z");
  });

  it("creates usable defaults for every tool kind", () => {
    const now = "2026-05-27T08:00:00.000Z";

    const drafts = (["note", "memo", "todo", "day", "reading", "habit", "expense", "password"] satisfies ToolKind[]).map((kind) =>
      createEntryDraft(kind, { title: `${kind} title`, body: "", now }),
    );

    expect(drafts.map((entry) => entry.kind)).toEqual(["note", "memo", "todo", "day", "reading", "habit", "expense", "password"]);
    expect(drafts.find((entry) => entry.kind === "memo")?.memo).toEqual({});
    expect(drafts.find((entry) => entry.kind === "todo")?.todo).toMatchObject({
      completed: false,
      priority: "normal",
    });
    expect(drafts.find((entry) => entry.kind === "day")?.day).toEqual({ date: "2026-05-27", mood: undefined });
    expect(drafts.find((entry) => entry.kind === "reading")?.reading).toMatchObject({
      status: "planned",
      progress: 0,
    });
    expect(drafts.find((entry) => entry.kind === "habit")?.habit).toMatchObject({
      frequency: "daily",
      streak: 0,
    });
    expect(drafts.find((entry) => entry.kind === "expense")?.expense).toMatchObject({
      type: "expense",
      date: "2026-05-27",
    });
    expect(drafts.find((entry) => entry.kind === "password")?.password).toEqual({
      username: undefined,
      url: undefined,
      secretVault: undefined,
      updatedSecretAt: undefined,
    });
  });

  it("filters across title, body, tags, and kind-specific fields", () => {
    const workspace = [
      createEntryDraft("reading", {
        title: "Designing Data-Intensive Applications",
        body: "数据库与分布式系统阅读记录",
        tags: ["backend", "book"],
        reading: { author: "Martin Kleppmann", status: "reading", progress: 32 },
        now: "2026-05-27T08:00:00.000Z",
      }),
      createEntryDraft("day", {
        title: "项目启动日",
        body: "确定 A+C 产品方向",
        day: { date: "2026-05-27", mood: "steady" },
        now: "2026-05-27T08:01:00.000Z",
      }),
      createEntryDraft("password", {
        title: "GitHub",
        body: "开发账号",
        password: { username: "dev@example.com", url: "https://github.com" },
        now: "2026-05-27T08:02:00.000Z",
      }),
    ].reduce((state, entry) => upsertEntry(state, entry), createEmptyWorkspace());

    expect(queryEntries(workspace, { search: "kleppmann" })).toHaveLength(1);
    expect(queryEntries(workspace, { search: "A+C" })).toHaveLength(1);
    expect(queryEntries(workspace, { search: "backend" })).toHaveLength(1);
    expect(queryEntries(workspace, { search: "dev@example.com" })).toHaveLength(1);
  });

  it("updates todo completion without changing unrelated entries", () => {
    const workspace = createEmptyWorkspace("2026-05-27T08:00:00.000Z");
    const todo = createEntryDraft("todo", {
      title: "写测试",
      body: "",
      now: "2026-05-27T08:01:00.000Z",
    });
    const note = createEntryDraft("note", {
      title: "旁路记录",
      body: "不应被修改",
      now: "2026-05-27T08:02:00.000Z",
    });
    const loaded = upsertEntry(upsertEntry(workspace, todo), note);

    const updated = updateEntry(loaded, todo.id, (entry) => ({
      ...entry,
      todo: { ...entry.todo, completed: true, completedAt: "2026-05-27T08:03:00.000Z" },
      updatedAt: "2026-05-27T08:03:00.000Z",
    }));

    expect(updated.entriesById[todo.id].todo?.completed).toBe(true);
    expect(updated.entriesById[note.id]).toEqual(loaded.entriesById[note.id]);
  });

  it("reports active, completed, and archived counts per module", () => {
    const workspace = [
      createEntryDraft("todo", {
        title: "已完成",
        body: "",
        todo: { completed: true },
        now: "2026-05-27T08:00:00.000Z",
      }),
      createEntryDraft("todo", {
        title: "进行中",
        body: "",
        todo: { completed: false },
        now: "2026-05-27T08:01:00.000Z",
      }),
      { ...createEntryDraft("memo", { title: "归档备忘", body: "", now: "2026-05-27T08:02:00.000Z" }), archived: true },
    ].reduce((state, entry) => upsertEntry(state, entry), createEmptyWorkspace());

    expect(moduleStats(workspace, "todo")).toEqual({ total: 2, active: 1, completed: 1, archived: 0 });
    expect(moduleStats(workspace, "memo")).toEqual({ total: 1, active: 0, completed: 0, archived: 1 });
  });
});
