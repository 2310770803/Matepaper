import type { AppSettings, ThemeOption } from "../domain/types";

export type ResolvedTheme = Exclude<ThemeOption, "system">;

export function resolveTheme(theme: ThemeOption, prefersDark: boolean): ResolvedTheme {
  if (theme === "system") return prefersDark ? "dark" : "paper";
  return theme;
}

function getSystemPrefersDark() {
  return globalThis.window?.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function applyAppearanceSettings(
  settings: AppSettings,
  target = document.documentElement,
  prefersDark = getSystemPrefersDark(),
) {
  const theme = resolveTheme(settings.theme, prefersDark);
  target.dataset.theme = theme;
  target.dataset.accent = settings.accent;
  target.style.setProperty("--font-scale", String(settings.fontScale));
  const hasBackground = Boolean(settings.background.imageUrl);
  target.style.setProperty(
    "--app-bg-image",
    hasBackground ? `url("${settings.background.imageUrl}")` : "none",
  );
  target.style.setProperty("--app-bg-opacity", hasBackground ? String(settings.background.opacity) : "0");
  target.style.setProperty("--app-bg-blur", hasBackground ? `${settings.background.blur}px` : "0px");
  target.style.setProperty("--app-bg-mask", hasBackground ? String(settings.background.maskOpacity) : "0");
  target.style.setProperty("--app-bg-vignette", hasBackground ? String(settings.background.vignette) : "0");
  target.style.setProperty("--app-bg-size", settings.background.fit);
}
