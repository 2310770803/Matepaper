const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { createLocalStore } = require("./localStore.cjs");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "matepaper-store-"));
}

describe("localStore", () => {
  it("creates an empty workspace when no file exists", () => {
    const dir = tempDir();
    const store = createLocalStore({ dataDir: dir, now: () => "2026-05-27T08:00:00.000Z" });

    const workspace = store.load();

    expect(workspace.version).toBe(1);
    expect(workspace.modules.map((module) => module.kind)).toEqual([
      "note",
      "memo",
      "todo",
      "day",
      "reading",
      "habit",
      "expense",
      "password",
    ]);
    expect(workspace.settings.theme).toBe("paper");
    expect(fs.existsSync(path.join(dir, "matepaper-data.json"))).toBe(true);
  });

  it("persists snapshots with atomic JSON writes", () => {
    const dir = tempDir();
    const store = createLocalStore({ dataDir: dir, now: () => "2026-05-27T08:00:00.000Z" });
    const workspace = store.load();
    workspace.entriesById.note_1 = {
      id: "note_1",
      kind: "note",
      title: "本地便签",
      body: "独立实现，不复用参考项目代码",
      tags: [],
      favorite: false,
      archived: false,
      createdAt: "2026-05-27T08:00:00.000Z",
      updatedAt: "2026-05-27T08:00:00.000Z",
    };

    store.save(workspace);

    const persisted = JSON.parse(fs.readFileSync(path.join(dir, "matepaper-data.json"), "utf8"));
    expect(persisted.entriesById.note_1.title).toBe("本地便签");
    expect(fs.existsSync(path.join(dir, "matepaper-data.json.tmp"))).toBe(false);
  });

  it("backs up corrupt JSON and repairs with an empty workspace", () => {
    const dir = tempDir();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "matepaper-data.json"), "{ broken json", "utf8");
    const store = createLocalStore({ dataDir: dir, now: () => "2026-05-27T08:00:00.000Z" });

    const workspace = store.load();
    const backups = fs.readdirSync(dir).filter((name) => name.startsWith("matepaper-data.corrupt-"));

    expect(workspace.version).toBe(1);
    expect(backups).toHaveLength(1);
  });

  it("normalizes settings and drops unsupported persisted fields", () => {
    const dir = tempDir();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "matepaper-data.json"),
      JSON.stringify({
        version: 1,
        modules: [],
        settings: {
          theme: "dark",
          accent: "rose",
          autoStart: true,
          fontScale: 1.1,
          unsupportedSetting: true,
          background: {
            opacity: 0.62,
            unknownBackgroundOption: "legacy",
            imageUrl: "matepaper-bg://local/background.png",
            fileName: "background.png",
          },
        },
        entriesById: {},
        createdAt: "2026-05-27T08:00:00.000Z",
        updatedAt: "2026-05-27T08:00:00.000Z",
      }),
      "utf8",
    );
    const store = createLocalStore({ dataDir: dir, now: () => "2026-05-27T08:00:00.000Z" });

    const workspace = store.load();
    const persisted = JSON.parse(fs.readFileSync(path.join(dir, "matepaper-data.json"), "utf8"));

    expect(workspace.settings).not.toHaveProperty("unsupportedSetting");
    expect(workspace.settings.autoStart).toBe(true);
    expect(workspace.settings.fontScale).toBe(1.1);
    expect(workspace.settings.background).not.toHaveProperty("unknownBackgroundOption");
    expect(workspace.settings.background.opacity).toBe(0.62);
    expect(persisted.settings).not.toHaveProperty("unsupportedSetting");
    expect(persisted.settings.background).not.toHaveProperty("unknownBackgroundOption");
  });
});
