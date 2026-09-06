/* ============================================================
   页面路由表（轻量 state 路由，无额外依赖）
   ============================================================ */

export type PageKey =
  | "dashboard"
  | "training"
  | "diet"
  | "body"
  | "todo"
  | "challenge"
  | "resume"
  | "interview"
  | "application"
  | "growth";

export interface NavEntry {
  key: PageKey;
  label: string;
  icon: string;
}

export const NAV_A: NavEntry[] = [
  { key: "training", label: "健身计划", icon: "🏋️" },
  { key: "diet", label: "饮食日志", icon: "🥗" },
  { key: "body", label: "身体数据", icon: "⚖️" },
  { key: "todo", label: "通用待办", icon: "✅" },
  { key: "challenge", label: "月度挑战", icon: "🎯" },
];

export const NAV_B: NavEntry[] = [
  { key: "resume", label: "简历档案", icon: "📄" },
  { key: "interview", label: "面试问答库", icon: "💬" },
  { key: "application", label: "投递复盘", icon: "📮" },
  { key: "growth", label: "成长笔记", icon: "🌱" },
];

export const ALL_NAV: NavEntry[] = [...NAV_A, ...NAV_B];
