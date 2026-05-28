import { createEmptyWorkspace, DEFAULT_SETTINGS, FIRST_VERSION_MODULES } from "../domain/workspace";
import type { ImportedMarkdownFile, Workspace } from "../domain/types";

export interface QuickCaptureShortcutStatus {
  label: string;
  accelerator: string;
  registered: boolean;
  updatedAt?: string;
}

export interface BackgroundImagePickResult {
  url: string;
  fileName: string;
}

declare global {
  interface Window {
    matepaper?: {
      loadWorkspace: () => Promise<Workspace>;
      saveWorkspace: (workspace: Workspace) => Promise<Workspace>;
      importMarkdownFiles: () => Promise<ImportedMarkdownFile[]>;
      chooseBackgroundImage: () => Promise<BackgroundImagePickResult | null>;
      openQuickCapture: () => Promise<void>;
      getQuickCaptureShortcutStatus: () => Promise<QuickCaptureShortcutStatus>;
      setQuickCaptureShortcut: (label: string) => Promise<QuickCaptureShortcutStatus>;
      setAutoStart: (enabled: boolean) => Promise<boolean>;
      getAutoStart: () => Promise<boolean>;
      setAlwaysOnTop: (enabled: boolean) => Promise<boolean>;
      isAlwaysOnTop: () => Promise<boolean>;
      closeCurrentWindow: () => Promise<void>;
      minimizeCurrentWindow: () => Promise<void>;
      toggleMaximizeCurrentWindow: () => Promise<boolean>;
      onWorkspaceChanged: (callback: (workspace: Workspace) => void) => () => void;
      onQuickCaptureShortcutStatus: (
        callback: (status: QuickCaptureShortcutStatus) => void,
      ) => () => void;
    };
  }
}

const WEB_STORAGE_KEY = "matepaper.workspace";

function normalizeWebBackground(settings?: Partial<Workspace["settings"]>): Workspace["settings"]["background"] {
  return {
    ...DEFAULT_SETTINGS.background,
    opacity: settings?.background?.opacity ?? DEFAULT_SETTINGS.background.opacity,
    blur: settings?.background?.blur ?? DEFAULT_SETTINGS.background.blur,
    maskOpacity: settings?.background?.maskOpacity ?? DEFAULT_SETTINGS.background.maskOpacity,
    vignette: settings?.background?.vignette ?? DEFAULT_SETTINGS.background.vignette,
    fit: settings?.background?.fit ?? DEFAULT_SETTINGS.background.fit,
    imageUrl: settings?.background?.imageUrl,
    fileName: settings?.background?.fileName,
  };
}

function normalizeWebSettings(settings?: Partial<Workspace["settings"]>): Workspace["settings"] {
  return {
    ...DEFAULT_SETTINGS,
    theme: settings?.theme ?? DEFAULT_SETTINGS.theme,
    accent: settings?.accent ?? DEFAULT_SETTINGS.accent,
    animations: settings?.animations ?? DEFAULT_SETTINGS.animations,
    compactList: settings?.compactList ?? DEFAULT_SETTINGS.compactList,
    autoStart: settings?.autoStart ?? DEFAULT_SETTINGS.autoStart,
    fontScale: settings?.fontScale ?? DEFAULT_SETTINGS.fontScale,
    quickCaptureShortcut: settings?.quickCaptureShortcut ?? DEFAULT_SETTINGS.quickCaptureShortcut,
    quickCaptureDefaultKind: settings?.quickCaptureDefaultKind ?? DEFAULT_SETTINGS.quickCaptureDefaultKind,
    showActivityHeatmap: settings?.showActivityHeatmap ?? DEFAULT_SETTINGS.showActivityHeatmap,
    heatmapDays: settings?.heatmapDays ?? DEFAULT_SETTINGS.heatmapDays,
    editorDensity: settings?.editorDensity ?? DEFAULT_SETTINGS.editorDensity,
    background: normalizeWebBackground(settings),
  };
}

function webFallbackWorkspace(): Workspace {
  const raw = window.localStorage.getItem(WEB_STORAGE_KEY);
  if (!raw) return createEmptyWorkspace();
  try {
    const parsed = JSON.parse(raw) as Workspace;
    return {
      ...createEmptyWorkspace(),
      ...parsed,
      modules: FIRST_VERSION_MODULES,
      settings: normalizeWebSettings(parsed.settings),
      entriesById: parsed.entriesById ?? {},
    };
  } catch {
    return createEmptyWorkspace();
  }
}

export const matepaperApi = {
  async loadWorkspace(): Promise<Workspace> {
    if (window.matepaper) return window.matepaper.loadWorkspace();
    const workspace = webFallbackWorkspace();
    window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(workspace));
    return workspace;
  },

  async saveWorkspace(workspace: Workspace): Promise<Workspace> {
    if (window.matepaper) return window.matepaper.saveWorkspace(workspace);
    window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(workspace));
    return workspace;
  },

  async importMarkdownFiles(): Promise<ImportedMarkdownFile[]> {
    if (window.matepaper) return window.matepaper.importMarkdownFiles();
    return [];
  },

  async chooseBackgroundImage(): Promise<BackgroundImagePickResult | null> {
    if (window.matepaper) return window.matepaper.chooseBackgroundImage();
    return null;
  },

  async openQuickCapture(): Promise<void> {
    if (window.matepaper) return window.matepaper.openQuickCapture();
    window.location.hash = "#quick";
  },

  async getQuickCaptureShortcutStatus(): Promise<QuickCaptureShortcutStatus> {
    if (window.matepaper) return window.matepaper.getQuickCaptureShortcutStatus();
    return {
      label: DEFAULT_SETTINGS.quickCaptureShortcut,
      accelerator: DEFAULT_SETTINGS.quickCaptureShortcut,
      registered: true,
    };
  },

  async setQuickCaptureShortcut(label: string): Promise<QuickCaptureShortcutStatus> {
    if (window.matepaper) return window.matepaper.setQuickCaptureShortcut(label);
    return {
      label,
      accelerator: label,
      registered: true,
      updatedAt: new Date().toISOString(),
    };
  },

  async setAutoStart(enabled: boolean): Promise<boolean> {
    if (window.matepaper) return window.matepaper.setAutoStart(enabled);
    return enabled;
  },

  async getAutoStart(): Promise<boolean> {
    if (window.matepaper) return window.matepaper.getAutoStart();
    return false;
  },

  async setAlwaysOnTop(enabled: boolean): Promise<boolean> {
    if (window.matepaper) return window.matepaper.setAlwaysOnTop(enabled);
    return enabled;
  },

  async isAlwaysOnTop(): Promise<boolean> {
    if (window.matepaper) return window.matepaper.isAlwaysOnTop();
    return false;
  },

  async closeCurrentWindow(): Promise<void> {
    if (window.matepaper) return window.matepaper.closeCurrentWindow();
    window.location.hash = "";
  },

  async minimizeCurrentWindow(): Promise<void> {
    if (window.matepaper) return window.matepaper.minimizeCurrentWindow();
  },

  async toggleMaximizeCurrentWindow(): Promise<boolean> {
    if (window.matepaper) return window.matepaper.toggleMaximizeCurrentWindow();
    return false;
  },

  onWorkspaceChanged(callback: (workspace: Workspace) => void): () => void {
    if (window.matepaper) return window.matepaper.onWorkspaceChanged(callback);
    return () => undefined;
  },

  onQuickCaptureShortcutStatus(callback: (status: QuickCaptureShortcutStatus) => void): () => void {
    if (window.matepaper) return window.matepaper.onQuickCaptureShortcutStatus(callback);
    return () => undefined;
  },
};
