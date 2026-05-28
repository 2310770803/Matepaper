import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlarmClock,
  BookMarked,
  CalendarClock,
  Check,
  ChevronDown,
  CircleDot,
  Cloud,
  Copy,
  Droplets,
  Eraser,
  Eye,
  FileDown,
  Filter,
  Image,
  KeyRound,
  Keyboard,
  Layers,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Maximize2,
  Minus,
  MoreHorizontal,
  NotebookPen,
  Palette,
  Pin,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Tags,
  Trash2,
  Type,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import { matepaperApi, type QuickCaptureShortcutStatus } from "./api/matepaperApi";
import { buildActivityHeatmap, summarizeActivityHeatmap } from "./domain/activity";
import { markdownImportToNote } from "./domain/importMarkdown";
import { decryptPasswordSecret, encryptPasswordSecret } from "./domain/passwordVault";
import {
  createEntryDraft,
  moduleStats,
  queryEntries,
  updateEntry,
  upsertEntry,
} from "./domain/workspace";
import type {
  AccentOption,
  AppSettings,
  EditorDensity,
  PasswordFields,
  ReadingFields,
  ReadingStatus,
  ThemeOption,
  TodoFields,
  ToolKind,
  Workspace,
  WorkspaceEntry,
} from "./domain/types";
import { applyAppearanceSettings } from "./ui/appearance";
import { MODULE_META } from "./ui/moduleMeta";

const QUICK_KINDS: ToolKind[] = ["note", "memo", "todo", "day", "reading", "password"];
const QUICK_SHORTCUT_CHOICES = ["Ctrl+Shift+Space", "Ctrl+Alt+N", "Alt+Space", "Ctrl+Space"];
const HEATMAP_DAY_CHOICES = [28, 84, 168];
const MOOD_OPTIONS = ["平静", "开心", "疲惫", "专注", "焦虑", "松弛"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function toDateTimeLocalValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function dateTimeAfterHours(hours: number) {
  return toDateTimeLocalValue(new Date(Date.now() + hours * 60 * 60 * 1000));
}

function tonightDateTime() {
  const date = new Date();
  date.setHours(20, 0, 0, 0);
  return toDateTimeLocalValue(date);
}

function tomorrowMorningDateTime() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return toDateTimeLocalValue(date);
}

function contentLength(entry: WorkspaceEntry) {
  return entry.body.replace(/\s+/g, "").length;
}

function rangeTrackStyle(value: number, min: number, max: number): React.CSSProperties {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return { "--range-pct": `${percent}%` } as React.CSSProperties;
}

function isPinned(entry: WorkspaceEntry) {
  return entry.tags.includes("置顶");
}

function togglePinnedTags(entry: WorkspaceEntry) {
  if (isPinned(entry)) return entry.tags.filter((tag) => tag !== "置顶");
  return ["置顶", ...entry.tags];
}

function formatDateTimeShort(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16).replace("T", " ");
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (sameDay) return `今天 ${time}`;
  return `${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日 ${time}`;
}

function newEntryDefaults(kind: ToolKind) {
  const date = today();
  switch (kind) {
    case "note":
      return { title: "新的便签", body: "" };
    case "memo":
      return { title: "新的备忘", body: "" };
    case "todo":
      return { title: "新的待办", body: "", todo: { completed: false } };
    case "day":
      return { title: date, body: "", day: { date } };
    case "reading":
      return {
        title: "新的阅读记录",
        body: "",
        reading: { status: "reading" as const, progress: 0 },
      };
    case "password":
      return { title: "新的密码记录", body: "", password: { username: "", url: "" } };
  }
}

function entryPreview(entry: WorkspaceEntry) {
  if (entry.kind === "password") {
    const account = entry.password?.username || "未填写账号";
    return entry.password?.secretVault ? `${account} · 已加密` : `${account} · 未设置密码`;
  }
  if (entry.kind === "todo") {
    const priority = { low: "低优先级", normal: "普通", high: "高优先级" }[
      entry.todo?.priority ?? "normal"
    ];
    const due = entry.todo?.dueDate ? `截止 ${entry.todo.dueDate}` : "未设截止";
    return `${entry.todo?.completed ? "已完成" : "进行中"} · ${priority} · ${due}`;
  }
  if (entry.kind === "reading") {
    const status = {
      planned: "想读",
      reading: "在读",
      finished: "读完",
      paused: "暂停",
    }[entry.reading?.status ?? "planned"];
    const progress = `${entry.reading?.progress ?? 0}%`;
    const pages =
      entry.reading?.currentPage || entry.reading?.totalPages
        ? `${entry.reading?.currentPage ?? 0}/${entry.reading?.totalPages ?? "?"} 页`
        : "";
    return [entry.reading?.author, status, progress, pages].filter(Boolean).join(" · ");
  }
  if (entry.body.trim()) return entry.body.trim().replace(/\s+/g, " ").slice(0, 96);
  if (entry.kind === "day" && entry.day?.mood) return `心情：${entry.day.mood}`;
  return "还没有内容";
}

function todoFields(entry: WorkspaceEntry): TodoFields {
  return {
    completed: entry.todo?.completed ?? false,
    priority: entry.todo?.priority ?? "normal",
    dueDate: entry.todo?.dueDate,
    completedAt: entry.todo?.completedAt,
  };
}

function readingFields(entry: WorkspaceEntry): ReadingFields {
  return {
    status: entry.reading?.status ?? "planned",
    progress: entry.reading?.progress ?? 0,
    author: entry.reading?.author,
    currentPage: entry.reading?.currentPage,
    totalPages: entry.reading?.totalPages,
    rating: entry.reading?.rating,
    startedAt: entry.reading?.startedAt,
    finishedAt: entry.reading?.finishedAt,
  };
}

function passwordFields(entry: WorkspaceEntry): PasswordFields {
  return {
    username: entry.password?.username ?? "",
    url: entry.password?.url ?? "",
    secretVault: entry.password?.secretVault,
    updatedSecretAt: entry.password?.updatedSecretAt,
  };
}

