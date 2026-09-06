/* ============================================================
   健身计划：每日训练记录 + 每周固定训练方案
   ============================================================ */

import { useMemo, useState } from "react";
import { useStore } from "../../store/StoreContext";
import { useI18n } from "../../i18n";
import { Modal, Field, Empty, Seg, ConfirmDialog } from "../../components/ui";
import {
  today, shortDayWithWeek, dayIndexOfWeek, rangeOf, inRange,
} from "../../utils/date";
import { MUSCLE_OPTIONS, WEEKDAY_SHORT, WEEKDAY_NAMES, type Exercise, type TrainingRecord, type WeeklyPlan } from "../../types";

type Period = "day" | "week" | "month";

interface ExerciseDraft {
  name: string;
  muscle: string;
  sets: number;
  reps: number;
  weightKg: number | "";
}

const emptyExercise = (): ExerciseDraft => ({ name: "", muscle: "", sets: 3, reps: 12, weightKg: "" });

function TrainingForm({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: TrainingRecord | null;
}) {
  const { add, update } = useStore();
  const [day, setDay] = useState(initial?.day ?? today());
  const [duration, setDuration] = useState(initial?.durationMin ?? 30);
  const [feeling, setFeeling] = useState(initial?.feeling ?? "");
  const [exercises, setExercises] = useState<ExerciseDraft[]>(
    initial?.exercises.map((e) => ({ ...e, weightKg: e.weightKg ?? "" })) ?? [emptyExercise()]
  );

  const setEx = (i: number, patch: Partial<ExerciseDraft>) =>
    setExercises((list) => list.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  const valid = exercises.some((e) => e.name.trim());

  const submit = () => {
    const exs: Exercise[] = exercises
      .filter((e) => e.name.trim())
      .map((e) => ({
        name: e.name.trim(),
        muscle: e.muscle.trim() || "其他",
        sets: Number(e.sets) || 0,
        reps: Number(e.reps) || 0,
        weightKg: e.weightKg === "" ? undefined : Number(e.weightKg),
      }));
    const payload = { day, durationMin: Number(duration) || 0, exercises: exs, feeling: feeling.trim() || undefined };
    if (initial) update("trainings", initial.id, payload);
    else add("trainings", payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={initial ? "编辑训练记录" : "新增训练记录"}
      onClose={onClose}
      width={620}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={!valid} onClick={submit}>保存</button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="训练日期" required>
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </Field>
        <Field label="运动时长（分钟）">
          <input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </Field>
      </div>

      <div className="section-divider">训练项目</div>
      {exercises.map((ex, i) => (
        <div key={i} className="form-grid" style={{ marginBottom: 10 }}>
          <Field label={`项目 ${i + 1}`} required>
            <input
              placeholder="如：杠铃卧推"
              value={ex.name}
              onChange={(e) => setEx(i, { name: e.target.value })}
            />
          </Field>
          <Field label="训练部位">
            <select value={ex.muscle} onChange={(e) => setEx(i, { muscle: e.target.value })}>
              <option value="">选择部位</option>
              {MUSCLE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="组数">
            <input type="number" min={1} value={ex.sets} onChange={(e) => setEx(i, { sets: Number(e.target.value) })} />
          </Field>
          <Field label="次数">
            <input type="number" min={1} value={ex.reps} onChange={(e) => setEx(i, { reps: Number(e.target.value) })} />
          </Field>
          <Field label="负重（kg，自重留空）">
            <input
              type="number" min={0} step={0.5}
              value={ex.weightKg}
              placeholder="自重"
              onChange={(e) => setEx(i, { weightKg: e.target.value === "" ? "" : Number(e.target.value) })}
            />
          </Field>
          <Field label=" ">
            <button
              className="btn btn-danger-ghost"
              style={{ alignSelf: "flex-end" }}
              onClick={() => setExercises((l) => l.filter((_, idx) => idx !== i))}
            >
              ✕ 移除
            </button>
          </Field>
        </div>
      ))}
      <button className="btn btn-soft btn-sm" onClick={() => setExercises((l) => [...l, emptyExercise()])}>
        ＋ 添加训练项目
      </button>

      <div className="section-divider">运动感受</div>
      <Field label="感受与备注">
        <textarea
          placeholder="如：状态不错 / 力竭组差 2 个 / 下次加重 2.5kg"
          value={feeling}
          onChange={(e) => setFeeling(e.target.value)}
        />
      </Field>
    </Modal>
  );
}

function WeeklyPlanForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: WeeklyPlan | null }) {
  const { add, update } = useStore();
  const [name, setName] = useState(initial?.name ?? "");
  const [schedule, setSchedule] = useState<Record<number, string>>(
    initial?.schedule ?? { 1: "胸 + 三头", 3: "背 + 二头", 5: "腿 + 肩" }
  );

  const valid = name.trim();

  const submit = () => {
    const clean: Record<number, string> = {};
    Object.entries(schedule).forEach(([k, v]) => {
      if (v.trim()) clean[Number(k)] = v.trim();
    });
    if (initial) update("weeklyPlans", initial.id, { name: name.trim(), schedule: clean });
    else add("weeklyPlans", { name: name.trim(), schedule: clean });
    onClose();
  };

  return (
    <Modal
      open={open}
      title={initial ? "编辑周训练方案" : "新建周训练方案"}
      onClose={onClose}
      width={520}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={!valid} onClick={submit}>保存</button>
        </>
      }
    >
      <Field label="方案名称" required hint="如：增肌一周四练 / 减脂力量计划">
        <input value={name} placeholder="方案名称" onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="section-divider">每天训练安排（留空 = 休息）</div>
      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
        <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ width: 44, fontSize: 12.5, fontWeight: 600, flexShrink: 0, color: "var(--ink-2)" }}>
            {WEEKDAY_NAMES[d]}
          </span>
          <input
            placeholder="休息或训练安排"
            value={schedule[d] ?? ""}
            onChange={(e) => setSchedule((s) => ({ ...s, [d]: e.target.value }))}
          />
        </div>
      ))}
    </Modal>
  );
}

