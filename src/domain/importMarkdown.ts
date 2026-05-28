import { createEntryDraft } from "./workspace";
import type { ImportedMarkdownFile, WorkspaceEntry } from "./types";

function stripMarkdownExtension(fileName: string): string {
  return fileName.replace(/\.(md|markdown)$/i, "");
}

function titleFromContent(content: string): string | null {
  const firstHeading = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .find((line) => /^#\s+\S/.test(line.trim()));
  return firstHeading ? firstHeading.trim().replace(/^#\s+/, "").trim() : null;
}

export function markdownImportToNote(
  file: ImportedMarkdownFile & { now?: string },
): WorkspaceEntry {
  return createEntryDraft("note", {
    title: titleFromContent(file.content) ?? stripMarkdownExtension(file.fileName),
    body: file.content,
    tags: ["markdown"],
    now: file.now,
  });
}