function IconButton({
  title,
  onClick,
  children,
  active = false,
  danger = false,
  disabled = false,
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`editor-act ${active ? "active" : ""} ${danger ? "danger-icon" : ""}`}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Titlebar({
  compact = false,
  onSettings,
  settingsOpen = false,
}: {
  compact?: boolean;
  onSettings?: () => void;
  settingsOpen?: boolean;
}) {
  return (
    <header className="titlebar">
      <div className="brand-text">
        Matepaper
        <span className="brand-subtitle">— 记下生活的诗意</span>
      </div>
      <div className="title-actions">
        {onSettings ? (
          <button className={`tbtn ${settingsOpen ? 'active' : ''}`} onClick={onSettings} title="设置">
            <Settings size={16} />
          </button>
        ) : null}
        <button className="tbtn" onClick={() => void matepaperApi.minimizeCurrentWindow()} title="最小化">
          <Minus size={15} />
        </button>
        <button className="tbtn" onClick={() => void matepaperApi.toggleMaximizeCurrentWindow()} title="最大化">
          <Maximize2 size={14} />
        </button>
        <button className="tbtn close" onClick={() => void matepaperApi.closeCurrentWindow()} title="关闭">
          <X size={15} />
        </button>
      </div>
    </header>
  );
}

function ActivityHeatmap({ workspace }: { workspace: Workspace }) {
  if (!workspace.settings.showActivityHeatmap) return null;
  const entries = Object.values(workspace.entriesById);
  const days = workspace.settings.heatmapDays || 84;
  const heatmap = buildActivityHeatmap(entries, { days });
  const summary = summarizeActivityHeatmap(heatmap);
  const columns = Math.ceil(heatmap.length / 7);
  const heatmapCellSize = columns > 12 ? 5 : 12;
  const heatmapGap = columns > 12 ? 2 : 3;

  return (
    <section className="heatmap-card">
      <div className="heatmap-head">
        <div>
          <p className="eyebrow">ACTIVITY</p>
          <strong>{summary.total} 次记录</strong>
        </div>
        <Activity size={18} />
      </div>
      <div
        className="heatmap-grid"
        aria-label="最近活动热力图"
        style={
          {
            "--heatmap-cols": columns,
            "--heatmap-cell": `${heatmapCellSize}px`,
            "--heatmap-gap": `${heatmapGap}px`,
          } as React.CSSProperties
        }
      >
        {heatmap.map((day) => (
          <span
            key={day.date}
            className="heatmap-cell"
            data-lv={day.level}
            title={`${day.date} · ${day.count} 条记录`}
          />
        ))}
      </div>
      <div className="heatmap-legend" aria-hidden="true">
        <span>少</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <i key={level} data-lv={level} />
        ))}
        <span>多</span>
      </div>
      <div className="heatmap-summary">
        <span>{summary.days}天</span>
        <span>活跃{summary.activeDays}天</span>
        <span>连续{summary.currentStreak}天</span>
      </div>
      <div className="heatmap-detail">
        <span>活跃率 {Math.round(summary.activeRate * 100)}%</span>
        <span>{summary.busiestDay ? `峰值 ${summary.busiestDay.count}条` : "暂无峰值"}</span>
      </div>
    </section>
  );
}

function ModuleSidebar({
  workspace,
  activeKind,
  includeArchived,
  onSelect,
  onQuickCapture,
  onImportMarkdown,
  onToggleArchived,
}: {
  workspace: Workspace;
  activeKind: ToolKind;
  includeArchived: boolean;
  onSelect: (kind: ToolKind) => void;
  onQuickCapture: () => void;
  onImportMarkdown: () => void;
  onToggleArchived: () => void;
}) {
  const total = Object.values(workspace.entriesById).filter((entry) => !entry.archived).length;
  const favoriteTotal = Object.values(workspace.entriesById).filter(
    (entry) => entry.favorite && !entry.archived,
  ).length;

  return (
    <aside className="sidebar">
      <div className="ws-card">
        <div className="ws-head">
          <span>LOCAL TOOLKIT</span>
          <Sparkles size={16} />
        </div>
        <div className="ws-stats">
          <span className="ws-stat">
            <strong>{total}</strong>
            活跃记录
          </span>
          <span className="ws-stat">
            <strong>{favoriteTotal}</strong>
            收藏
          </span>
        </div>
        <div className="ws-actions">
          <button className="btn btn-primary" type="button" onClick={onImportMarkdown}>
            <FileDown size={16} />
            导入
          </button>
        </div>
      </div>

      <nav className="module-nav">
        {workspace.modules.map((module) => {
          const meta = MODULE_META[module.kind];
          const stats = moduleStats(workspace, module.kind);
          const Icon = meta.Icon;
          return (
            <button
              key={module.kind}
              type="button"
              className={`module-btn ${activeKind === module.kind ? "active" : ""}`}
              data-accent={meta.accent}
              onClick={() => onSelect(module.kind)}
            >
              <span className="module-icon" data-accent={meta.accent}>
                <Icon size={18} strokeWidth={2.1} />
              </span>
              <span>
                <span className="ml">{meta.label}</span>
                <span className="md">{meta.description}</span>
              </span>
              <span className="module-cnt">{stats.active}</span>
            </button>
          );
        })}
      </nav>
      <ActivityHeatmap workspace={workspace} />
      <div className="sidebar-footer">
        <IconButton title="标签" onClick={() => onSelect("note")}>
          <Tag size={16} />
        </IconButton>
        <IconButton title={includeArchived ? "隐藏归档" : "查看归档"} active={includeArchived} onClick={onToggleArchived}>
          <Trash2 size={16} />
        </IconButton>
        <IconButton title="导入 Markdown" onClick={onImportMarkdown}>
          <Cloud size={16} />
        </IconButton>
      </div>
    </aside>
  );
}

