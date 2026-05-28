export type ToolKind = "note" | "memo" | "todo" | "day" | "reading" | "password";

export interface ToolModule {
  kind: ToolKind;
  label: string;
  description: string;
}

export type ReadingStatus = "planned" | "reading" | "finished" | "paused";

export type ThemeOption = "paper" | "dark" | "system";
export type AccentOption = "bamboo" | "indigo" | "rose";
export type EditorDensity = "comfortable" | "focused" | "compact";
export type BackgroundFit = "cover" | "contain" | "auto";

export interface BackgroundSettings {
  imageUrl?: string;
  fileName?: string;
  opacity: number;
  blur: number;
  maskOpacity: number;
  vignette: number;
  fit: BackgroundFit;
}

export interface AppSettings {
  theme: ThemeOption;
  accent: AccentOption;
  animations: boolean;
  compactList: boolean;
  autoStart: boolean;
  fontScale: number;
  quickCaptureShortcut: string;
  quickCaptureDefaultKind: ToolKind;
  showActivityHeatmap: boolean;
  heatmapDays: number;
  editorDensity: EditorDensity;
  background: BackgroundSettings;
}

export interface TodoFields {
  completed: boolean;
  dueDate?: string;
  priority?: "low" | "normal" | "high";
  completedAt?: string;
}

export interface DayFields {
  date: string;
  mood?: string;
}

export interface ReadingFields {
  author?: string;
  status: ReadingStatus;
  progress: number;
  currentPage?: number;
  totalPages?: number;
  rating?: number;
  startedAt?: string;
  finishedAt?: string;
}

export interface PasswordSecretVault {
  algorithm: "AES-GCM";
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

export interface PasswordFields {
  username?: string;
  url?: string;
  secretVault?: PasswordSecretVault;
  updatedSecretAt?: string;
}

export interface WorkspaceEntry {
  id: string;
  kind: ToolKind;
  title: string;
  body: string;
  tags: string[];
  favorite: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  memo?: {
    remindAt?: string;
  };
  todo?: TodoFields;
  day?: DayFields;
  reading?: ReadingFields;
  password?: PasswordFields;
}

export interface Workspace {
  version: 1;
  modules: ToolModule[];
  settings: AppSettings;
  entriesById: Record<string, WorkspaceEntry>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntryOptions {
  title: string;
  body: string;
  tags?: string[];
  now?: string;
  memo?: Partial<WorkspaceEntry["memo"]>;
  todo?: Partial<TodoFields>;
  day?: Partial<DayFields>;
  reading?: Partial<ReadingFields>;
  password?: Partial<PasswordFields>;
}

export interface ImportedMarkdownFile {
  fileName: string;
  path?: string;
  content: string;
}

export interface EntryQuery {
  kind?: ToolKind;
  search?: string;
  includeArchived?: boolean;
}

export interface ModuleStats {
  total: number;
  active: number;
  completed: number;
  archived: number;
}
