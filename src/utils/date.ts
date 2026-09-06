/* ============================================================
   日期工具：日 / 周 / 月 维度计算
   ============================================================ */

import type { DayStr, MonthStr } from "../types";

const pad = (n: number) => String(n).padStart(2, "0");

/** Date -> YYYY-MM-DD（本地时区） */
export function toDayStr(d: Date): DayStr {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Date -> YYYY-MM */
export function toMonthStr(d: Date): MonthStr {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** YYYY-MM-DD -> Date（本地零点） */
export function parseDay(s: DayStr): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function today(): DayStr {
  return toDayStr(new Date());
}

export function nowMs(): number {
  return Date.now();
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 今天 + offset 天 */
export function offsetDay(offset: number): DayStr {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toDayStr(d);
}

/** 某周的周一开始日期（周一为一周起点） */
export function mondayOf(day: DayStr): DayStr {
  const d = parseDay(day);
  const wd = (d.getDay() + 6) % 7; // 周一=0
  d.setDate(d.getDate() - wd);
  return toDayStr(d);
}

/** 周一为一周起点，dayOfWeek: 周一=0 ... 周日=6 */
export function dayIndexOfWeek(day: DayStr): number {
  return (parseDay(day).getDay() + 6) % 7;
}

/** 某周内第 i 天的日期（i: 0=周一） */
export function dayInWeek(monday: DayStr, i: number): DayStr {
  const d = parseDay(monday);
  d.setDate(d.getDate() + i);
  return toDayStr(d);
}

/** 返回 [monday, sunday] */
export function weekRange(day: DayStr): [DayStr, DayStr] {
  const m = mondayOf(day);
  return [m, dayInWeek(m, 6)];
}

/** 某月天数 */
export function daysInMonth(month: MonthStr): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** 某月第一天是周几（周一=0） */
export function firstWeekdayOfMonth(month: MonthStr): number {
  const [y, m] = month.split("-").map(Number);
  return (new Date(y, m - 1, 1).getDay() + 6) % 7;
}

/** 月份内第 d 天的日期字符串 */
export function dayInMonth(month: MonthStr, d: number): DayStr {
  return `${month}-${pad(d)}`;
}

/** 当前所在月份 */
export function currentMonth(): MonthStr {
  return toMonthStr(new Date());
}

/** 上一月 */
export function prevMonth(month: MonthStr): MonthStr {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return toMonthStr(d);
}

/** 下一月 */
export function nextMonth(month: MonthStr): MonthStr {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m, 1);
  return toMonthStr(d);
}

export interface DateRange {
  start: DayStr;
  end: DayStr;
}

/** 按 日/周/月 得到范围 */
export function rangeOf(period: "day" | "week" | "month", anchor: DayStr): DateRange {
  if (period === "day") return { start: anchor, end: anchor };
  if (period === "week") {
    const [s, e] = weekRange(anchor);
    return { start: s, end: e };
  }
  const month = anchor.slice(0, 7);
  return { start: `${month}-01`, end: `${month}-${pad(daysInMonth(month))}` };
}

/** 范围内天数（含首尾） */
export function rangeDays(r: DateRange): DayStr[] {
  const out: DayStr[] = [];
  const cur = parseDay(r.start);
  const end = parseDay(r.end);
  while (cur.getTime() <= end.getTime()) {
    out.push(toDayStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** 范围内第几天（含首日=0） */
export function dayIndexInRange(day: DayStr, r: DateRange): number {
  const a = parseDay(r.start).getTime();
  const b = parseDay(day).getTime();
  return Math.round((b - a) / 86400000);
}

/** 格式化显示：今天/昨天/前天/完整日期 */
export function friendlyDay(day: DayStr): string {
  const t = today();
  if (day === t) return "今天";
  if (day === offsetDay(-1)) return "昨天";
  if (day === offsetDay(-2)) return "前天";
  return day;
}

/** YYYY-MM-DD -> 8月12日 */
export function shortDay(day: DayStr): string {
  const [, m, d] = day.split("-").map(Number);
  return `${m}月${d}日`;
}

/** 8月12日 周三 */
export function shortDayWithWeek(day: DayStr): string {
  const wd = (parseDay(day).getDay() + 6) % 7;
  const names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  return `${shortDay(day)} ${names[wd]}`;
}

/** YYYY-MM -> 2026年8月 */
export function monthLabel(month: MonthStr): string {
  const [y, m] = month.split("-").map(Number);
  return `${y}年${m}月`;
}

export function dayLabel(day: DayStr): string {
  const [, m, d] = day.split("-").map(Number);
  return `${m}月${d}日`;
}

/** 比较：day 是否在 [start,end] */
export function inRange(day: DayStr, r: DateRange): boolean {
  return day >= r.start && day <= r.end;
}

/** HH:mm 时间格式化 */
export function nowTimeHM(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
