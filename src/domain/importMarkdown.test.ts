import { describe, expect, it } from "vitest";
import { markdownImportToNote } from "./importMarkdown";

describe("markdown import", () => {
  it("uses the first h1 as the note title and preserves original content", () => {
    const note = markdownImportToNote({
      fileName: "meeting.md",
      content: "# 会议记录\n\n- A+C 方向\n- 密码本加密",
      now: "2026-05-27T08:00:00.000Z",
    });

    expect(note.kind).toBe("note");
    expect(note.title).toBe("会议记录");
    expect(note.body).toBe("# 会议记录\n\n- A+C 方向\n- 密码本加密");
    expect(note.tags).toEqual(["markdown"]);
  });

  it("falls back to the file name when there is no h1 heading", () => {
    const note = markdownImportToNote({
      fileName: "reading-plan.markdown",
      content: "无标题正文",
      now: "2026-05-27T08:00:00.000Z",
    });

    expect(note.title).toBe("reading-plan");
  });
});
