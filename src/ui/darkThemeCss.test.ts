import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/App.css"), "utf8");

describe("dark theme CSS safeguards", () => {
  it("removes the outer app border that becomes a bright edge when maximized", () => {
    expect(css).toMatch(/\.app-shell\s*\{[^}]*border:\s*0/);
    expect(css).not.toMatch(/\.app-shell\s*\{[^}]*border:\s*1px/);
  });

  it("defines dark-specific sidebar and settings panel surfaces", () => {
    expect(css).toContain(':root[data-theme="dark"] .heatmap-card');
    expect(css).toContain(':root[data-theme="dark"] .set-pane');
    expect(css).toContain(':root[data-theme="dark"] .settings-group');
  });

  it("uses configured font scale and styled range progress variables", () => {
    expect(css).toContain("var(--font-scale,1)");
    expect(css).toContain("var(--range-pct,0%)");
  });

  it("defines heatmap level colors and flexible columns", () => {
    expect(css).toContain("--heatmap-cols");
    expect(css).toContain('.heatmap-cell[data-lv="4"]');
    expect(css).toContain(".heatmap-legend");
  });
});
