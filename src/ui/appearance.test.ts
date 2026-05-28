import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../domain/workspace";
import { applyAppearanceSettings, resolveTheme } from "./appearance";

describe("appearance", () => {
  it("resolves system theme from the current OS preference", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("paper");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("applies theme, accent, font scale, and background variables to a target element", () => {
    const root = document.createElement("html");

    applyAppearanceSettings(
      {
        ...DEFAULT_SETTINGS,
        theme: "system",
        accent: "rose",
        fontScale: 1.12,
        background: {
          ...DEFAULT_SETTINGS.background,
          imageUrl: "matepaper-bg://local/test.png",
          opacity: 0.52,
          blur: 8,
          maskOpacity: 0.34,
          vignette: 0.18,
          fit: "contain",
        },
      },
      root,
      true,
    );

    expect(root.dataset.theme).toBe("dark");
    expect(root.dataset.accent).toBe("rose");
    expect(root.style.getPropertyValue("--font-scale")).toBe("1.12");
    expect(root.style.getPropertyValue("--app-bg-image")).toBe('url("matepaper-bg://local/test.png")');
    expect(root.style.getPropertyValue("--app-bg-opacity")).toBe("0.52");
    expect(root.style.getPropertyValue("--app-bg-blur")).toBe("8px");
    expect(root.style.getPropertyValue("--app-bg-mask")).toBe("0.34");
    expect(root.style.getPropertyValue("--app-bg-vignette")).toBe("0.18");
    expect(root.style.getPropertyValue("--app-bg-size")).toBe("contain");
  });
});
