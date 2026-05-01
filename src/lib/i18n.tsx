"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Lang = "en" | "zh";

type DictKey =
  // Brand / status
  | "brand.title"
  | "brand.tagline"
  | "status.idle"
  | "status.syncing"
  | "status.error"
  | "btn.summon"
  | "btn.summoning"
  // Tabs
  | "tab.olympus"
  | "tab.scrolls"
  // Stats
  | "stat.openQuests"
  | "stat.dueToday"
  | "stat.completed"
  | "stat.overdue"
  // Quest list
  | "quests.heading"
  | "quests.filter.all"
  | "quests.filter.today"
  | "quests.filter.upcoming"
  | "quests.filter.completed"
  | "quests.empty"
  | "quests.due"
  | "quests.newQuest"
  | "quests.cancel"
  | "quests.questPrompt"
  | "quests.statusTodo"
  | "quests.statusInProgress"
  | "quests.statusDone"
  | "quests.category"
  | "quests.inscribe"
  | "quests.inscribing"
  | "quests.badge.todo"
  | "quests.badge.inProgress"
  | "quests.badge.done"
  | "quests.badge.overdue"
  // Calendar
  | "cal.legend.overdue"
  | "cal.legend.active"
  | "cal.legend.open"
  | "cal.legend.done"
  | "cal.prevMonth"
  | "cal.nextMonth"
  // Scrolls composer
  | "scroll.compose"
  | "scroll.author"
  | "scroll.message"
  | "scroll.questOptional"
  | "scroll.noQuest"
  | "scroll.markProgress"
  | "scroll.noChange"
  | "scroll.markTodo"
  | "scroll.links"
  | "scroll.linkPlaceholder"
  | "scroll.add"
  | "scroll.files"
  | "scroll.attachFile"
  | "scroll.seal"
  | "scroll.sealing"
  | "scroll.feedHeading"
  | "scroll.feedCount"
  | "scroll.feedEmpty"
  | "scroll.questChip"
  | "scroll.showOlder"
  | "scroll.hideOlder"
  | "scroll.olderCount"
  | "scroll.newQuestToggle"
  | "scroll.createQuestHeading"
  | "scroll.createQuestSubmit"
  | "scroll.creatingQuest"
  | "scroll.questCreated"
  // Toasts / errors
  | "toast.synced"
  | "toast.syncFailed"
  | "toast.scrollSealed"
  | "toast.noQuestsOnDay"
  | "toast.updateFailed"
  | "err.authorRequired"
  | "err.messageRequired"
  | "err.linkProtocol"
  | "err.postFailed"
  // Misc
  | "lang.toggle";

