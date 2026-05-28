const {
  normalizeQuickCaptureShortcut,
  QUICK_CAPTURE_SHORTCUT_PRESETS,
} = require("./shortcut.cjs");

describe("quick capture shortcut", () => {
  it("normalizes user-facing labels to Electron accelerators", () => {
    expect(normalizeQuickCaptureShortcut("Ctrl+Space")).toBe("CommandOrControl+Space");
    expect(normalizeQuickCaptureShortcut("Ctrl+Shift+Space")).toBe("CommandOrControl+Shift+Space");
    expect(normalizeQuickCaptureShortcut("Alt+Space")).toBe("Alt+Space");
  });

  it("falls back to the safer default shortcut when the value is missing", () => {
    expect(normalizeQuickCaptureShortcut("")).toBe("CommandOrControl+Shift+Space");
    expect(QUICK_CAPTURE_SHORTCUT_PRESETS.map((preset) => preset.label)).toContain("Ctrl+Shift+Space");
  });
});