function EntryList({
  entries,
  activeKind,
  selectedId,
  search,
  favoritesOnly,
  onSearch,
  onSelect,
  onCreate,
  onToggleFavoritesOnly,
}: {
  entries: WorkspaceEntry[];
  activeKind: ToolKind;
  selectedId: string | null;
  search: string;
  favoritesOnly: boolean;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  onCreate: (kind?: ToolKind) => void;
  onToggleFavoritesOnly: () => void;
}) {
  const meta = MODULE_META[activeKind];
  const Icon = meta.Icon;
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  return (
    <section className="entry-list" id="listCol">
      <div className="list-header">
        <div className="list-header-left">
          <span className="module-icon" data-accent={meta.accent}>
            <Icon size={18} />
          </span>
          <div>
            <span>{meta.label}</span>
            <h2>{entries.length} 条记录</h2>
          </div>
        </div>
        <div className="new-entry-menu">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCreateMenuOpen((open) => !open)}
          >
            <Plus size={16} />
            新建
            <ChevronDown size={14} />
          </button>
          {createMenuOpen ? (
            <div className="new-menu-popover">
              {QUICK_KINDS.map((kind) => {
                const itemMeta = MODULE_META[kind];
                const ItemIcon = itemMeta.Icon;
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      onCreate(kind);
                    }}
                  >
                    <ItemIcon size={15} />
                    {itemMeta.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
      <div className="list-controls">
        <label className="search-wrap">
          <Search size={16} />
          <input
            placeholder="搜索标题、正文、标签、账号..."
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>
        <button
          type="button"
          className={`btn btn-ghost ${favoritesOnly ? "active" : ""}`}
          onClick={onToggleFavoritesOnly}
        >
          <Filter size={15} />
          筛选
        </button>
      </div>
      <div className="entries-scroll">
        {entries.map((entry) => {
          const entryMeta = MODULE_META[entry.kind];
          const visibleTags = entry.tags.filter((tag) => tag !== "置顶").slice(0, 2);
          return (
            <button
              key={entry.id}
              type="button"
              className={`entry-card ${selectedId === entry.id ? "selected" : ""}`}
              data-accent={entryMeta.accent}
              onClick={() => onSelect(entry.id)}
            >
              <span className="entry-ttl">
                {isPinned(entry) ? <Pin className="pin" size={14} fill="currentColor" /> : null}
                {entry.todo?.completed ? <Check size={14} /> : null}
                {entry.title || "未命名"}
                {entry.favorite ? <Star className="star" size={14} fill="currentColor" /> : null}
              </span>
              <span className="entry-pv">{entryPreview(entry)}</span>
              <span className="entry-mt">
                <span className="entry-tgs">
                  {visibleTags.length ? (
                    visibleTags.map((tag) => <span key={tag}>{tag}</span>)
                  ) : (
                    <span>{entryMeta.label}</span>
                  )}
                </span>
                <span>{formatDateTimeShort(entry.updatedAt)}</span>
              </span>
            </button>
          );
        })}
        {entries.length === 0 ? <div className="empty-st">这里暂时是空的。</div> : null}
      </div>
    </section>
  );
}

function PasswordEditor({
  entry,
  onPatch,
}: {
  entry: WorkspaceEntry;
  onPatch: (patch: Partial<WorkspaceEntry>) => Promise<void>;
}) {
  const [masterPassword, setMasterPassword] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [revealedSecret, setRevealedSecret] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setSecretInput("");
    setRevealedSecret("");
    setStatus("");
    setMasterPassword("");
  }, [entry.id]);

  const fields = passwordFields(entry);

  function generatePassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    const bytes = new Uint32Array(18);
    globalThis.crypto.getRandomValues(bytes);
    setSecretInput(Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join(""));
    setStatus("已生成新密码，保存前请确认主密码");
  }

  async function saveSecret() {
    if (!secretInput || !masterPassword) {
      setStatus("请填写主密码和要保存的密码");
      return;
    }
    const secretVault = await encryptPasswordSecret(secretInput, masterPassword);
    await onPatch({
      password: {
        ...fields,
        secretVault,
        updatedSecretAt: new Date().toISOString(),
      },
    });
    setSecretInput("");
    setRevealedSecret("");
    setStatus("密码已加密保存");
  }

  async function revealSecret() {
    if (!fields.secretVault) {
      setStatus("还没有保存密码");
      return;
    }
    try {
      const plain = await decryptPasswordSecret(fields.secretVault, masterPassword);
      setRevealedSecret(plain);
      setStatus("已解锁");
    } catch (error) {
      setRevealedSecret("");
      setStatus(error instanceof Error ? error.message : "无法解密密码");
    }
  }

  async function copySecret() {
    if (!revealedSecret) return;
    await navigator.clipboard.writeText(revealedSecret);
    setStatus("已复制");
  }

  return (
    <div className="password-panel">
      <div className="two-fields">
        <label className="field-line">
          <span>账号</span>
          <input
            value={fields.username ?? ""}
            onChange={(event) => void onPatch({ password: { ...fields, username: event.target.value } })}
          />
        </label>
        <label className="field-line">
          <span>网址</span>
          <input
            value={fields.url ?? ""}
            onChange={(event) => void onPatch({ password: { ...fields, url: event.target.value } })}
          />
        </label>
      </div>

      <div className="vault-box">
        <div className="vault-state">
          <span className="vault-icon">
            {fields.secretVault ? <ShieldCheck size={18} /> : <LockKeyhole size={18} />}
          </span>
          <div>
            <strong>{fields.secretVault ? "已加密保存" : "未设置密码"}</strong>
            <small>
              {fields.updatedSecretAt
                ? `更新于 ${formatDate(fields.updatedSecretAt)}`
                : "本地加密，不保存主密码"}
            </small>
          </div>
        </div>
        <input
          type="password"
          value={masterPassword}
          onChange={(event) => setMasterPassword(event.target.value)}
          placeholder="主密码"
        />
        <input
          type="password"
          value={secretInput}
          onChange={(event) => setSecretInput(event.target.value)}
          placeholder="新密码"
        />
        <div className="vault-actions">
          <button className="btn btn-primary" type="button" onClick={() => void saveSecret()}>
            <KeyRound size={16} />
            加密保存
          </button>
          <button className="btn btn-ghost" type="button" onClick={generatePassword}>
            <WandSparkles size={16} />
            生成
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => void revealSecret()}>
            <Eye size={16} />
            解锁查看
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={!revealedSecret}
            onClick={() => void copySecret()}
          >
            <Copy size={16} />
            复制
          </button>
        </div>
        {revealedSecret ? <code className="revealed-secret">{revealedSecret}</code> : null}
        {status ? <p className="inline-status">{status}</p> : null}
      </div>
    </div>
  );
}

function EntryInsightPanel({ entry }: { entry: WorkspaceEntry }) {
  const cards: Array<{ label: string; value: string; icon: React.ReactNode }> = [];
  const length = `${contentLength(entry)} 字`;

  if (entry.kind === "note") {
    cards.push(
      { label: "正文", value: length, icon: <Type size={15} /> },
      { label: "标签", value: `${entry.tags.length} 个`, icon: <Tags size={15} /> },
      { label: "收藏", value: entry.favorite ? "已收藏" : "未收藏", icon: <Star size={15} /> },
    );
  }
  if (entry.kind === "memo") {
    const remindAt = entry.memo?.remindAt;
    const status = remindAt
      ? new Date(remindAt).getTime() < Date.now()
        ? "已到时"
        : "待提醒"
      : "未设置";
    cards.push(
      { label: "提醒", value: remindAt ? remindAt.replace("T", " ") : "未设置", icon: <AlarmClock size={15} /> },
      { label: "状态", value: status, icon: <CircleDot size={15} /> },
      { label: "正文", value: length, icon: <Type size={15} /> },
    );
  }
  if (entry.kind === "todo") {
    const priority = { low: "低", normal: "普通", high: "高" }[entry.todo?.priority ?? "normal"];
    cards.push(
      { label: "状态", value: entry.todo?.completed ? "已完成" : "进行中", icon: <ListChecks size={15} /> },
      { label: "优先级", value: priority, icon: <CircleDot size={15} /> },
      { label: "截止", value: entry.todo?.dueDate ?? "未设置", icon: <CalendarClock size={15} /> },
    );
  }
  if (entry.kind === "day") {
    cards.push(
      { label: "日期", value: entry.day?.date ?? formatDate(entry.createdAt), icon: <CalendarClock size={15} /> },
      { label: "心情", value: entry.day?.mood || "未记录", icon: <Sparkles size={15} /> },
      { label: "正文", value: length, icon: <Type size={15} /> },
    );
  }
  if (entry.kind === "reading") {
    const status = { planned: "想读", reading: "在读", finished: "读完", paused: "暂停" }[
      entry.reading?.status ?? "planned"
    ];
    cards.push(
      { label: "状态", value: status, icon: <BookMarked size={15} /> },
      { label: "进度", value: `${entry.reading?.progress ?? 0}%`, icon: <Activity size={15} /> },
      { label: "评分", value: entry.reading?.rating ? `${entry.reading.rating}/5` : "未评分", icon: <Star size={15} /> },
    );
  }
  if (entry.kind === "password") {
    cards.push(
      { label: "账号", value: entry.password?.username || "未填写", icon: <KeyRound size={15} /> },
      { label: "密文", value: entry.password?.secretVault ? "已加密" : "未保存", icon: <ShieldCheck size={15} /> },
      { label: "网址", value: entry.password?.url || "未填写", icon: <NotebookPen size={15} /> },
    );
  }

  return (
    <section className="insight-grid">
      {cards.map((card) => (
        <div className="insight-card" key={card.label}>
          <span>{card.icon}</span>
          <div>
            <small>{card.label}</small>
            <strong>{card.value}</strong>
          </div>
        </div>
      ))}
      {entry.kind === "reading" ? (
        <div className="progress-track">
          <span style={{ width: `${Math.min(100, Math.max(0, entry.reading?.progress ?? 0))}%` }} />
        </div>
      ) : null}
    </section>
  );
}