const dict: Record<DictKey, Record<Lang, string>> = {
  // Brand / status
  "brand.title": { en: "Olympus", zh: "奥林匹斯" },
  "brand.tagline": { en: "— quest registry of the gods", zh: "—— 众神的任务记录" },
  "status.idle": { en: "Olympus stands", zh: "奥林匹斯安然" },
  "status.syncing": { en: "Communing with the muses", zh: "与缪斯交流中" },
  "status.error": { en: "The line is broken", zh: "通讯中断" },
  "btn.summon": { en: "Summon", zh: "召唤" },
  "btn.summoning": { en: "Summoning", zh: "召唤中" },

  // Tabs
  "tab.olympus": { en: "Olympus", zh: "奥林匹斯" },
  "tab.scrolls": { en: "Scrolls", zh: "卷轴" },

  // Stats
  "stat.openQuests": { en: "Open Quests", zh: "进行中任务" },
  "stat.dueToday": { en: "Due Today", zh: "今日截止" },
  "stat.completed": { en: "Completed", zh: "已完成" },
  "stat.overdue": { en: "Overdue", zh: "已逾期" },

  // Quest list
  "quests.heading": { en: "Quest Roll", zh: "任务清册" },
  "quests.filter.all": { en: "All", zh: "全部" },
  "quests.filter.today": { en: "Today", zh: "今日" },
  "quests.filter.upcoming": { en: "Upcoming", zh: "即将到来" },
  "quests.filter.completed": { en: "Completed", zh: "已完成" },
  "quests.empty": {
    en: "The roll lies empty. The Fates have nothing to hand you.",
    zh: "清册空荡。命运女神无任何卷轴可交予。",
  },
  "quests.due": { en: "Due", zh: "截止" },
  "quests.newQuest": { en: "New Quest", zh: "新任务" },
  "quests.cancel": { en: "Cancel", zh: "取消" },
  "quests.questPrompt": { en: "What is the quest?", zh: "这是什么任务？" },
  "quests.statusTodo": { en: "To Do", zh: "待办" },
  "quests.statusInProgress": { en: "In Progress", zh: "进行中" },
  "quests.statusDone": { en: "Completed", zh: "已完成" },
  "quests.category": { en: "— Category —", zh: "— 分类 —" },
  "quests.inscribe": { en: "Inscribe Quest", zh: "镌刻任务" },
  "quests.inscribing": { en: "Inscribing…", zh: "镌刻中…" },
  "quests.badge.todo": { en: "Todo", zh: "待办" },
  "quests.badge.inProgress": { en: "In Progress", zh: "进行中" },
  "quests.badge.done": { en: "Done", zh: "已完成" },
  "quests.badge.overdue": { en: "Overdue", zh: "已逾期" },

  // Calendar
  "cal.legend.overdue": { en: "Overdue", zh: "已逾期" },
  "cal.legend.active": { en: "Active", zh: "进行中" },
  "cal.legend.open": { en: "Open", zh: "待办" },
  "cal.legend.done": { en: "Done", zh: "已完成" },
  "cal.prevMonth": { en: "Previous month", zh: "上一月" },
  "cal.nextMonth": { en: "Next month", zh: "下一月" },

  // Scrolls
  "scroll.compose": { en: "Pen a Scroll", zh: "撰写卷轴" },
  "scroll.author": { en: "Who scribes this?", zh: "谁是抄写者？" },
  "scroll.message": { en: "What happened?", zh: "发生了什么？" },
  "scroll.questOptional": { en: "Quest (optional)", zh: "任务（可选）" },
  "scroll.noQuest": { en: "— No quest attached —", zh: "— 未附加任务 —" },
  "scroll.markProgress": { en: "Mark its progress (optional)", zh: "标记进度（可选）" },
  "scroll.noChange": { en: "— No change —", zh: "— 不改变 —" },
  "scroll.markTodo": { en: "Mark as Todo (new)", zh: "标记为待办（新）" },
  "scroll.links": { en: "Links", zh: "链接" },
  "scroll.linkPlaceholder": { en: "https://…", zh: "https://…" },
  "scroll.add": { en: "Add", zh: "添加" },
  "scroll.files": { en: "Files", zh: "文件" },
  "scroll.attachFile": { en: "Attach file", zh: "附加文件" },
  "scroll.seal": { en: "Seal & Post", zh: "封印并发布" },
  "scroll.sealing": { en: "Sealing…", zh: "封印中…" },
  "scroll.feedHeading": { en: "The Scrolls", zh: "卷轴录" },
  "scroll.feedCount": { en: "entries", zh: "条记录" },
  "scroll.feedEmpty": {
    en: "The scribes are silent. No scrolls yet.",
    zh: "抄写官沉默。尚无卷轴。",
  },
  "scroll.questChip": { en: "Quest", zh: "任务" },
  "scroll.showOlder": { en: "Show older scrolls", zh: "显示更早的卷轴" },
  "scroll.hideOlder": { en: "Hide older scrolls", zh: "隐藏更早的卷轴" },
  "scroll.olderCount": { en: "older", zh: "更早的" },
  "scroll.newQuestToggle": { en: "New Quest", zh: "新任务" },
  "scroll.createQuestHeading": { en: "Forge a New Quest", zh: "锻造新任务" },
  "scroll.createQuestSubmit": { en: "Create Quest", zh: "创建任务" },
  "scroll.creatingQuest": { en: "Creating…", zh: "创建中…" },
  "scroll.questCreated": { en: "Quest etched into Notion", zh: "任务已刻入 Notion" },

  // Toasts / errors
  "toast.synced": { en: "Olympus is in tune", zh: "奥林匹斯协调一致" },
  "toast.syncFailed": { en: "The line to Olympus is broken", zh: "奥林匹斯通讯中断" },
  "toast.scrollSealed": { en: "Scroll sealed", zh: "卷轴已封印" },
  "toast.noQuestsOnDay": { en: "No quests fall on this day", zh: "今日无任务" },
  "toast.updateFailed": { en: "Could not save change", zh: "无法保存变更" },
  "err.authorRequired": { en: "Tell us who you are first.", zh: "请先填写抄写者。" },
  "err.messageRequired": { en: "A scroll needs a message.", zh: "卷轴必须有内容。" },
  "err.linkProtocol": {
    en: "Links must start with http:// or https://",
    zh: "链接必须以 http:// 或 https:// 开头",
  },
  "err.postFailed": { en: "Could not post scroll", zh: "无法发布卷轴" },

  // Misc
  "lang.toggle": { en: "中文", zh: "EN" },
};

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
}

const LangContext = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("olympus.lang");
    if (saved === "en" || saved === "zh") setLangState(saved);
  }, []);

  // Persist + reflect on <html lang> for accessibility
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("olympus.lang", lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const t = useCallback((key: DictKey) => dict[key]?.[lang] ?? dict[key]?.en ?? key, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}

// Calendar weekday letters in each language
export const WEEKDAY_LETTERS: Record<Lang, string[]> = {
  en: ["S", "M", "T", "W", "T", "F", "S"],
  zh: ["日", "一", "二", "三", "四", "五", "六"],
};