export default function Training() {
  const { data, remove, mutate } = useStore();
  const { t } = useI18n();
  const [period, setPeriod] = useState<Period>("week");
  const [anchor, setAnchor] = useState(today());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingRecord | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [planEditing, setPlanEditing] = useState<WeeklyPlan | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmPlanId, setConfirmPlanId] = useState<string | null>(null);

  const range = useMemo(() => rangeOf(period, anchor), [period, anchor]);
  const records = useMemo(
    () => data.trainings.filter((r) => inRange(r.day, range)).sort((a, b) => b.day.localeCompare(a.day)),
    [data.trainings, range]
  );
  const wd = dayIndexOfWeek(anchor);
  const todayRec = data.trainings.find((r) => r.day === today());

  const shift = (n: number) => {
    const d = new Date(anchor);
    if (period === "day") d.setDate(d.getDate() + n);
    else if (period === "week") d.setDate(d.getDate() + n * 7);
    else d.setMonth(d.getMonth() + n);
    setAnchor(d.toISOString().slice(0, 10));
  };

  const applyPlan = (plan: WeeklyPlan) => {
    const t = today();
    const content = plan.schedule[wd];
    const exs: Exercise[] = [];
    const parts = content ? content.split(/[、,，;；/]/).map((s) => s.trim()).filter(Boolean) : [];
    parts.forEach((p) => {
      const muscle = MUSCLE_OPTIONS.find((m) => p.includes(m));
      exs.push({ name: p, muscle: muscle ?? "全身", sets: 3, reps: 12 });
    });
    mutate("trainings", (list) => {
      const exists = list.find((r) => r.day === t);
      const base = {
        day: t,
        durationMin: 40,
        exercises: exs,
        feeling: `今日套用周方案「${plan.name}」`,
        id: exists ? exists.id : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: exists?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      return exists ? list.map((r) => (r.day === t ? base : r)) : [base, ...list];
    });
  };

  const periodLabel =
    period === "day" ? shortDayWithWeek(anchor) :
    period === "week"
      ? `${range.start.slice(5).replace("-", "/")} — ${range.end.slice(5).replace("-", "/")}`
      : `${anchor.slice(0, 4)} 年 ${Number(anchor.slice(5, 7))} 月`;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">🏋️ {t.training_title}</div>
          <div className="page-sub">{t.training_sub}</div>
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
          <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            {t.training_new}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setPlanEditing(null); setPlanOpen(true); }}>
            {t.training_week_plan}
          </button>
        </div>
      </div>

      <div className="stat-grid mb-2">
        <div className="stat">
          <div className="k">{t.training_period_count}</div>
          <div className="v">{records.length}<small>{t.training_times}</small></div>
          <div className="d">{t.training_projects(records.reduce((s, r) => s + r.exercises.length, 0))}</div>
        </div>
        <div className="stat">
          <div className="k">累计时长</div>
          <div className="v">{records.reduce((s, r) => s + r.durationMin, 0)}<small>分</small></div>
          <div className="d">平均 {(records.reduce((s, r) => s + r.durationMin, 0) / Math.max(records.length, 1)).toFixed(0)} 分/次</div>
        </div>
        <div className="stat">
          <div className="k">本周安排（今天 {WEEKDAY_SHORT[wd]}）</div>
          <div className="v" style={{ fontSize: 13, lineHeight: 1.7, fontWeight: 600 }}>
            {data.weeklyPlans.map((p) => p.schedule[wd]).filter(Boolean).join(" / ") || "—"}
          </div>
          <div className="d">今日可一键套用</div>
        </div>
      </div>

      {/* 每周方案 */}
      <div className="card mb-2">
        <div className="card-head">
          <span className="card-title">🗓️ 每周训练方案</span>
          <div className="flex gap-1">
            {data.weeklyPlans.map((p) => (
              <button key={p.id} className="btn btn-soft btn-sm" onClick={() => applyPlan(p)}>
                ⚡ 套用「{p.name}」到今日
              </button>
            ))}
            {data.weeklyPlans.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setPlanEditing(data.weeklyPlans[0]); setPlanOpen(true); }}>
                编辑
              </button>
            )}
          </div>
        </div>
        {data.weeklyPlans.length === 0 ? (
          <Empty icon="🗓️" text="还没有周训练方案，点击「＋ 周方案」创建" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>方案</th>
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => <th key={d}>{WEEKDAY_SHORT[d]}</th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.weeklyPlans.map((p) => (
                  <tr key={p.id}>
                    <td className="bold">{p.name}</td>
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                      <td key={d} style={{ fontSize: 12 }}>
                        {p.schedule[d] || <span className="muted">—</span>}
                      </td>
                    ))}
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-icon" onClick={() => { setPlanEditing(p); setPlanOpen(true); }}>编辑</button>
                        <button className="btn btn-danger-ghost btn-icon" onClick={() => setConfirmPlanId(p.id)}>删</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 训练记录列表 */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">📋 训练记录（{period === "day" ? "日" : period === "week" ? "周" : "月"}）</span>
          {todayRec && (
            <button className="btn btn-soft btn-sm" onClick={() => { setEditing(todayRec); setFormOpen(true); }}>
              编辑今日记录
            </button>
          )}
        </div>
        {records.length === 0 ? (
          <Empty icon="💪" text="该区间暂无训练记录，点击右上角「＋ 新增训练」开始记录" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>日期</th><th>项目</th><th>时长</th><th>感受</th><th></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="num">{r.day === today() ? "今天" : r.day}</td>
                    <td style={{ minWidth: 220 }}>
                      {r.exercises.map((e, i) => (
                        <div key={i} className="small" style={{ marginBottom: 2 }}>
                          <b>{e.name}</b>
                          <span className="muted"> · {e.muscle}</span>
                          <span className="num"> · {e.sets}×{e.reps}</span>
                          {e.weightKg != null && <span className="num muted"> · {e.weightKg}kg</span>}
                        </div>
                      ))}
                    </td>
                    <td className="num">{r.durationMin} 分</td>
                    <td className="small muted" style={{ maxWidth: 180 }}>{r.feeling || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-icon" onClick={() => { setEditing(r); setFormOpen(true); }}>编辑</button>
                        <button className="btn btn-danger-ghost btn-icon" onClick={() => setConfirmId(r.id)}>删</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TrainingForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
      <WeeklyPlanForm open={planOpen} onClose={() => setPlanOpen(false)} initial={planEditing} />
      <ConfirmDialog
        open={confirmId !== null}
        title="删除训练记录"
        message="删除后不可恢复，确认删除这条训练记录？"
        danger
        onCancel={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId) remove("trainings", confirmId); }}
      />
      <ConfirmDialog
        open={confirmPlanId !== null}
        title="删除周方案"
        message="删除后不可恢复，确认删除这个周训练方案？"
        danger
        onCancel={() => setConfirmPlanId(null)}
        onConfirm={() => { if (confirmPlanId) remove("weeklyPlans", confirmPlanId); }}
      />
    </div>
  );
}
