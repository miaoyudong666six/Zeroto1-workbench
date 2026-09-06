/* ============================================================
   通用待办：每日待办 + 每周固定任务
   状态流转：todo -> done / later，可一键延后到明天
   ============================================================ */

import { useMemo, useState } from "react";
import { useStore } from "../../store/StoreContext";
import { useI18n } from "../../i18n";
import { Modal, Field, Empty, Seg, ConfirmDialog } from "../../components/ui";
import { today, offsetDay, dayIndexOfWeek, rangeOf, inRange, friendlyDay } from "../../utils/date";
import type { TodoItem, TodoStatus } from "../../types";

type Period = "day" | "week" | "month";

function TodoForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: TodoItem | null }) {
  const { add, update } = useStore();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [weekly, setWeekly] = useState(initial?.weekly ?? false);
  const [day, setDay] = useState(initial?.day ?? today());
  const [weekday, setWeekday] = useState(initial?.weekday ?? dayIndexOfWeek(today()));
  const [note, setNote] = useState(initial?.note ?? "");

  const valid = title.trim();

  const submit = () => {
    const payload = {
      title: title.trim(),
      weekly,
      day: weekly ? undefined : day,
      weekday: weekly ? weekday : undefined,
      note: note.trim() || undefined,
    };
    if (initial) update("todos", initial.id, payload);
    else add("todos", { ...payload, status: "todo" as TodoStatus });
    onClose();
  };

  const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

  return (
    <Modal
      open={open}
      title={initial ? "编辑待办" : "新增待办"}
      onClose={onClose}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={!valid} onClick={submit}>保存</button>
        </>
      }
    >
      <Field label="待办内容" required>
        <input value={title} placeholder="如：完成 30 分钟有氧" onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="form-grid">
        <Field label="类型">
          <div className="seg" style={{ width: "100%" }}>
            <button className={!weekly ? "on" : ""} style={{ flex: 1 }} onClick={() => setWeekly(false)}>每日待办</button>
            <button className={weekly ? "on" : ""} style={{ flex: 1 }} onClick={() => setWeekly(true)}>每周固定</button>
          </div>
        </Field>
        {weekly ? (
          <Field label="固定星期">
            <div className="seg" style={{ width: "100%" }}>
              {weekdays.map((w, i) => (
                <button key={w} className={weekday === i ? "on" : ""} style={{ flex: 1, fontSize: 11, padding: "4px 6px" }} onClick={() => setWeekday(i)}>
                  {w}
                </button>
              ))}
            </div>
          </Field>
        ) : (
          <Field label="日期" required>
            <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
          </Field>
        )}
      </div>
      <Field label="备注">
        <input value={note} placeholder="可选" onChange={(e) => setNote(e.target.value)} />
      </Field>
    </Modal>
  );
}

const STATUS_LABEL: Record<TodoStatus, string> = { todo: "未完成", done: "已完成", later: "已延后" };

