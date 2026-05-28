const DEFAULT_QUICK_CAPTURE_SHORTCUT = "Ctrl+Shift+Space";

const QUICK_CAPTURE_SHORTCUT_PRESETS = [
  { label: "Ctrl+Shift+Space", accelerator: "CommandOrControl+Shift+Space" },
  { label: "Ctrl+Alt+N", accelerator: "CommandOrControl+Alt+N" },
  { label: "Alt+Space", accelerator: "Alt+Space" },
  { label: "Ctrl+Space", accelerator: "CommandOrControl+Space" },
];

function normalizeQuickCaptureShortcut(value) {
  const fallback = QUICK_CAPTURE_SHORTCUT_PRESETS[0].accelerator;
  if (!value || typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/\s+/g, "");
  const preset = QUICK_CAPTURE_SHORTCUT_PRESETS.find(
    (item) => item.label.toLowerCase() === normalized.toLowerCase(),
  );
  if (preset) return preset.accelerator;
  return normalized.replace(/^Ctrl\+/i, "CommandOrControl+");
}

function labelForQuickCaptureShortcut(value) {
  const accelerator = normalizeQuickCaptureShortcut(value);
  const preset = QUICK_CAPTURE_SHORTCUT_PRESETS.find((item) => item.accelerator === accelerator);
  return preset?.label ?? value;
}

module.exports = {
  DEFAULT_QUICK_CAPTURE_SHORTCUT,
  QUICK_CAPTURE_SHORTCUT_PRESETS,
  labelForQuickCaptureShortcut,
  normalizeQuickCaptureShortcut,
};
