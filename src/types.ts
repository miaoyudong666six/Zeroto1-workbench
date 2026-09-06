/* ============================================================
   全局数据类型定义
   ============================================================ */

export type ID = string;

export interface Base {
  id: ID;
  createdAt: number;
  updatedAt: number;
  /** 通用备注 */
  note?: string;
}

/* ---------------- 日期工具 ---------------- */

/** YYYY-MM-DD */
export type DayStr = string;
/** YYYY-MM */
export type MonthStr = string;

/* ---------------- A 板块 · 健身 ---------------- */

export interface Exercise {
  /** 训练项目，如 深蹲 */
  name: string;
  /** 训练部位，如 腿 / 胸 / 背 */
  muscle: string;
  /** 组数 */
  sets: number;
  /** 次数 */
  reps: number;
  /** 负重 kg，可空（自重） */
  weightKg?: number;
}

export interface TrainingRecord extends Base {
  day: DayStr;
  /** 运动时长（分钟） */
  durationMin: number;
  exercises: Exercise[];
  /** 运动感受 */
  feeling?: string;
}

export interface WeeklyPlan extends Base {
  name: string;
  /** dayOfWeek 0-6 -> 训练安排文字，0=周日 */
  schedule: Record<number, string>;
}

/* ---------------- A 板块 · 饮食 ---------------- */

export type MealType = "早餐" | "午餐" | "晚餐" | "加餐";

export interface FoodItem {
  name: string;
  /** 大概热量 kcal */
  kcal?: number;
  /** 分量描述，如 1碗 / 150g */
  qty?: string;
}

export interface Meal extends Base {
  day: DayStr;
  type: MealType;
  /** 进食时间 HH:mm */
  time?: string;
  foods: FoodItem[];
}

export interface WaterRecord extends Base {
  day: DayStr;
  /** 毫升 */
  ml: number;
  time?: string;
}

/* ---------------- A 板块 · 身体数据 ---------------- */

export interface BodyMetric extends Base {
  day: DayStr;
  weightKg?: number;
  bodyFatPct?: number;
  sleepHours?: number;
  /** 身体状态备注 */
  status?: string;
}

/* ---------------- A 板块 · 待办 ---------------- */

export type TodoStatus = "todo" | "done" | "later";

export interface TodoItem extends Base {
  title: string;
  /** 每日待办：目标日期；每周固定任务：为空并用 weekday 表示 */
  day?: DayStr;
  /** 每周固定任务的星期几 0-6 */
  weekday?: number;
  /** 是否每周固定任务 */
  weekly: boolean;
  status: TodoStatus;
}

/* ---------------- A 板块 · 月度挑战 ---------------- */

export interface Challenge extends Base {
  title: string;
  /** 目标月份 YYYY-MM */
  month: MonthStr;
  /** 挑战细则 */
  rules: string;
  /** date -> 是否打卡 */
  checkins: Record<DayStr, boolean>;
  /** 完成进度（0-100，手动调整） */
  progress: number;
  /** 心得体会（追加记录） */
  reflections: Reflection[];
}

export interface Reflection extends Base {
  day: DayStr;
  text: string;
}

/* ---------------- B 板块 · 简历档案 ---------------- */

export interface Resume extends Base {
  /** 版本名，如 2026-04 通用版 */
  name: string;
  /** 简历内容（纯文本，按需换行） */
  content: string;
  /** 不同岗位对应的修改方向备注 */
  positionNotes: PositionNote[];
}

export interface PositionNote extends Base {
  /** 目标岗位，如 前端工程师 */
  position: string;
  note: string;
}

/* ---------------- B 板块 · 面试问答知识库 ---------------- */

export type QACategory =
  | "行测问题"
  | "HR常规提问"
  | "专业岗位面试"
  | "自我回答模板";

export interface InterviewQA extends Base {
  category: QACategory;
  question: string;
  answer?: string;
  /** 自定义标签 */
  tags: string[];
}

/* ---------------- B 板块 · 求职投递复盘 ---------------- */

export type ApplyStage = "已投递" | "笔试" | "面试" | "Offer" | "结束";

export interface InterviewSession extends Base {
  day: DayStr;
  mode: "线上" | "线下";
  /** 第几轮 */
  round: string;
  /** 面试官提问 */
  questions: string;
  /** 自身答题短板 */
  weakness: string;
}

export interface Application extends Base {
  company: string;
  position: string;
  applyDay: DayStr;
  /** 投递渠道 */
  channel?: string;
  stage: ApplyStage;
  /** 笔试详情 */
  written?: string;
  /** 面试过程记录 */
  interviews: InterviewSession[];
  /** 复盘总结 */
  summary: string;
  /** Offer 对比备注 */
  offerNote?: string;
}

/* ---------------- B 板块 · 个人成长笔记 ---------------- */

export type GrowthType = "学习计划" | "技能任务";

export interface GrowthNote extends Base {
  type: GrowthType;
  title: string;
  content: string;
  status: "未开始" | "进行中" | "已完成";
  targetDay?: DayStr;
  /** 关联的月度挑战 id（互通联动） */
  linkedChallengeId?: string;
}

/* ---------------- 根 Store ---------------- */

export interface AppData {
  version: number;
  trainings: TrainingRecord[];
  weeklyPlans: WeeklyPlan[];
  meals: Meal[];
  waters: WaterRecord[];
  bodyMetrics: BodyMetric[];
  todos: TodoItem[];
  challenges: Challenge[];
  resumes: Resume[];
  interviewQAs: InterviewQA[];
  applications: Application[];
  growthNotes: GrowthNote[];
}

export const STORE_VERSION = 1;

export function emptyData(): AppData {
  return {
    version: STORE_VERSION,
    trainings: [],
    weeklyPlans: [],
    meals: [],
    waters: [],
    bodyMetrics: [],
    todos: [],
    challenges: [],
    resumes: [],
    interviewQAs: [],
    applications: [],
    growthNotes: [],
  };
}

/* ---------------- 常量 ---------------- */

export const MUSCLE_OPTIONS = [
  "胸", "背", "腿", "肩", "手臂", "核心", "有氧", "全身", "其他",
];

export const MEAL_TYPES: MealType[] = ["早餐", "午餐", "晚餐", "加餐"];

export const QA_CATEGORIES: QACategory[] = [
  "行测问题",
  "HR常规提问",
  "专业岗位面试",
  "自我回答模板",
];

export const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
export const WEEKDAY_SHORT = ["日", "一", "二", "三", "四", "五", "六"];
