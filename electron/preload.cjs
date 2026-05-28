const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("matepaper", {
  loadWorkspace: () => ipcRenderer.invoke("workspace:load"),
  saveWorkspace: (workspace) => ipcRenderer.invoke("workspace:save", workspace),
  importMarkdownFiles: () => ipcRenderer.invoke("dialog:importMarkdown"),
  chooseBackgroundImage: () => ipcRenderer.invoke("dialog:chooseBackgroundImage"),
  openQuickCapture: () => ipcRenderer.invoke("window:openQuickCapture"),
  getQuickCaptureShortcutStatus: () => ipcRenderer.invoke("shortcut:getQuickCaptureStatus"),
  setQuickCaptureShortcut: (label) => ipcRenderer.invoke("shortcut:setQuickCapture", label),
  setAutoStart: (enabled) => ipcRenderer.invoke("app:setAutoStart", enabled),
  getAutoStart: () => ipcRenderer.invoke("app:getAutoStart"),
  setAlwaysOnTop: (enabled) => ipcRenderer.invoke("window:setAlwaysOnTop", enabled),
  isAlwaysOnTop: () => ipcRenderer.invoke("window:isAlwaysOnTop"),
  closeCurrentWindow: () => ipcRenderer.invoke("window:closeCurrent"),
  minimizeCurrentWindow: () => ipcRenderer.invoke("window:minimizeCurrent"),
  toggleMaximizeCurrentWindow: () => ipcRenderer.invoke("window:toggleMaximizeCurrent"),
  onWorkspaceChanged: (callback) => {
    const listener = (_event, workspace) => callback(workspace);
    ipcRenderer.on("workspace:changed", listener);
    return () => ipcRenderer.removeListener("workspace:changed", listener);
  },
  onQuickCaptureShortcutStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on("shortcut:quickCaptureStatus", listener);
    return () => ipcRenderer.removeListener("shortcut:quickCaptureStatus", listener);
  },
});