export default function Todo() {
  const { data, update, remove } = useStore();
  const { t } = useI18n();
  const [period, setPeriod] = useState<Period>("day");
  const [anchor, setAnchor] = useState(today());
  const [tab, setTab] = useState<"all" | "todo" | "done" | "later">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TodoItem | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const range = useMemo(() => rangeOf(period, anchor), [period, anchor]);

  // 当前视图下可见的待办
  const visible = useMemo(() => {
    const t = today();
    return data.todos.filter((td) => {
      if (td.weekly) {
        // 周/月视图：显示全部每周固定任务；日视图：仅显示当天对应星期的任务
        if (period === "week" || period === "month") return true;
        return td.weekday === dayIndexOfWeek(anchor);
      }
      return inRange(td.day ?? t, range);
    });
  }, [data.todos, period, anchor, range]);

  const filtered = visible.filter((td) => (tab === "all" ? true : td.status === tab));

  const counts = useMemo(() => {
    const c = { all: visible.length, todo: 0, done: 0, later: 0 };
    visible.forEach((td) => { c[td.status]++; });
    return c;
  }, [visible]);

  const setStatus = (id: string, status: TodoStatus) => update("todos", id, { status });

  /** 延后到明天 */
  const postpone = (id: string) => update("todos", id, { day: offsetDay(1), status: "later", updatedAt: Date.now() });

  const shift = (n: number) => {
    const d = new Date(anchor);
    if (period === "day") d.setDate(d.getDate() + n);
    else if (period === "week") d.setDate(d.getDate() + n * 7);
    else d.setMonth(d.getMonth() + n);
    setAnchor(d.toISOString().slice(0, 10));
  };

  const periodLabel =
    period === "day" ? friendlyDay(anchor) :
    period === "week" ? `${range.start.slice(5).replace("-", "/")} — ${range.end.slice(5).replace("-", "/")}` :
    `${anchor.slice(0, 4)} 年 ${Number(anchor.slice(5, 7))} 月`;

  const doneCount = counts.done;
  const total = counts.all;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">✅ {t.todo_title}</div>
          <div className="page-sub">{t.todo_sub}</div>
        </div>
        <div className="toolbar">
          <Seg<Period>
            options={[{ value: "day", label: t.period_day }, { value: "week", label: t.period_week }, { value: "month", label: t.period_month }]}
            value={period}
            onChange={setPeriod}
          />
          <div className="flex gap-1 items-center">
            <button className="btn btn-ghost btn-sm" onClick={() => shift(-1)}>‹</button>
            <span className="small bold" style={{ minWidth: 110, textAlign: "center" }}>{periodLabel}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => shift(1)}>›</button>
            <button className="btn btn-soft btn-sm" onClick={() => setAnchor(today())}>{t.today}</button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setFormOpen(true); }}>{t.todo_new}</button>
        </div>
      </div>

      <div className="stat-grid mb-2">
        <div className="stat">
          <div className="k">总待办</div>
          <div className="v">{total}<small>项</small></div>
          <div className="d">未完成 {counts.todo} · 延后 {counts.later}</div>
        </div>
        <div className="stat">
          <div className="k">已完成</div>
          <div className="v">{doneCount}<small>项</small></div>
          <div className="d">完成率 {total ? Math.round((doneCount / total) * 100) : 0}%</div>
        </div>
        <div className="stat" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="flex items-center gap-1" style={{ marginBottom: 6 }}>
            <span className="k">完成率</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="progress"><i style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} /></div>
            <span className="num bold" style={{ fontSize: 13 }}>{total ? Math.round((doneCount / total) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">📋 待办列表</span>
          <div className="flex gap-1">
            <Seg<"all" | "todo" | "done" | "later">
              options={[
                { value: "all", label: `全部 ${counts.all}` },
                { value: "todo", label: `未完成 ${counts.todo}` },
                { value: "done", label: `已完成 ${counts.done}` },
                { value: "later", label: `延后 ${counts.later}` },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <Empty icon="✅" text="该区间暂无待办，点击「＋ 新增待办」添加" />
        ) : (
          <div className="row-list">
            {filtered.map((td) => (
              <div key={td.id} className="row-item" style={{ alignItems: "center" }}>
                <button
                  className="btn btn-icon"
                  style={{
                    width: 24, height: 24, borderRadius: 6, border: `1.5px solid ${td.status === "done" ? "var(--a)" : "var(--line-strong)"}`,
                    background: td.status === "done" ? "var(--a-soft)" : "transparent", fontSize: 13, padding: 0, flexShrink: 0,
                  }}
                  onClick={() => setStatus(td.id, td.status === "done" ? "todo" : "done")}
                  title="切换完成状态"
                >
                  {td.status === "done" ? "✓" : ""}
                </button>
                <div className="row-main">
                  <div className={`row-title ${td.status === "done" ? "muted" : ""}`} style={td.status === "done" ? { textDecoration: "line-through" } : undefined}>
                    {td.title}
                  </div>
                  <div className="row-meta">
                    {td.weekly ? (
                      <span className="badge badge-a" style={{ marginRight: 6 }}>🔁 每周 · {["周一", "周二", "周三", "周四", "周五", "周六", "周日"][td.weekday ?? 0]}</span>
                    ) : (
                      <span className="badge" style={{ marginRight: 6 }}>📅 {td.day}</span>
                    )}
                    {td.note && <span>{td.note}</span>}
                  </div>
                </div>
                <div className="row-actions">
                  <span className={`badge ${td.status === "done" ? "badge-ok" : td.status === "later" ? "badge-warn" : ""}`}>
                    {STATUS_LABEL[td.status]}
                  </span>
                  {td.status !== "done" && !td.weekly && (
                    <button className="btn btn-soft btn-icon" onClick={() => postpone(td.id)} title="延后到明天">⏭ 延后</button>
                  )}
                  <button className="btn btn-ghost btn-icon" onClick={() => { setEditing(td); setFormOpen(true); }}>编辑</button>
                  <button className="btn btn-danger-ghost btn-icon" onClick={() => setConfirmId(td.id)}>删</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card mt-2">
        <div className="card-head">
          <span className="card-title">🗓️ 每周固定任务总览</span>
        </div>
        <div style={{ overflowX: "auto", padding: "8px 12px" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>任务</th>
                {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((d) => <th key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.todos.filter((td) => td.weekly).map((td) => (
                <tr key={td.id}>
                  <td className="bold">{td.title}</td>
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <td key={i} style={{ textAlign: "center" }}>
                      {td.weekday === i ? (td.status === "done" ? "✅" : "☐") : "·"}
                    </td>
                  ))}
                </tr>
              ))}
              {data.todos.filter((td) => td.weekly).length === 0 && (
                <tr><td colSpan={8} className="muted small" style={{ textAlign: "center" }}>暂无每周固定任务</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TodoForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
      <ConfirmDialog open={confirmId !== null} title="删除待办" message="删除后不可恢复，确认删除？" danger
        onCancel={() => setConfirmId(null)} onConfirm={() => { if (confirmId) remove("todos", confirmId); }} />
    </div>
  );
}
