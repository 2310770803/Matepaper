const fs = require("node:fs");
const path = require("node:path");
const { DEFAULT_QUICK_CAPTURE_SHORTCUT } = require("./shortcut.cjs");

const MODULES = [
  { kind: "note", label: "本地便签", description: "轻量 Markdown/纯文本记录" },
  { kind: "memo", label: "备忘录", description: "带提醒时间的备忘事项" },
  { kind: "todo", label: "待办", description: "任务、优先级与完成状态" },
  { kind: "day", label: "日子记录", description: "日期、心情与生活片段" },
  { kind: "reading", label: "阅读记录", description: "书籍、进度与读后感" },
  { kind: "password", label: "密码本", description: "本地加密保存账号密码" },
];

const DEFAULT_SETTINGS = {
  theme: "paper",
  accent: "bamboo",
  animations: true,
  compactList: false,
  autoStart: false,
  fontScale: 1,
  quickCaptureShortcut: DEFAULT_QUICK_CAPTURE_SHORTCUT,
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
};

function normalizeBackground(rawBackground) {
  const background = rawBackground ?? {};
  return {
    ...DEFAULT_SETTINGS.background,
    opacity: background.opacity ?? DEFAULT_SETTINGS.background.opacity,
    blur: background.blur ?? DEFAULT_SETTINGS.background.blur,
    maskOpacity: background.maskOpacity ?? DEFAULT_SETTINGS.background.maskOpacity,
    vignette: background.vignette ?? DEFAULT_SETTINGS.background.vignette,
    fit: background.fit ?? DEFAULT_SETTINGS.background.fit,
    imageUrl: background.imageUrl,
    fileName: background.fileName,
  };
}

function normalizeSettings(rawSettings) {
  const settings = rawSettings ?? {};
  return {
    ...DEFAULT_SETTINGS,
    theme: settings.theme ?? DEFAULT_SETTINGS.theme,
    accent: settings.accent ?? DEFAULT_SETTINGS.accent,
    animations: settings.animations ?? DEFAULT_SETTINGS.animations,
    compactList: settings.compactList ?? DEFAULT_SETTINGS.compactList,
    autoStart: settings.autoStart ?? DEFAULT_SETTINGS.autoStart,
    fontScale: settings.fontScale ?? DEFAULT_SETTINGS.fontScale,
    quickCaptureShortcut: settings.quickCaptureShortcut ?? DEFAULT_SETTINGS.quickCaptureShortcut,
    quickCaptureDefaultKind: settings.quickCaptureDefaultKind ?? DEFAULT_SETTINGS.quickCaptureDefaultKind,
    showActivityHeatmap: settings.showActivityHeatmap ?? DEFAULT_SETTINGS.showActivityHeatmap,
    heatmapDays: settings.heatmapDays ?? DEFAULT_SETTINGS.heatmapDays,
    editorDensity: settings.editorDensity ?? DEFAULT_SETTINGS.editorDensity,
    background: normalizeBackground(settings.background),
  };
}

function createEmptyWorkspace(now) {
  return {
    version: 1,
    modules: MODULES,
    settings: DEFAULT_SETTINGS,
    entriesById: {},
    createdAt: now,
    updatedAt: now,
  };
}

function backupName(now) {
  return `matepaper-data.corrupt-${now.replace(/[:.]/g, "-")}.json`;
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function normalizeWorkspace(raw, now) {
  if (!raw || raw.version !== 1 || typeof raw.entriesById !== "object") {
    return createEmptyWorkspace(now);
  }
  return {
    version: 1,
    modules: MODULES,
    settings: normalizeSettings(raw.settings),
    entriesById: raw.entriesById ?? {},
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

function createLocalStore({ dataDir, now = () => new Date().toISOString() }) {
  const filePath = path.join(dataDir, "matepaper-data.json");

  return {
    filePath,
    load() {
      const currentTime = now();
      fs.mkdirSync(dataDir, { recursive: true });
      if (!fs.existsSync(filePath)) {
        const empty = createEmptyWorkspace(currentTime);
        writeJsonAtomic(filePath, empty);
        return empty;
      }

      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
        const workspace = normalizeWorkspace(parsed, currentTime);
        writeJsonAtomic(filePath, workspace);
        return workspace;
      } catch (_error) {
        fs.renameSync(filePath, path.join(dataDir, backupName(currentTime)));
        const empty = createEmptyWorkspace(currentTime);
        writeJsonAtomic(filePath, empty);
        return empty;
      }
    },
    save(workspace) {
      writeJsonAtomic(filePath, normalizeWorkspace(workspace, now()));
    },
  };
}

module.exports = {
  createLocalStore,
};
