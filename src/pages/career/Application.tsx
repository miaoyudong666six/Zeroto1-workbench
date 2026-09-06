/* ============================================================
   求职投递复盘记录表：投递、笔试、面试全过程、复盘、Offer 对比
   ============================================================ */

import { useMemo, useState } from "react";
import { useStore } from "../../store/StoreContext";
import { useI18n } from "../../i18n";
import { Modal, Field, Empty, Seg, ConfirmDialog } from "../../components/ui";
import { today, rangeOf, inRange, shortDay } from "../../utils/date";
import type { Application, ApplyStage, InterviewSession } from "../../types";

const STAGES: ApplyStage[] = ["已投递", "笔试", "面试", "Offer", "结束"];

interface SessionDraft {
  day: string;
  mode: "线上" | "线下";
  round: string;
  questions: string;
  weakness: string;
}

const emptySession = (): SessionDraft => ({ day: today(), mode: "线上", round: "一面", questions: "", weakness: "" });

function AppForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: Application | null }) {
  const { add, update } = useStore();
  const [company, setCompany] = useState(initial?.company ?? "");
  const [position, setPosition] = useState(initial?.position ?? "");
  const [applyDay, setApplyDay] = useState(initial?.applyDay ?? today());
  const [channel, setChannel] = useState(initial?.channel ?? "");
  const [stage, setStage] = useState<ApplyStage>(initial?.stage ?? "已投递");
  const [written, setWritten] = useState(initial?.written ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [offerNote, setOfferNote] = useState(initial?.offerNote ?? "");
  const [sessions, setSessions] = useState<SessionDraft[]>(
    initial?.interviews.map((s) => ({ day: s.day, mode: s.mode, round: s.round, questions: s.questions, weakness: s.weakness })) ?? []
  );

  const setS = (i: number, patch: Partial<SessionDraft>) =>
    setSessions((l) => l.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const valid = company.trim() && position.trim();

  const submit = () => {
    const interviews: InterviewSession[] = sessions.map((s) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      day: s.day,
      mode: s.mode,
      round: s.round.trim() || "面试",
      questions: s.questions.trim(),
      weakness: s.weakness.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    const payload = {
      company: company.trim(),
      position: position.trim(),
      applyDay,
      channel: channel.trim() || undefined,
      stage,
      written: written.trim() || undefined,
      interviews,
      summary: summary.trim(),
      offerNote: offerNote.trim() || undefined,
    };
    if (initial) update("applications", initial.id, payload);
    else add("applications", payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={initial ? "编辑投递记录" : "新增投递记录"}
      onClose={onClose}
      width={680}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={!valid} onClick={submit}>保存</button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="公司名称" required>
          <input value={company} placeholder="公司" onChange={(e) => setCompany(e.target.value)} />
        </Field>
        <Field label="投递岗位" required>
          <input value={position} placeholder="岗位" onChange={(e) => setPosition(e.target.value)} />
        </Field>
        <Field label="投递时间" required>
          <input type="date" value={applyDay} onChange={(e) => setApplyDay(e.target.value)} />
        </Field>
        <Field label="投递渠道">
          <input value={channel} placeholder="如：官网 / 内推 / 招聘平台" onChange={(e) => setChannel(e.target.value)} />
        </Field>
      </div>
      <Field label="当前阶段">
        <div className="seg" style={{ width: "100%" }}>
          {STAGES.map((s) => (
            <button key={s} className={stage === s ? "on" : ""} style={{ flex: 1 }} onClick={() => setStage(s)}>{s}</button>
          ))}
        </div>
      </Field>
      <Field label="笔试详情">
        <textarea placeholder="笔试内容、题目类型、通过情况" value={written} onChange={(e) => setWritten(e.target.value)} />
      </Field>

      <div className="section-divider">面试过程记录（可多条）</div>
      {sessions.map((s, i) => (
        <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 10, marginBottom: 10 }}>
          <div className="form-grid">
            <Field label="面试日期">
              <input type="date" value={s.day} onChange={(e) => setS(i, { day: e.target.value })} />
            </Field>
            <Field label="面试形式">
              <div className="seg" style={{ width: "100%" }}>
                <button className={s.mode === "线上" ? "on" : ""} style={{ flex: 1 }} onClick={() => setS(i, { mode: "线上" })}>线上</button>
                <button className={s.mode === "线下" ? "on" : ""} style={{ flex: 1 }} onClick={() => setS(i, { mode: "线下" })}>线下</button>
              </div>
            </Field>
            <Field label="轮次">
              <input value={s.round} placeholder="如：一面 / 二面" onChange={(e) => setS(i, { round: e.target.value })} />
            </Field>
            <Field label=" ">
              <button className="btn btn-danger-ghost" style={{ alignSelf: "flex-end" }}
                onClick={() => setSessions((l) => l.filter((_, idx) => idx !== i))}>✕ 移除</button>
            </Field>
          </div>
          <Field label="面试官提问">
            <textarea placeholder="记录面试官的问题" value={s.questions} onChange={(e) => setS(i, { questions: e.target.value })} />
          </Field>
          <Field label="自身答题短板">
            <textarea placeholder="哪些没答好、如何改进" value={s.weakness} onChange={(e) => setS(i, { weakness: e.target.value })} />
          </Field>
        </div>
      ))}
      <button className="btn btn-soft btn-sm" onClick={() => setSessions((l) => [...l, emptySession()])}>＋ 添加面试记录</button>

      <div className="section-divider">复盘与 Offer</div>
      <Field label="复盘总结">
        <textarea placeholder="整体复盘：表现、经验、下一步改进" value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      <Field label="Offer 对比备注">
        <textarea placeholder="薪资、福利、发展空间、与其他 offer 对比" value={offerNote} onChange={(e) => setOfferNote(e.target.value)} />
      </Field>
    </Modal>
  );
}

export default function Application() {
  const { data, remove } = useStore();
  const { t } = useI18n();
  const [period, setPeriod] = useState<"all" | "day" | "week" | "month">("all");
  const [anchor, setAnchor] = useState(today());
  const [stageFilter, setStageFilter] = useState<ApplyStage | "全部">("全部");
  const [keyword, setKeyword] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [viewing, setViewing] = useState<Application | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const range = useMemo(() => {
    if (period === "all") return null;
    return rangeOf(period, anchor);
  }, [period, anchor]);

  const filtered = useMemo(() => {
    return data.applications
      .filter((a) => (stageFilter === "全部" ? true : a.stage === stageFilter))
      .filter((a) => (range ? inRange(a.applyDay, range) : true))
      .filter((a) =>
        keyword.trim() === "" ||
        a.company.includes(keyword.trim()) ||
        a.position.includes(keyword.trim())
      )
      .sort((a, b) => b.applyDay.localeCompare(a.applyDay));
  }, [data.applications, stageFilter, range, keyword]);

  const stageCount = useMemo(() => {
    const c: Record<string, number> = { 全部: data.applications.length };
    STAGES.forEach((s) => { c[s] = data.applications.filter((a) => a.stage === s).length; });
    return c;
  }, [data.applications]);

  const stageTone = (s: ApplyStage) =>
    s === "Offer" ? "badge-ok" : s === "面试" ? "badge-b" : s === "结束" ? "" : "badge-warn";

  const shift = (n: number) => {
    if (period === "all") return;
    const d = new Date(anchor);
    if (period === "day") d.setDate(d.getDate() + n);
    else if (period === "week") d.setDate(d.getDate() + n * 7);
    else d.setMonth(d.getMonth() + n);
    setAnchor(d.toISOString().slice(0, 10));
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">📮 {t.app_title}</div>
          <div className="page-sub">{t.app_sub}</div>
        </div>
        <div className="toolbar">
          <Seg<"all" | "day" | "week" | "month">
            options={[{ value: "all", label: t.period_all }, { value: "day", label: t.period_day }, { value: "week", label: t.period_week }, { value: "month", label: t.period_month }]}
            value={period}
            onChange={setPeriod}
          />
          {period !== "all" && (
            <div className="flex gap-1 items-center">
              <button className="btn btn-ghost btn-sm" onClick={() => shift(-1)}>‹</button>
              <span className="small bold" style={{ minWidth: 100, textAlign: "center" }}>
                {range ? `${range.start}${range.start !== range.end ? ` ~ ${range.end}` : ""}` : ""}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => shift(1)}>›</button>
            </div>
          )}
          <button className="btn btn-blue btn-sm" onClick={() => { setEditing(null); setFormOpen(true); }}>{t.app_new}</button>
        </div>
      </div>

      <div className="flex gap-1 wrap mb-2">
        {(["全部", ...STAGES] as const).map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${stageFilter === s ? "btn-blue" : "btn-ghost"}`}
            onClick={() => setStageFilter(s)}
          >
            {s} <span className="xs" style={{ opacity: 0.75 }}>{stageCount[s] ?? 0}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input
          style={{ width: 200 }}
          placeholder="🔍 搜索公司或岗位"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <Empty icon="📮" text="暂无投递记录，点击「＋ 新增投递」开始记录" />
        ) : (
          <div className="row-list">
            {filtered.map((a) => (
              <div key={a.id} className="row-item" style={{ cursor: "pointer" }} onClick={() => setViewing(a)}>
                <div className="row-main">
                  <div className="flex items-center gap-1 wrap" style={{ marginBottom: 2 }}>
                    <span className="bold" style={{ fontSize: 14 }}>{a.company}</span>
                    <span className="badge">{a.position}</span>
                    <span className={`badge ${stageTone(a.stage)}`}>{a.stage}</span>
                    {a.channel && <span className="xs muted">via {a.channel}</span>}
                  </div>
                  <div className="row-meta">
                    投递于 {a.applyDay}
                    {a.interviews.length > 0 && <span> · 面试 {a.interviews.length} 轮</span>}
                    {a.summary && <span> · 💡 {a.summary.length > 40 ? a.summary.slice(0, 40) + "…" : a.summary}</span>}
                  </div>
                </div>
                <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-icon" onClick={() => { setEditing(a); setFormOpen(true); }}>编辑</button>
                  <button className="btn btn-danger-ghost btn-icon" onClick={() => setConfirmId(a.id)}>删</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 详情 */}
      <Modal open={viewing !== null} title="投递详情" onClose={() => setViewing(null)} width={680}
        foot={<button className="btn btn-primary" onClick={() => setViewing(null)}>关闭</button>}
      >
        {viewing && (
          <div>
            <div className="flex gap-1 wrap mb-1">
              <span className="badge badge-b">{viewing.company}</span>
              <span className="badge">{viewing.position}</span>
              <span className={`badge ${stageTone(viewing.stage)}`}>{viewing.stage}</span>
              <span className="badge">投递 {viewing.applyDay}</span>
              {viewing.channel && <span className="badge">via {viewing.channel}</span>}
            </div>

            {viewing.written && (
              <>
                <div className="section-divider">✍️ 笔试详情</div>
                <div className="small" style={{ whiteSpace: "pre-wrap", color: "var(--ink-2)" }}>{viewing.written}</div>
              </>
            )}

            <div className="section-divider">🎙️ 面试过程（{viewing.interviews.length} 轮）</div>
            {viewing.interviews.length === 0 ? (
              <div className="muted small">暂无面试记录</div>
            ) : (
              viewing.interviews.map((s, i) => (
                <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div className="flex gap-1 items-center mb-1">
                    <span className="badge badge-b">{s.round || `第 ${i + 1} 轮`}</span>
                    <span className="badge">{s.mode}</span>
                    <span className="xs muted num">{shortDay(s.day)}</span>
                  </div>
                  <div className="small" style={{ marginBottom: 4 }}>
                    <b>面试官提问：</b>
                    <span style={{ color: "var(--ink-2)" }}>{s.questions || "—"}</span>
                  </div>
                  <div className="small">
                    <b style={{ color: "var(--danger)" }}>答题短板：</b>
                    <span style={{ color: "var(--ink-2)" }}>{s.weakness || "—"}</span>
                  </div>
                </div>
              ))
            )}

            {viewing.summary && (
              <>
                <div className="section-divider">💡 复盘总结</div>
                <div className="small" style={{ whiteSpace: "pre-wrap", background: "var(--surface-2)", borderRadius: 8, padding: 12, color: "var(--ink-2)" }}>
                  {viewing.summary}
                </div>
              </>
            )}
            {viewing.offerNote && (
              <>
                <div className="section-divider">🏅 Offer 对比备注</div>
                <div className="small" style={{ whiteSpace: "pre-wrap", background: "var(--a-soft)", borderRadius: 8, padding: 12, color: "var(--a-strong)" }}>
                  {viewing.offerNote}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <AppForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
      <ConfirmDialog open={confirmId !== null} title="删除投递记录" message="删除后不可恢复，确认删除该投递记录？" danger
        onCancel={() => setConfirmId(null)} onConfirm={() => { if (confirmId) remove("applications", confirmId); }} />
    </div>
  );
}
