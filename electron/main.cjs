const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const {
  app,
  BrowserWindow,
  dialog,
  Menu,
  Tray,
  globalShortcut,
  ipcMain,
  nativeImage,
  net,
  protocol,
} = require("electron");
const { createLocalStore } = require("./localStore.cjs");
const {
  DEFAULT_QUICK_CAPTURE_SHORTCUT,
  labelForQuickCaptureShortcut,
  normalizeQuickCaptureShortcut,
} = require("./shortcut.cjs");

const DEV_URL = "http://127.0.0.1:1420";
const BACKGROUND_PROTOCOL = "matepaper-bg";

if (process.platform === "win32") {
  app.setAppUserModelId("com.matepaper.desktop");
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: BACKGROUND_PROTOCOL,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

let mainWindow = null;
let quickWindow = null;
let tray = null;
let store = null;
let quickShortcutStatus = {
  label: DEFAULT_QUICK_CAPTURE_SHORTCUT,
  accelerator: normalizeQuickCaptureShortcut(DEFAULT_QUICK_CAPTURE_SHORTCUT),
  registered: false,
};

function backgroundsDir() {
  return path.join(app.getPath("userData"), "backgrounds");
}

function backgroundUrlForFile(fileName) {
  return `${BACKGROUND_PROTOCOL}://local/${encodeURIComponent(fileName)}`;
}

function setupBackgroundProtocol() {
  protocol.handle(BACKGROUND_PROTOCOL, (request) => {
    const requestUrl = new URL(request.url);
    const fileName = path.basename(decodeURIComponent(requestUrl.pathname.replace(/^\/+/, "")));
    const root = path.resolve(backgroundsDir());
    const filePath = path.resolve(root, fileName);
    if (!filePath.startsWith(`${root}${path.sep}`)) {
      throw new Error("Blocked background path outside app data directory");
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function rendererUrl(route = "") {
  if (!app.isPackaged) return `${DEV_URL}${route}`;
  const fileUrl = pathToFileURL(path.join(__dirname, "../dist/index.html"));
  if (route) fileUrl.hash = route.replace(/^#/, "");
  return fileUrl.toString();
}

function appIconPath(fileName = "app-icon.png") {
  const candidates = [
    path.join(__dirname, "../public", fileName),
    path.join(__dirname, "../dist", fileName),
    path.join(process.resourcesPath ?? "", fileName),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

function createAppIcon() {
  const icon = nativeImage.createFromPath(appIconPath());
  return icon.isEmpty() ? nativeImage.createEmpty() : icon;
}

function setAutoStart(enabled) {
  app.setLoginItemSettings({
    openAtLogin: Boolean(enabled),
    path: process.execPath,
  });
  return app.getLoginItemSettings().openAtLogin;
}

function getAutoStart() {
  return app.getLoginItemSettings().openAtLogin;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 960,
    minHeight: 620,
    title: "Matepaper",
    frame: false,
    icon: createAppIcon(),
    backgroundColor: "#161615",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(rendererUrl());
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createQuickWindow() {
  if (quickWindow) {
    quickWindow.show();
    quickWindow.focus();
    return;
  }

  quickWindow = new BrowserWindow({
    width: 560,
    height: 560,
    minWidth: 460,
    minHeight: 460,
    title: "快速捕获",
    frame: false,
    icon: createAppIcon(),
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#161615",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  quickWindow.loadURL(rendererUrl("#quick"));
  quickWindow.once("ready-to-show", () => {
    if (!quickWindow || quickWindow.isDestroyed()) return;
    quickWindow.show();
    quickWindow.focus();
  });
  quickWindow.on("closed", () => {
    quickWindow = null;
  });
}

function broadcastQuickShortcutStatus() {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send("shortcut:quickCaptureStatus", quickShortcutStatus);
    }
  }
}

function configureQuickCaptureShortcut(label) {
  const nextLabel = labelForQuickCaptureShortcut(label || DEFAULT_QUICK_CAPTURE_SHORTCUT);
  const accelerator = normalizeQuickCaptureShortcut(nextLabel);
  if (quickShortcutStatus.accelerator) {
    globalShortcut.unregister(quickShortcutStatus.accelerator);
  }
  const registered = globalShortcut.register(accelerator, createQuickWindow);
  quickShortcutStatus = {
    label: nextLabel,
    accelerator,
    registered,
    updatedAt: new Date().toISOString(),
  };
  broadcastQuickShortcutStatus();
  return quickShortcutStatus;
}

function setupTray() {
  tray = new Tray(createAppIcon());
  tray.setToolTip("Matepaper");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "显示主窗口", click: () => mainWindow?.show() ?? createMainWindow() },
      { label: "快速捕获", click: createQuickWindow },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
}

function setupIpc() {
  ipcMain.handle("workspace:load", () => store.load());
  ipcMain.handle("workspace:save", (_event, workspace) => {
    store.save(workspace);
    const quickShortcutLabel = labelForQuickCaptureShortcut(workspace?.settings?.quickCaptureShortcut);
    if (quickShortcutLabel !== quickShortcutStatus.label || !quickShortcutStatus.registered) {
      configureQuickCaptureShortcut(quickShortcutLabel);
    }
    mainWindow?.webContents.send("workspace:changed", workspace);
    if (typeof workspace?.settings?.autoStart === "boolean") {
      setAutoStart(workspace.settings.autoStart);
    }
    if (quickWindow && !quickWindow.isDestroyed()) {
      quickWindow.webContents.send("workspace:changed", workspace);
    }
    return workspace;
  });
  ipcMain.handle("app:getAutoStart", () => getAutoStart());
  ipcMain.handle("app:setAutoStart", (_event, enabled) => setAutoStart(enabled));
  ipcMain.handle("dialog:importMarkdown", async () => {
    const result = await dialog.showOpenDialog(mainWindow ?? undefined, {
      title: "导入 Markdown",
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
    });
    if (result.canceled) return [];
    return result.filePaths.map((filePath) => ({
      path: filePath,
      fileName: path.basename(filePath),
      content: fs.readFileSync(filePath, "utf8"),
    }));
  });
  ipcMain.handle("dialog:chooseBackgroundImage", async () => {
    const result = await dialog.showOpenDialog(mainWindow ?? undefined, {
      title: "选择背景图片",
      properties: ["openFile"],
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif"] }],
    });
    if (result.canceled || !result.filePaths[0]) return null;

    const sourcePath = result.filePaths[0];
    const extension = path.extname(sourcePath).toLowerCase() || ".png";
    const safeName = `background-${Date.now()}${extension}`;
    fs.mkdirSync(backgroundsDir(), { recursive: true });
    fs.copyFileSync(sourcePath, path.join(backgroundsDir(), safeName));
    return {
      url: backgroundUrlForFile(safeName),
      fileName: path.basename(sourcePath),
    };
  });
  ipcMain.handle("window:openQuickCapture", () => createQuickWindow());
  ipcMain.handle("shortcut:getQuickCaptureStatus", () => quickShortcutStatus);
  ipcMain.handle("shortcut:setQuickCapture", (_event, label) => configureQuickCaptureShortcut(label));
  ipcMain.handle("window:closeCurrent", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
  ipcMain.handle("window:minimizeCurrent", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });
  ipcMain.handle("window:toggleMaximizeCurrent", (event) => {
    const target = BrowserWindow.fromWebContents(event.sender);
    if (!target) return false;
    if (target.isMaximized()) {
      target.unmaximize();
      return false;
    }
    target.maximize();
    return true;
  });
  ipcMain.handle("window:isAlwaysOnTop", (event) => {
    const target = BrowserWindow.fromWebContents(event.sender);
    return target?.isAlwaysOnTop() ?? false;
  });
  ipcMain.handle("window:setAlwaysOnTop", (event, enabled) => {
    const target = BrowserWindow.fromWebContents(event.sender);
    if (!target) return false;
    target.setAlwaysOnTop(Boolean(enabled));
    return target.isAlwaysOnTop();
  });
}

app.whenReady().then(() => {
  store = createLocalStore({ dataDir: app.getPath("userData") });
  const workspace = store.load();
  setupBackgroundProtocol();
  setupIpc();
  setupTray();
  setAutoStart(workspace.settings.autoStart);
  createMainWindow();
  configureQuickCaptureShortcut(workspace.settings.quickCaptureShortcut);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
