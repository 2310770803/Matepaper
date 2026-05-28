import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpenCheck,
  CalendarDays,
  CheckSquare2,
  KeyRound,
  StickyNote,
} from "lucide-react";
import type { ToolKind } from "../domain/types";

export const MODULE_META: Record<
  ToolKind,
  {
    label: string;
    description: string;
    accent: "green" | "blue" | "coral" | "gold" | "violet" | "slate";
    Icon: LucideIcon;
  }
> = {
  note: {
    label: "本地便签",
    description: "灵感、片段、Markdown",
    accent: "green",
    Icon: StickyNote,
  },
  memo: {
    label: "备忘录",
    description: "提醒、临时事项",
    accent: "blue",
    Icon: Bell,
  },
  todo: {
    label: "待办",
    description: "任务、截止、完成",
    accent: "coral",
    Icon: CheckSquare2,
  },
  day: {
    label: "日子记录",
    description: "日期、心情、生活",
    accent: "gold",
    Icon: CalendarDays,
  },
  reading: {
    label: "阅读记录",
    description: "书籍、进度、摘记",
    accent: "violet",
    Icon: BookOpenCheck,
  },
  password: {
    label: "密码本",
    description: "账号、本地加密密文",
    accent: "slate",
    Icon: KeyRound,
  },
};
