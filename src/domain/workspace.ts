import type {
  CreateEntryOptions,
  EntryQuery,
  ModuleStats,
  AppSettings,
  ToolKind,
  ToolModule,
  Workspace,
  WorkspaceEntry,
} from "./types";

export const FIRST_VERSION_MODULES: ToolModule[] = [
  { kind: "note", label: "本地便签", description: "轻量 Markdown/纯文本记录" },
  { kind: "memo", label: "备忘录", description: "带提醒时间的备忘事项" },
  { kind: "todo", label: "待办", description: "任务、优先级与完成状态" },
  { kind: "day", label: "日子记录", description: "日期、心情与生活片段" },
  { kind: "reading", label: "阅读记录", description: "书籍、进度与读后感" },
  { kind: "password", label: "密码本", description: "本地加密保存账号密码" },
];

export const DEFAULT_SETTINGS: AppSettings = {
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
};

function isoNow() {
  return new Date().toISOString();
}

function createId(kind: ToolKind): string {
  const random =
    globalThis.crypto && "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${kind}_${random}`;
}

export function createEmptyWorkspace(now = isoNow()): Workspace {
  return {
    version: 1,
    modules: FIRST_VERSION_MODULES,
    settings: DEFAULT_SETTINGS,
    entriesById: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function createEntryDraft(kind: ToolKind, options: CreateEntryOptions): WorkspaceEntry {
  const now = options.now ?? isoNow();
  const base: WorkspaceEntry = {
    id: createId(kind),
    kind,
    title: options.title.trim(),
    body: options.body,
    tags: options.tags ?? [],
    favorite: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  if (kind === "memo") {
    base.memo = { ...options.memo };
  }
  if (kind === "todo") {
    base.todo = {
      completed: options.todo?.completed ?? false,
      dueDate: options.todo?.dueDate,
      priority: options.todo?.priority ?? "normal",
      completedAt: options.todo?.completedAt,
    };
  }
  if (kind === "day") {
    base.day = {
      date: options.day?.date ?? now.slice(0, 10),
      mood: options.day?.mood,
    };
  }
  if (kind === "reading") {
    base.reading = {
      author: options.reading?.author,
      status: options.reading?.status ?? "planned",
      progress: options.reading?.progress ?? 0,
      currentPage: options.reading?.currentPage,
      totalPages: options.reading?.totalPages,
      rating: options.reading?.rating,
      startedAt: options.reading?.startedAt,
      finishedAt: options.reading?.finishedAt,
    };
  }
  if (kind === "password") {
    base.password = {
      username: options.password?.username,
      url: options.password?.url,
      secretVault: options.password?.secretVault,
      updatedSecretAt: options.password?.updatedSecretAt,
    };
  }

  return base;
}

export function upsertEntry(workspace: Workspace, entry: WorkspaceEntry): Workspace {
  return {
    ...workspace,
    updatedAt: entry.updatedAt,
    entriesById: {
      ...workspace.entriesById,
      [entry.id]: entry,
    },
  };
}

export function updateEntry(
  workspace: Workspace,
  id: string,
  updater: (entry: WorkspaceEntry) => WorkspaceEntry,
): Workspace {
  const existing = workspace.entriesById[id];
  if (!existing) return workspace;
  return upsertEntry(workspace, updater(existing));
}

function searchableText(entry: WorkspaceEntry): string {
  return [
    entry.title,
    entry.body,
    ...entry.tags,
    entry.memo?.remindAt,
    entry.todo?.dueDate,
    entry.todo?.priority,
    entry.day?.date,
    entry.day?.mood,
    entry.reading?.author,
    entry.reading?.status,
    entry.reading?.currentPage?.toString(),
    entry.reading?.totalPages?.toString(),
    entry.reading?.rating?.toString(),
    entry.password?.username,
    entry.password?.url,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function queryEntries(workspace: Workspace, query: EntryQuery): WorkspaceEntry[] {
  const search = query.search?.trim().toLowerCase();
  return Object.values(workspace.entriesById)
    .filter((entry) => (query.kind ? entry.kind === query.kind : true))
    .filter((entry) => (query.includeArchived ? true : !entry.archived))
    .filter((entry) => (search ? searchableText(entry).includes(search) : true))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function moduleStats(workspace: Workspace, kind: ToolKind): ModuleStats {
  const entries = Object.values(workspace.entriesById).filter((entry) => entry.kind === kind);
  const archived = entries.filter((entry) => entry.archived).length;
  const completed = entries.filter((entry) => entry.todo?.completed).length;
  const active = entries.filter((entry) => !entry.archived && !entry.todo?.completed).length;
  return {
    total: entries.length,
    active,
    completed,
    archived,
  };
}
