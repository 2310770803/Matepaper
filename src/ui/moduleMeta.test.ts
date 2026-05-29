import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MODULE_META } from "./moduleMeta";
import type { ToolKind } from "../domain/types";

describe("module meta", () => {
  it("defines a real icon component for every workspace module", () => {
    const kinds: ToolKind[] = ["note", "memo", "todo", "day", "reading", "habit", "expense", "password"];

    for (const kind of kinds) {
      expect(MODULE_META[kind].label).not.toHaveLength(1);
      const markup = renderToStaticMarkup(createElement(MODULE_META[kind].Icon, { size: 16 }));
      expect(markup).toContain("<svg");
    }
  });
});
