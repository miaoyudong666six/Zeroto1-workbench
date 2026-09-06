/* ============================================================
   月度挑战：创建目标挑战 + 每日打卡 + 进度 + 心得体会
   ============================================================ */

import { useMemo, useState } from "react";
import { useStore } from "../../store/StoreContext";
import { useI18n } from "../../i18n";
import { Modal, Field, Empty, ConfirmDialog } from "../../components/ui";
import {
  today, currentMonth, prevMonth, nextMonth, monthLabel, daysInMonth, firstWeekdayOfMonth, dayInMonth,
  shortDay,
} from "../../utils/date";
import type { Challenge } from "../../types";

function ChallengeForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: Challenge | null }) {
  const { add, update } = useStore();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [month, setMonth] = useState(initial?.month ?? currentMonth());
  const [rules, setRules] = useState(initial?.rules ?? "");
  const [progress, setProgress] = useState<number | "">(initial?.progress ?? 0);

  const valid = title.trim();

  const submit = () => {
    const payload = {
      title: title.trim(),
      month,
      rules: rules.trim() || "无",
      progress: Math.min(100, Math.max(0, Number(progress) || 0)),
    };
    if (initial) update("challenges", initial.id, payload);
    else add("challenges", { ...payload, checkins: {}, reflections: [] });
    onClose();
  };

  return (
    <Modal
      open={open}
      title={initial ? "编辑挑战" : "创建月度挑战"}
      onClose={onClose}
      width={520}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={!valid} onClick={submit}>保存</button>
        </>
      }
    >
      <Field label="挑战名称" required hint="如：本月减重 2kg / 每天阅读 30 分钟">
        <input value={title} placeholder="挑战名称" onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="form-grid">
        <Field label="目标月份" required>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </Field>
        <Field label="当前进度（%）">
          <input type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(e.target.value === "" ? "" : Number(e.target.value))} />
        </Field>
      </div>
      <Field label="挑战细则" hint="具体标准、奖惩、完成定义等">
        <textarea value={rules} placeholder="挑战细则" onChange={(e) => setRules(e.target.value)} />
      </Field>
    </Modal>
  );
}

function ReflectionForm({ open, onClose, challenge, day }: {
  open: boolean; onClose: () => void; challenge: Challenge | null; day: string | null;
}) {
  const { update } = useStore();
  const [text, setText] = useState("");
  const [day2, setDay2] = useState(day ?? today());

  const valid = text.trim() && day2;

  const submit = () => {
    if (!challenge) return;
    const reflection = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      day: day2,
      text: text.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    update("challenges", challenge.id, { reflections: [...challenge.reflections, reflection] });
    setText("");
    onClose();
  };

  return (
    <Modal
      open={open}
      title="记录心得体会"
      onClose={onClose}
      width={520}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={!valid} onClick={submit}>保存心得</button>
        </>
      }
    >
      <Field label="日期" required>
        <input type="date" value={day2} onChange={(e) => setDay2(e.target.value)} />
      </Field>
      <Field label="心得内容" required>
        <textarea placeholder="今天的感受、进展、困难……" value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
    </Modal>
  );
}