function EditorPane({
  entry,
  onPatch,
  onArchive,
}: {
  entry: WorkspaceEntry | null;
  onPatch: (patch: Partial<WorkspaceEntry>) => Promise<void>;
  onArchive: () => void;
}) {
  if (!entry) {
    return (
      <main className="editor-pane editor-empty">
        <p>选择一条记录，或者新建一个开始。</p>
      </main>
    );
  }

  const currentEntry = entry;
  const meta = MODULE_META[entry.kind];
  const Icon = meta.Icon;
  const pinned = isPinned(entry);
  const tagsInputRef = useRef<HTMLInputElement>(null);

  async function appendMarkdown(snippet: string) {
    const spacer = currentEntry.body && !currentEntry.body.endsWith("\n") ? "\n" : "";
    await onPatch({ body: `${currentEntry.body}${spacer}${snippet}` });
  }

  return (
    <main className="editor-pane" data-accent={meta.accent} key={entry.id}>
      <div className="editor-hdr">
        <span className="editor-badge" data-accent={meta.accent}>
          <Icon size={13} />
          {meta.label}
        </span>
        <div className="editor-acts">
          <IconButton
            title={pinned ? "取消置顶" : "置顶"}
            active={pinned}
            onClick={() => void onPatch({ tags: togglePinnedTags(entry) })}
          >
            <Pin size={16} fill={pinned ? "currentColor" : "none"} />
          </IconButton>
          <IconButton
            title={entry.favorite ? "取消收藏" : "收藏"}
            active={entry.favorite}
            onClick={() => void onPatch({ favorite: !entry.favorite })}
          >
            <Star size={17} fill={entry.favorite ? "currentColor" : "none"} />
          </IconButton>
          <IconButton title="归档" onClick={onArchive} danger>
            <MoreHorizontal size={17} />
          </IconButton>
        </div>
      </div>

      <section className="editor-title-block">
        <input
          className="editor-tti"
          value={entry.title}
          onChange={(event) => void onPatch({ title: event.target.value })}
          placeholder="标题"
        />
        <div className="editor-tags">
          <span className="editor-kind-chip" data-accent={meta.accent}>
            <Icon size={13} />
            {meta.label}
          </span>
          {entry.tags
            .filter((tag) => tag !== "置顶")
            .map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          <button
            type="button"
            className="editor-add-tag"
            onClick={() => tagsInputRef.current?.focus()}
          >
            <Plus size={12} />
            添加标签
          </button>
        </div>
        <div className="editor-ml">
          <span>
            <CalendarClock size={14} />
            {formatDateTimeShort(entry.createdAt)}
          </span>
          <span>创建于 {entry.createdAt.slice(0, 16).replace("T", " ")}</span>
        </div>
      </section>

      <EntryInsightPanel entry={entry} />

      {entry.kind === "note" ? (
        <div className="note-tools">
          <button type="button" onClick={() => void appendMarkdown("## 小标题\n")}>
            <Type size={15} />
            小标题
          </button>
          <button type="button" onClick={() => void appendMarkdown("- [ ] 待办项\n")}>
            <ListChecks size={15} />
            清单
          </button>
          <button type="button" onClick={() => void appendMarkdown("> 引用内容\n")}>
            <NotebookPen size={15} />
            引用
          </button>
        </div>
      ) : null}

      {entry.kind === "memo" ? (
        <div className="memo-tools">
          <label className="field-line">
            <span>提醒时间</span>
            <input
              type="datetime-local"
              value={entry.memo?.remindAt ?? ""}
              onChange={(event) => void onPatch({ memo: { ...entry.memo, remindAt: event.target.value } })}
            />
          </label>
          <div className="quick-presets">
            <button type="button" onClick={() => void onPatch({ memo: { ...entry.memo, remindAt: dateTimeAfterHours(1) } })}>
              1 小时
            </button>
            <button type="button" onClick={() => void onPatch({ memo: { ...entry.memo, remindAt: tonightDateTime() } })}>
              今晚
            </button>
            <button
              type="button"
              onClick={() => void onPatch({ memo: { ...entry.memo, remindAt: tomorrowMorningDateTime() } })}
            >
              明早
            </button>
          </div>
        </div>
      ) : null}

      {entry.kind === "todo" ? (
        <div className="todo-line">
          <label>
            <input
              type="checkbox"
              checked={entry.todo?.completed ?? false}
              onChange={(event) =>
                void onPatch({
                  todo: {
                    ...todoFields(entry),
                    completed: event.target.checked,
                    completedAt: event.target.checked ? new Date().toISOString() : undefined,
                  },
                })
              }
            />
            已完成
          </label>
          <input
            type="date"
            value={entry.todo?.dueDate ?? ""}
            onChange={(event) => void onPatch({ todo: { ...todoFields(entry), dueDate: event.target.value } })}
          />
          <select
            value={entry.todo?.priority ?? "normal"}
            onChange={(event) =>
              void onPatch({
                todo: {
                  ...todoFields(entry),
                  priority: event.target.value as TodoFields["priority"],
                },
              })
            }
          >
            <option value="low">低优先级</option>
            <option value="normal">普通</option>
            <option value="high">高优先级</option>
          </select>
        </div>
      ) : null}

      {entry.kind === "day" ? (
        <div className="day-tools">
          <div className="two-fields">
            <label className="field-line">
              <span>日期</span>
              <input
                type="date"
                value={entry.day?.date ?? ""}
                onChange={(event) => void onPatch({ day: { ...entry.day, date: event.target.value } })}
              />
            </label>
            <label className="field-line">
              <span>心情</span>
              <input
                value={entry.day?.mood ?? ""}
                onChange={(event) =>
                  void onPatch({ day: { date: entry.day?.date ?? today(), mood: event.target.value } })
                }
                placeholder="平静 / 开心 / 专注..."
              />
            </label>
          </div>
          <div className="mood-row">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood}
                type="button"
                className={entry.day?.mood === mood ? "active" : ""}
                onClick={() => void onPatch({ day: { date: entry.day?.date ?? today(), mood } })}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {entry.kind === "reading" ? (
        <div className="reading-stack">
          <div className="reading-grid">
            <label className="field-line">
              <span>作者</span>
              <input
                value={entry.reading?.author ?? ""}
                onChange={(event) =>
                  void onPatch({ reading: { ...readingFields(entry), author: event.target.value } })
                }
              />
            </label>
            <label className="field-line">
              <span>状态</span>
              <select
                value={entry.reading?.status ?? "planned"}
                onChange={(event) =>
                  void onPatch({
                    reading: { ...readingFields(entry), status: event.target.value as ReadingStatus },
                  })
                }
              >
                <option value="planned">想读</option>
                <option value="reading">在读</option>
                <option value="finished">读完</option>
                <option value="paused">暂停</option>
              </select>
            </label>
            <label className="field-line">
              <span>进度 %</span>
              <input
                type="number"
                min="0"
                max="100"
                value={entry.reading?.progress ?? 0}
                onChange={(event) =>
                  void onPatch({ reading: { ...readingFields(entry), progress: Number(event.target.value) } })
                }
              />
            </label>
          </div>
          <div className="reading-grid reading-grid-detail">
            <label className="field-line">
              <span>当前页</span>
              <input
                type="number"
                min="0"
                value={entry.reading?.currentPage ?? ""}
                onChange={(event) =>
                  void onPatch({
                    reading: {
                      ...readingFields(entry),
                      currentPage: event.target.value ? Number(event.target.value) : undefined,
                    },
                  })
                }
              />
            </label>
            <label className="field-line">
              <span>总页数</span>
              <input
                type="number"
                min="0"
                value={entry.reading?.totalPages ?? ""}
                onChange={(event) =>
                  void onPatch({
                    reading: {
                      ...readingFields(entry),
                      totalPages: event.target.value ? Number(event.target.value) : undefined,
                    },
                  })
                }
              />
            </label>
            <label className="field-line">
              <span>评分</span>
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={entry.reading?.rating ?? ""}
                onChange={(event) =>
                  void onPatch({
                    reading: {
                      ...readingFields(entry),
                      rating: event.target.value ? Number(event.target.value) : undefined,
                    },
                  })
                }
              />
            </label>
            <label className="field-line">
              <span>开始</span>
              <input
                type="date"
                value={entry.reading?.startedAt ?? ""}
                onChange={(event) =>
                  void onPatch({ reading: { ...readingFields(entry), startedAt: event.target.value } })
                }
              />
            </label>
            <label className="field-line">
              <span>完成</span>
              <input
                type="date"
                value={entry.reading?.finishedAt ?? ""}
                onChange={(event) =>
                  void onPatch({ reading: { ...readingFields(entry), finishedAt: event.target.value } })
                }
              />
            </label>
          </div>
          <input
            className="reading-slider"
            type="range"
            min="0"
            max="100"
            value={entry.reading?.progress ?? 0}
            style={rangeTrackStyle(entry.reading?.progress ?? 0, 0, 100)}
            onChange={(event) =>
              void onPatch({ reading: { ...readingFields(entry), progress: Number(event.target.value) } })
            }
          />
        </div>
      ) : null}

      {entry.kind === "password" ? <PasswordEditor entry={entry} onPatch={onPatch} /> : null}

      <textarea
        className="editor-body"
        value={entry.body}
        onChange={(event) => void onPatch({ body: event.target.value })}
        placeholder={entry.kind === "password" ? "备注，不要在这里写明文密码..." : "写下内容..."}
      />
      <div className="editor-footer">
        <input
          ref={tagsInputRef}
          className="tags-input"
          value={entry.tags.join(", ")}
          onChange={(event) =>
            void onPatch({
              tags: event.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            })
          }
          placeholder="标签，用逗号分隔"
        />
        <span className="autosave-state">
          <Check size={14} />
          已自动保存
        </span>
      </div>
    </main>
  );
}

function SettingsPanel({
  settings,
  open,
  onClose,
  onChange,
  shortcutStatus,
  onOpenQuickCapture,
  onRefreshQuickShortcut,
  onChooseBackground,
}: {
  settings: AppSettings;
  open: boolean;
  onClose: () => void;
  onChange: (settings: AppSettings) => void;
  shortcutStatus: QuickCaptureShortcutStatus | null;
  onOpenQuickCapture: () => void;
  onRefreshQuickShortcut: () => void;
  onChooseBackground: () => void;
}) {
  const themes: Array<{ value: ThemeOption; label: string }> = [
    { value: "paper", label: "纸感" },
    { value: "dark", label: "深色" },
    { value: "system", label: "系统" },
  ];
  const accents: Array<{ value: AccentOption; label: string }> = [
    { value: "bamboo", label: "竹绿" },
    { value: "indigo", label: "靛蓝" },
    { value: "rose", label: "蔷薇" },
  ];
  const densities: Array<{ value: EditorDensity; label: string }> = [
    { value: "comfortable", label: "舒展" },
    { value: "focused", label: "专注" },
    { value: "compact", label: "紧凑" },
  ];
  const backgroundFits: Array<{ value: AppSettings["background"]["fit"]; label: string }> = [
    { value: "cover", label: "填充" },
    { value: "contain", label: "完整" },
    { value: "auto", label: "原始" },
  ];
  const bg = settings.background;

  return (
    <div className="set-pane">
      <div className="set-pane-hdr">
        <h3>设置</h3>
        <button className="tbtn" onClick={onClose}><X size={15} /></button>
      </div>
      <div className="set-pane-body">

      <section className="settings-group">
        <div className="settings-group-title">
          <Palette size={17} />
          <span>外观</span>
        </div>
        <div className="settings-section">
          <label>主题</label>
          <div className="segmented">
            {themes.map((theme) => (
              <button
                key={theme.value}
                type="button"
                className={settings.theme === theme.value ? "active" : ""}
                onClick={() => onChange({ ...settings, theme: theme.value })}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <label>强调色</label>
          <div className="segmented">
            {accents.map((accent) => (
              <button
                key={accent.value}
                type="button"
                className={settings.accent === accent.value ? "active" : ""}
                onClick={() => onChange({ ...settings, accent: accent.value })}
              >
                {accent.label}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <label>编辑区密度</label>
          <div className="segmented">
            {densities.map((density) => (
              <button
                key={density.value}
                type="button"
                className={settings.editorDensity === density.value ? "active" : ""}
                onClick={() => onChange({ ...settings, editorDensity: density.value })}
              >
                {density.label}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <label className="range-title">
            <span>字号比例</span>
            <em>{Math.round(settings.fontScale * 100)}%</em>
          </label>
          <input
            type="range"
            min="0.9"
            max="1.15"
            step="0.05"
            value={settings.fontScale}
            style={rangeTrackStyle(settings.fontScale, 0.9, 1.15)}
            onChange={(event) => onChange({ ...settings, fontScale: Number(event.target.value) })}
          />
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group-title">
          <Keyboard size={17} />
          <span>快速捕获</span>
          <em className={`status-pill ${shortcutStatus?.registered ? "ok" : "warn"}`}>
            {shortcutStatus?.registered ? "可用" : "被占用"}
          </em>
        </div>
        <div className="settings-section">
          <label>全局快捷键</label>
          <div className="shortcut-grid">
            {QUICK_SHORTCUT_CHOICES.map((shortcut) => (
              <button
                key={shortcut}
                type="button"
                className={settings.quickCaptureShortcut === shortcut ? "active" : ""}
                onClick={() => onChange({ ...settings, quickCaptureShortcut: shortcut })}
              >
                {shortcut}
              </button>
            ))}
          </div>
          <small className="settings-hint">
            当前注册：{shortcutStatus?.accelerator ?? "等待检测"}
          </small>
        </div>
        <div className="settings-section">
          <label>默认捕获类型</label>
          <div className="kind-choice-grid">
            {QUICK_KINDS.map((kind) => {
              const meta = MODULE_META[kind];
              const Icon = meta.Icon;
              return (
                <button
                  key={kind}
                  type="button"
                  className={settings.quickCaptureDefaultKind === kind ? "active" : ""}
                  onClick={() => onChange({ ...settings, quickCaptureDefaultKind: kind })}
                >
                  <Icon size={15} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="settings-actions">
          <button className="btn btn-ghost" type="button" onClick={onRefreshQuickShortcut}>
            <Keyboard size={16} />
            检测
          </button>
          <button className="btn btn-primary" type="button" onClick={onOpenQuickCapture}>
            <Plus size={16} />
            打开捕获
          </button>
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group-title">
          <LayoutDashboard size={17} />
          <span>工作台</span>
        </div>
        <div className="settings-section">
          <ToggleRow
            label="界面动效"
            checked={settings.animations}
            onChange={(animations) => onChange({ ...settings, animations })}
          />
          <ToggleRow
            label="紧凑列表"
            checked={settings.compactList}
            onChange={(compactList) => onChange({ ...settings, compactList })}
          />
          <ToggleRow
            label="开机自启动"
            checked={settings.autoStart}
            onChange={(autoStart) => onChange({ ...settings, autoStart })}
          />
          <ToggleRow
            label="显示热力图"
            checked={settings.showActivityHeatmap}
            onChange={(showActivityHeatmap) => onChange({ ...settings, showActivityHeatmap })}
          />
        </div>
        <div className="settings-section">
          <label>热力图范围</label>
          <div className="segmented">
            {HEATMAP_DAY_CHOICES.map((days) => (
              <button
                key={days}
                type="button"
                className={settings.heatmapDays === days ? "active" : ""}
                onClick={() => onChange({ ...settings, heatmapDays: days })}
              >
                {days} 天
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group-title">
          <Image size={17} />
          <span>背景</span>
          <em className={`status-pill ${bg.imageUrl ? "ok" : ""}`}>
            {bg.imageUrl ? "已启用" : "默认"}
          </em>
        </div>
        <div className="background-preview">
          {bg.imageUrl ? <span style={{ backgroundImage: `url("${bg.imageUrl}")` }} /> : <span />}
          <div>
            <strong>{bg.fileName ?? "未选择背景图片"}</strong>
            <small>支持 PNG、JPG、WEBP、GIF，本地复制保存</small>
          </div>
        </div>
        <div className="settings-actions">
          <button className="btn btn-ghost" type="button" onClick={onChooseBackground}>
            <Image size={16} />
            选择图片
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={!bg.imageUrl}
            onClick={() =>
              onChange({
                ...settings,
                background: {
                  ...bg,
                  imageUrl: undefined,
                  fileName: undefined,
                },
              })
            }
          >
            <Eraser size={16} />
            移除
          </button>
        </div>
        <div className="settings-section">
          <label>显示方式</label>
          <div className="segmented">
            {backgroundFits.map((fit) => (
              <button
                key={fit.value}
                type="button"
                className={bg.fit === fit.value ? "active" : ""}
                onClick={() => onChange({ ...settings, background: { ...bg, fit: fit.value } })}
              >
                {fit.label}
              </button>
            ))}
          </div>
        </div>
        <div className="range-grid">
          <label>
            <span>
              <Layers size={14} />
              图片透明度 <em>{Math.round(bg.opacity * 100)}%</em>
            </span>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.02"
              value={bg.opacity}
              style={rangeTrackStyle(bg.opacity, 0, 0.8)}
              onChange={(event) =>
                onChange({ ...settings, background: { ...bg, opacity: Number(event.target.value) } })
              }
            />
          </label>
          <label>
            <span>
              <Droplets size={14} />
              背景模糊 <em>{bg.blur}px</em>
            </span>
            <input
              type="range"
              min="0"
              max="18"
              step="1"
              value={bg.blur}
              style={rangeTrackStyle(bg.blur, 0, 18)}
              onChange={(event) =>
                onChange({ ...settings, background: { ...bg, blur: Number(event.target.value) } })
              }
            />
          </label>
          <label>
            <span>
              <Layers size={14} />
              遮罩强度 <em>{Math.round(bg.maskOpacity * 100)}%</em>
            </span>
            <input
              type="range"
              min="0"
              max="0.86"
              step="0.02"
              value={bg.maskOpacity}
              style={rangeTrackStyle(bg.maskOpacity, 0, 0.86)}
              onChange={(event) =>
                onChange({ ...settings, background: { ...bg, maskOpacity: Number(event.target.value) } })
              }
            />
          </label>
          <label>
            <span>
              <CircleDot size={14} />
              边缘暗角 <em>{Math.round(bg.vignette * 100)}%</em>
            </span>
            <input
              type="range"
              min="0"
              max="0.7"
              step="0.02"
              value={bg.vignette}
              style={rangeTrackStyle(bg.vignette, 0, 0.7)}
              onChange={(event) =>
                onChange({ ...settings, background: { ...bg, vignette: Number(event.target.value) } })
              }
            />
          </label>
        </div>
      </section>
    </div></div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function Workbench() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activeKind, setActiveKind] = useState<ToolKind>("note");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickShortcutStatus, setQuickShortcutStatus] = useState<QuickCaptureShortcutStatus | null>(null);

  useEffect(() => {
    void matepaperApi.loadWorkspace().then(setWorkspace);
    void matepaperApi.getQuickCaptureShortcutStatus().then(setQuickShortcutStatus);
    const stopWorkspace = matepaperApi.onWorkspaceChanged(setWorkspace);
    const stopShortcut = matepaperApi.onQuickCaptureShortcutStatus(setQuickShortcutStatus);
    return () => {
      stopWorkspace();
      stopShortcut();
    };
  }, []);

  useEffect(() => {
    if (!workspace) return;
    applyAppearanceSettings(workspace.settings);
  }, [workspace?.settings]);

  const entries = useMemo(
    () =>
      workspace
        ? queryEntries(workspace, { kind: activeKind, search, includeArchived })
            .filter((entry) => (favoritesOnly ? entry.favorite : true))
            .sort((left, right) => Number(isPinned(right)) - Number(isPinned(left)))
        : [],
    [activeKind, favoritesOnly, includeArchived, search, workspace],
  );
  const selected = selectedId && workspace ? workspace.entriesById[selectedId] ?? null : null;

  useEffect(() => {
    if (!selectedId && entries[0]) setSelectedId(entries[0].id);
    if (selectedId && !entries.some((entry) => entry.id === selectedId)) {
      setSelectedId(entries[0]?.id ?? null);
    }
  }, [entries, selectedId]);

  async function commit(next: Workspace) {
    setWorkspace(next);
    await matepaperApi.saveWorkspace(next);
  }

  async function createEntry(kind = activeKind) {
    if (!workspace) return;
    const entry = createEntryDraft(kind, { ...newEntryDefaults(kind), now: new Date().toISOString() });
    await commit(upsertEntry(workspace, entry));
    setActiveKind(kind);
    setSelectedId(entry.id);
  }

  async function patchSelected(patch: Partial<WorkspaceEntry>) {
    if (!workspace || !selected) return;
    const now = new Date().toISOString();
    const next = updateEntry(workspace, selected.id, (entry) => ({
      ...entry,
      ...patch,
      updatedAt: now,
    }));
    await commit(next);
  }

  async function patchSettings(settings: AppSettings) {
    if (!workspace) return;
    await commit({ ...workspace, settings, updatedAt: new Date().toISOString() });
    const status = await matepaperApi.getQuickCaptureShortcutStatus();
    setQuickShortcutStatus(status);
  }

  async function chooseBackgroundImage() {
    if (!workspace) return;
    const picked = await matepaperApi.chooseBackgroundImage();
    if (!picked) return;
    await patchSettings({
      ...workspace.settings,
      background: {
        ...workspace.settings.background,
        imageUrl: picked.url,
        fileName: picked.fileName,
      },
    });
  }

  async function archiveSelected() {
    await patchSelected({ archived: true });
  }

  async function importMarkdown() {
    if (!workspace) return;
    const files = await matepaperApi.importMarkdownFiles();
    if (!files.length) return;
    const imported = files.map((file) => markdownImportToNote({ ...file, now: new Date().toISOString() }));
    const next = imported.reduce((state, entry) => upsertEntry(state, entry), workspace);
    await commit(next);
    setActiveKind("note");
    setSelectedId(imported[0]?.id ?? null);
  }

  // Resize drag logic for entry list
  useEffect(() => {
    let dragInfo: { startX: number; startW: number } | null = null;
    const handle = document.getElementById('resizeHandle');
    if (!handle) return;
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      const listCol = document.getElementById('listCol');
      if (!listCol) return;
      dragInfo = { startX: e.clientX, startW: listCol.offsetWidth };
      handle.classList.add('active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragInfo) return;
      const dx = e.clientX - dragInfo.startX;
      const newW = Math.max(160, Math.min(600, dragInfo.startW + dx));
      const list = document.getElementById('listCol');
      if (list) list.style.width = newW + 'px';
    };
    const onMouseUp = () => {
      if (!dragInfo) return;
      dragInfo = null;
      handle.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [settingsOpen]);

  if (!workspace) {
    return (
      <div className="app-shell">
        <Titlebar />
        <div className="loading">正在打开本地工作台...</div>
      </div>
    );
  }

  return (
      <div
      className={`app-shell density-${workspace.settings.editorDensity} ${workspace.settings.animations ? "" : "no-motion"} ${
        workspace.settings.compactList ? "compact" : ""
      }`}
    >
      <Titlebar onSettings={() => setSettingsOpen((v) => !v)} settingsOpen={settingsOpen} />
      <div className="workspace">
        <ModuleSidebar
          workspace={workspace}
          activeKind={activeKind}
          includeArchived={includeArchived}
          onSelect={(kind) => {
            setActiveKind(kind);
            setSelectedId(null);
          }}
          onQuickCapture={() => void matepaperApi.openQuickCapture()}
          onImportMarkdown={() => void importMarkdown()}
          onToggleArchived={() => setIncludeArchived((value) => !value)}
        />
        <div className="entry-list-wrap">
          <EntryList
            entries={entries}
            activeKind={activeKind}
            selectedId={selectedId}
            search={search}
            favoritesOnly={favoritesOnly}
            onSearch={setSearch}
            onSelect={setSelectedId}
            onCreate={(kind) => void createEntry(kind)}
            onToggleFavoritesOnly={() => setFavoritesOnly((value) => !value)}
          />
          <div className="resize-handle" id="resizeHandle" />
        </div>
        {settingsOpen ? (
          <SettingsPanel
            settings={workspace.settings}
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onChange={(settings) => void patchSettings(settings)}
            shortcutStatus={quickShortcutStatus}
            onOpenQuickCapture={() => void matepaperApi.openQuickCapture()}
            onRefreshQuickShortcut={() => void matepaperApi.getQuickCaptureShortcutStatus().then(setQuickShortcutStatus)}
            onChooseBackground={() => void chooseBackgroundImage()}
          />
        ) : (
          <EditorPane entry={selected} onPatch={patchSelected} onArchive={() => void archiveSelected()} />
        )}
      </div>
    </div>
  );
}

function QuickCapture() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [kind, setKind] = useState<ToolKind>("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recordPinned, setRecordPinned] = useState(false);
  const [windowPinned, setWindowPinned] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const [tagText, setTagText] = useState("");
  const [memoRemindAt, setMemoRemindAt] = useState("");
  const [todoCompleted, setTodoCompleted] = useState(false);
  const [todoDueDate, setTodoDueDate] = useState("");
  const [todoPriority, setTodoPriority] = useState<TodoFields["priority"]>("normal");
  const [dayDate, setDayDate] = useState(today());
  const [dayMood, setDayMood] = useState("");
  const [readingAuthor, setReadingAuthor] = useState("");
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>("reading");
  const [readingProgress, setReadingProgress] = useState(0);
  const [readingCurrentPage, setReadingCurrentPage] = useState("");
  const [readingTotalPages, setReadingTotalPages] = useState("");
  const [readingRating, setReadingRating] = useState("");
  const [passwordUsername, setPasswordUsername] = useState("");
  const [passwordUrl, setPasswordUrl] = useState("");
  const [passwordSecret, setPasswordSecret] = useState("");
  const [passwordMaster, setPasswordMaster] = useState("");
  const [quickStatus, setQuickStatus] = useState("");

  useEffect(() => {
    void matepaperApi.loadWorkspace().then((loaded) => {
      setWorkspace(loaded);
      setKind(loaded.settings.quickCaptureDefaultKind ?? "note");
    });
  }, []);

  useEffect(() => {
    if (!workspace) return;
    applyAppearanceSettings(workspace.settings);
  }, [workspace?.settings]);

  useEffect(() => {
    void matepaperApi.isAlwaysOnTop().then(setWindowPinned);
  }, []);

  async function toggleWindowPinned() {
    const pinned = await matepaperApi.setAlwaysOnTop(!windowPinned);
    setWindowPinned(pinned);
  }

  function resetQuickFields(nextKind = kind) {
    setBody("");
    setTagText("");
    setFavorite(false);
    setRecordPinned(false);
    setQuickStatus("");
    setMemoRemindAt("");
    setTodoCompleted(false);
    setTodoDueDate("");
    setTodoPriority("normal");
    setDayDate(today());
    setDayMood("");
    setReadingAuthor("");
    setReadingStatus(nextKind === "reading" ? "reading" : "planned");
    setReadingProgress(0);
    setReadingCurrentPage("");
    setReadingTotalPages("");
    setReadingRating("");
    setPasswordUsername("");
    setPasswordUrl("");
    setPasswordSecret("");
    setPasswordMaster("");
  }

  function selectKind(nextKind: ToolKind) {
    setKind(nextKind);
    setTitle("");
    resetQuickFields(nextKind);
  }

  async function save() {
    if (!workspace) return;
    if (kind === "password" && passwordSecret && !passwordMaster) {
      setQuickStatus("保存密码前需要填写主密码；主密码不会被保存。");
      return;
    }
    const tags = [
      ...(recordPinned ? ["置顶"] : []),
      ...tagText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ];
    const secretVault =
      kind === "password" && passwordSecret
        ? await encryptPasswordSecret(passwordSecret, passwordMaster)
        : undefined;
    const entry = createEntryDraft(kind, {
      ...newEntryDefaults(kind),
      title: title.trim() || newEntryDefaults(kind).title,
      body,
      tags,
      now: new Date().toISOString(),
      memo: kind === "memo" ? { remindAt: memoRemindAt || undefined } : undefined,
      todo:
        kind === "todo"
          ? {
              completed: todoCompleted,
              completedAt: todoCompleted ? new Date().toISOString() : undefined,
              dueDate: todoDueDate || undefined,
              priority: todoPriority,
            }
          : undefined,
      day: kind === "day" ? { date: dayDate || today(), mood: dayMood || undefined } : undefined,
      reading:
        kind === "reading"
          ? {
              author: readingAuthor || undefined,
              status: readingStatus,
              progress: readingProgress,
              currentPage: readingCurrentPage ? Number(readingCurrentPage) : undefined,
              totalPages: readingTotalPages ? Number(readingTotalPages) : undefined,
              rating: readingRating ? Number(readingRating) : undefined,
            }
          : undefined,
      password:
        kind === "password"
          ? {
              username: passwordUsername || undefined,
              url: passwordUrl || undefined,
              secretVault,
              updatedSecretAt: secretVault ? new Date().toISOString() : undefined,
            }
          : undefined,
    });
    entry.favorite = favorite;
    await matepaperApi.saveWorkspace(upsertEntry(workspace, entry));
    setTitle("");
    resetQuickFields(kind);
    await matepaperApi.closeCurrentWindow();
  }

  return (
    <div className="quick-shell">
      <Titlebar compact />
      <div className="quick-body">
        <div className="quick-kind-row">
          {QUICK_KINDS.map((item) => {
            const meta = MODULE_META[item];
            const Icon = meta.Icon;
            return (
              <button key={item} type="button" className={kind === item ? "active" : ""} onClick={() => selectKind(item)}>
                <Icon size={15} />
                {meta.label}
              </button>
            );
          })}
        </div>
        <div className="quick-tools">
          <button
            type="button"
            className={`quick-pin ${windowPinned ? "active" : ""}`}
            onClick={() => void toggleWindowPinned()}
          >
            <Pin size={14} fill={windowPinned ? "currentColor" : "none"} />
            窗口置顶
          </button>
          <button
            type="button"
            className={`quick-pin ${recordPinned ? "active" : ""}`}
            onClick={() => setRecordPinned((value) => !value)}
          >
            <Pin size={14} fill={recordPinned ? "currentColor" : "none"} />
            置顶记录
          </button>
          <button
            type="button"
            className={`quick-pin ${favorite ? "active" : ""}`}
            onClick={() => setFavorite((value) => !value)}
          >
            <Star size={14} fill={favorite ? "currentColor" : "none"} />
            收藏
          </button>
        </div>
        <input
          className="quick-title"
          autoFocus
          placeholder={`${MODULE_META[kind].label}标题`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <input
          className="quick-title"
          placeholder="标签，用逗号分隔"
          value={tagText}
          onChange={(event) => setTagText(event.target.value)}
        />
        {kind === "memo" ? (
          <div className="quick-fields">
            <label>
              <span>提醒时间</span>
              <input
                type="datetime-local"
                value={memoRemindAt}
                onChange={(event) => setMemoRemindAt(event.target.value)}
              />
            </label>
            <div className="quick-presets">
              <button type="button" onClick={() => setMemoRemindAt(dateTimeAfterHours(1))}>1 小时后</button>
              <button type="button" onClick={() => setMemoRemindAt(tonightDateTime())}>今晚</button>
              <button type="button" onClick={() => setMemoRemindAt(tomorrowMorningDateTime())}>明早</button>
            </div>
          </div>
        ) : null}
        {kind === "todo" ? (
          <div className="quick-fields quick-grid">
            <label className="quick-check">
              <input
                type="checkbox"
                checked={todoCompleted}
                onChange={(event) => setTodoCompleted(event.target.checked)}
              />
              <span>已完成</span>
            </label>
            <label>
              <span>截止日期</span>
              <input type="date" value={todoDueDate} onChange={(event) => setTodoDueDate(event.target.value)} />
            </label>
            <label>
              <span>优先级</span>
              <select
                value={todoPriority}
                onChange={(event) => setTodoPriority(event.target.value as TodoFields["priority"])}
              >
                <option value="low">低优先级</option>
                <option value="normal">普通</option>
                <option value="high">高优先级</option>
              </select>
            </label>
          </div>
        ) : null}
        {kind === "day" ? (
          <div className="quick-fields">
            <div className="quick-grid">
              <label>
                <span>日期</span>
                <input type="date" value={dayDate} onChange={(event) => setDayDate(event.target.value)} />
              </label>
              <label>
                <span>心情</span>
                <input value={dayMood} onChange={(event) => setDayMood(event.target.value)} placeholder="平静 / 开心 / 专注" />
              </label>
            </div>
            <div className="quick-presets">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  className={dayMood === mood ? "active" : ""}
                  onClick={() => setDayMood(mood)}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {kind === "reading" ? (
          <div className="quick-fields">
            <div className="quick-grid">
              <label>
                <span>作者</span>
                <input value={readingAuthor} onChange={(event) => setReadingAuthor(event.target.value)} />
              </label>
              <label>
                <span>状态</span>
                <select
                  value={readingStatus}
                  onChange={(event) => setReadingStatus(event.target.value as ReadingStatus)}
                >
                  <option value="planned">想读</option>
                  <option value="reading">在读</option>
                  <option value="finished">读完</option>
                  <option value="paused">暂停</option>
                </select>
              </label>
              <label>
                <span>当前页</span>
                <input type="number" min="0" value={readingCurrentPage} onChange={(event) => setReadingCurrentPage(event.target.value)} />
              </label>
              <label>
                <span>总页数</span>
                <input type="number" min="0" value={readingTotalPages} onChange={(event) => setReadingTotalPages(event.target.value)} />
              </label>
              <label>
                <span>评分</span>
                <input type="number" min="0" max="5" step="0.5" value={readingRating} onChange={(event) => setReadingRating(event.target.value)} />
              </label>
            </div>
            <label className="quick-range">
              <span>阅读进度 {readingProgress}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={readingProgress}
                style={rangeTrackStyle(readingProgress, 0, 100)}
                onChange={(event) => setReadingProgress(Number(event.target.value))}
              />
            </label>
          </div>
        ) : null}
        {kind === "password" ? (
          <div className="quick-fields">
            <div className="quick-grid">
              <label>
                <span>账号</span>
                <input value={passwordUsername} onChange={(event) => setPasswordUsername(event.target.value)} />
              </label>
              <label>
                <span>网址</span>
                <input value={passwordUrl} onChange={(event) => setPasswordUrl(event.target.value)} placeholder="https://..." />
              </label>
            </div>
            <label>
              <span>主密码</span>
              <input
                type="password"
                value={passwordMaster}
                onChange={(event) => setPasswordMaster(event.target.value)}
                placeholder="用于本地加密，不会保存"
              />
            </label>
            <label>
              <span>密码</span>
              <input
                type="password"
                value={passwordSecret}
                onChange={(event) => setPasswordSecret(event.target.value)}
                placeholder="留空则只保存账号信息"
              />
            </label>
          </div>
        ) : null}
        <textarea
          className="quick-text"
          placeholder={kind === "password" ? "备注，不要在这里写明文密码..." : "快速写下内容..."}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        {quickStatus ? <p className="quick-status">{quickStatus}</p> : null}
        <div className="quick-actions">
          <button className="btn btn-ghost" type="button" onClick={() => void matepaperApi.closeCurrentWindow()}>
            <X size={16} />
            取消
          </button>
          <button className="btn btn-primary" type="button" disabled={!workspace} onClick={() => void save()}>
            <Upload size={16} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

export function App() {
  return window.location.hash === "#quick" ? <QuickCapture /> : <Workbench />;
}