export default function Challenge() {
  const { data, update, remove } = useStore();
  const { t } = useI18n();
  const [month, setMonth] = useState(currentMonth());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Challenge | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [reflectOpen, setReflectOpen] = useState(false);
  const [reflectChallenge, setReflectChallenge] = useState<Challenge | null>(null);
  const [reflectDay, setReflectDay] = useState<string | null>(null);

  const challenges = data.challenges.filter((c) => c.month === month);
  const todayStr = today();

  const toggleCheckin = (c: Challenge, day: string) => {
    const next = { ...c.checkins, [day]: !c.checkins[day] };
    update("challenges", c.id, { checkins: next });
  };

  const calCells = useMemo(() => {
    const dim = daysInMonth(month);
    const first = firstWeekdayOfMonth(month);
    return Array.from({ length: first + dim }, (_, i) => {
      const d = i - first + 1;
      return d >= 1 ? dayInMonth(month, d) : null;
    });
  }, [month]);

  const isFuture = (day: string) => day > todayStr;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">🎯 {t.challenge_title}</div>
          <div className="page-sub">{t.challenge_sub}</div>
        </div>
        <div className="toolbar">
          <div className="flex gap-1 items-center">
            <button className="btn btn-ghost btn-sm" onClick={() => setMonth(prevMonth(month))}>‹</button>
            <span className="small bold" style={{ minWidth: 90, textAlign: "center" }}>{monthLabel(month)}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setMonth(nextMonth(month))}>›</button>
            <button className="btn btn-soft btn-sm" onClick={() => setMonth(currentMonth())}>本月</button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setFormOpen(true); }}>{t.challenge_new}</button>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="card">
          <Empty icon="🏁" text={`${monthLabel(month)}还没有挑战，点击「＋ 创建挑战」设定目标`} />
        </div>
      ) : (
        <div className="dash-grid">
          {challenges.map((c) => {
            const dim = daysInMonth(month);
            const done = Object.values(c.checkins).filter(Boolean).length;
            const pct = Math.round((done / dim) * 100);
            const displayProgress = Math.max(c.progress, pct);
            return (
              <section key={c.id} className="card" style={{ padding: 0 }}>
                <div className="card-head">
                  <span className="card-title">🏁 {c.title}</span>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-icon" onClick={() => { setEditing(c); setFormOpen(true); }}>编辑</button>
                    <button className="btn btn-danger-ghost btn-icon" onClick={() => setConfirmId(c.id)}>删</button>
                  </div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div className="flex between items-center mb-1">
                    <span className="xs muted">打卡 {done}/{dim} 天</span>
                    <span className="num bold" style={{ color: "var(--a-strong)" }}>{displayProgress}%</span>
                  </div>
                  <div className="progress mb-2"><i style={{ width: `${displayProgress}%` }} /></div>
                  <div className="small muted" style={{ whiteSpace: "pre-wrap", marginBottom: 10 }}>{c.rules}</div>

                  <div className="cal-grid">
                    {calCells.map((day, i) =>
                      day === null ? <div key={`e${i}`} /> : (
                        <button
                          key={day}
                          className={`cal-cell ${c.checkins[day] ? "checked" : ""} ${day === todayStr ? "today" : ""} ${day < todayStr && !c.checkins[day] ? "past-empty" : ""} ${isFuture(day) ? "" : ""}`}
                          onClick={() => toggleCheckin(c, day)}
                          disabled={isFuture(day)}
                          title={`${shortDay(day)}${c.checkins[day] ? " · 已打卡" : " · 未打卡"}`}
                        >
                          <span className="day">{day.slice(8)}</span>
                        </button>
                      )
                    )}
                  </div>

                  <div className="section-divider" style={{ marginTop: 16 }}>💭 心得体会</div>
                  {c.reflections.length === 0 ? (
                    <div className="muted small" style={{ padding: "6px 0" }}>暂无心得</div>
                  ) : (
                    <div style={{ maxHeight: 180, overflowY: "auto" }}>
                      {[...c.reflections].reverse().map((r) => (
                        <div key={r.id} className="small" style={{ padding: "6px 0", borderBottom: "1px dashed var(--line)" }}>
                          <span className="xs muted num">{shortDay(r.day)}</span>　{r.text}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className="btn btn-soft btn-sm mt-1"
                    onClick={() => { setReflectChallenge(c); setReflectDay(todayStr); setReflectOpen(true); }}
                  >
                    ✍️ 写心得
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <ChallengeForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
      <ReflectionForm open={reflectOpen} onClose={() => setReflectOpen(false)} challenge={reflectChallenge} day={reflectDay} />
      <ConfirmDialog open={confirmId !== null} title="删除挑战" message="删除后挑战及打卡记录不可恢复，确认删除？" danger
        onCancel={() => setConfirmId(null)} onConfirm={() => { if (confirmId) remove("challenges", confirmId); }} />
    </div>
  );
}
