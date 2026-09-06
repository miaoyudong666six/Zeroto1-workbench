/* ============================================================
   个人成长笔记：学习计划 + 技能提升任务，与月度挑战联动
   ============================================================ */

import { useMemo, useState } from "react";
import { useStore } from "../../store/StoreContext";
import { useI18n } from "../../i18n";
import { Modal, Field, Empty, Seg, ConfirmDialog } from "../../components/ui";
import type { GrowthNote, GrowthType } from "../../types";

type Filter = "全部" | GrowthType;
type StatusFilter = "全部" | "未开始" | "进行中" | "已完成";

function NoteForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: GrowthNote | null }) {
  const { data, add, update } = useStore();
  const [type, setType] = useState<GrowthType>(initial?.type ?? "学习计划");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [status, setStatus] = useState<GrowthNote["status"]>(initial?.status ?? "未开始");
  const [targetDay, setTargetDay] = useState(initial?.targetDay ?? "");
  const [linked, setLinked] = useState(initial?.linkedChallengeId ?? "");

  const valid = title.trim();

  const submit = () => {
    const payload = {
      type,
      title: title.trim(),
      content: content.trim(),
      status,
      targetDay: targetDay || undefined,
      linkedChallengeId: linked || undefined,
    };
    if (initial) update("growthNotes", initial.id, payload);
    else add("growthNotes", payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={initial ? "编辑笔记" : "新增成长笔记"}
      onClose={onClose}
      width={600}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={!valid} onClick={submit}>保存</button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="类型">
          <div className="seg" style={{ width: "100%" }}>
            <button className={type === "学习计划" ? "on" : ""} style={{ flex: 1 }} onClick={() => setType("学习计划")}>📖 学习计划</button>
            <button className={type === "技能任务" ? "on" : ""} style={{ flex: 1 }} onClick={() => setType("技能任务")}>🛠️ 技能任务</button>
          </div>
        </Field>
        <Field label="状态">
          <select value={status} onChange={(e) => setStatus(e.target.value as GrowthNote["status"])}>
            <option>未开始</option><option>进行中</option><option>已完成</option>
          </select>
        </Field>
      </div>
      <Field label="标题" required>
        <input value={title} placeholder="如：系统学习 React 源码" onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="详细内容">
        <textarea
          style={{ minHeight: 140 }}
          placeholder="计划步骤、学习资料、技能要点、预期产出……"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </Field>
      <div className="form-grid">
        <Field label="目标日期">
          <input type="date" value={targetDay} onChange={(e) => setTargetDay(e.target.value)} />
        </Field>
        <Field label="联动月度挑战" hint="可与月度挑战互通联动">
          <select value={linked} onChange={(e) => setLinked(e.target.value)}>
            <option value="">不关联</option>
            {data.challenges.map((c) => (
              <option key={c.id} value={c.id}>🎯 {c.title}（{c.month}）</option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

export default function Growth() {
  const { data, update, remove } = useStore();
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("全部");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("全部");
  const [keyword, setKeyword] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GrowthNote | null>(null);
  const [viewing, setViewing] = useState<GrowthNote | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const challengeMap = useMemo(() => {
    const m = new Map<string, { title: string; month: string }>();
    data.challenges.forEach((c) => m.set(c.id, { title: c.title, month: c.month }));
    return m;
  }, [data.challenges]);

  const filtered = useMemo(() => {
    return data.growthNotes
      .filter((n) => (filter === "全部" ? true : n.type === filter))
      .filter((n) => (statusFilter === "全部" ? true : n.status === statusFilter))
      .filter((n) =>
        keyword.trim() === "" || n.title.includes(keyword.trim()) || n.content.includes(keyword.trim())
      )
      .sort((a, b) => {
        const order = { "进行中": 0, "未开始": 1, "已完成": 2 } as const;
        return order[a.status] - order[b.status] || b.updatedAt - a.updatedAt;
      });
  }, [data.growthNotes, filter, statusFilter, keyword]);

  const counts = useMemo(() => {
    const c = { 全部: data.growthNotes.length, 学习计划: 0, 技能任务: 0 };
    data.growthNotes.forEach((n) => { c[n.type]++; });
    return c;
  }, [data.growthNotes]);

  const statusTone = (s: GrowthNote["status"]) =>
    s === "已完成" ? "badge-ok" : s === "进行中" ? "badge-b" : "";

  const setStatus = (id: string, status: GrowthNote["status"]) => update("growthNotes", id, { status });

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">🌱 {t.growth_title}</div>
          <div className="page-sub">{t.growth_sub}</div>
        </div>
        <button className="btn btn-blue btn-sm" onClick={() => { setEditing(null); setFormOpen(true); }}>{t.growth_new}</button>
      </div>

      <div className="flex gap-1 wrap mb-2">
        {(["全部", "学习计划", "技能任务"] as const).map((f) => (
          <button key={f} className={`btn btn-sm ${filter === f ? "btn-blue" : "btn-ghost"}`} onClick={() => setFilter(f)}>
            {f === "全部" ? "全部" : f === "学习计划" ? "📖 学习计划" : "🛠️ 技能任务"}
            <span className="xs" style={{ opacity: 0.75 }}> {counts[f]}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <Seg<StatusFilter>
          options={[
            { value: "全部", label: "全部" },
            { value: "进行中", label: "进行中" },
            { value: "未开始", label: "未开始" },
            { value: "已完成", label: "已完成" },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <input style={{ width: 180 }} placeholder="🔍 搜索" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <Empty icon="🌱" text="暂无成长笔记，点击「＋ 新增笔记」开始规划" />
        ) : (
          <div className="row-list">
            {filtered.map((n) => {
              const linked = n.linkedChallengeId ? challengeMap.get(n.linkedChallengeId) : null;
              return (
                <div key={n.id} className="row-item" style={{ cursor: "pointer" }} onClick={() => setViewing(n)}>
                  <div className="row-main">
                    <div className="flex items-center gap-1 wrap" style={{ marginBottom: 2 }}>
                      <span className={`badge ${n.type === "学习计划" ? "badge-b" : "badge-warn"}`}>
                        {n.type === "学习计划" ? "📖 学习计划" : "🛠️ 技能任务"}
                      </span>
                      <span className={`badge ${statusTone(n.status)}`}>{n.status}</span>
                      {linked && <span className="badge badge-a">🎯 联动 {linked.title}</span>}
                      {n.targetDay && <span className="xs muted">目标 {n.targetDay}</span>}
                    </div>
                    <div className="row-title" style={{ fontSize: 14 }}>{n.title}</div>
                    {n.content && <div className="small muted truncate" style={{ marginTop: 2 }}>{n.content}</div>}
                  </div>
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <div className="seg" style={{ transform: "scale(0.9)" }}>
                      {(["未开始", "进行中", "已完成"] as const).map((s) => (
                        <button key={s} className={n.status === s ? "on" : ""} style={{ fontSize: 10.5, padding: "3px 7px" }} onClick={() => setStatus(n.id, s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={() => { setEditing(n); setFormOpen(true); }}>编辑</button>
                    <button className="btn btn-danger-ghost btn-icon" onClick={() => setConfirmId(n.id)}>删</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={viewing !== null} title="笔记详情" onClose={() => setViewing(null)} width={620}
        foot={<button className="btn btn-primary" onClick={() => setViewing(null)}>关闭</button>}
      >
        {viewing && (
          <div>
            <div className="flex gap-1 wrap mb-2">
              <span className={`badge ${viewing.type === "学习计划" ? "badge-b" : "badge-warn"}`}>
                {viewing.type === "学习计划" ? "📖 学习计划" : "🛠️ 技能任务"}
              </span>
              <span className={`badge ${statusTone(viewing.status)}`}>{viewing.status}</span>
              {viewing.targetDay && <span className="badge">目标 {viewing.targetDay}</span>}
              {viewing.linkedChallengeId && challengeMap.get(viewing.linkedChallengeId) && (
                <span className="badge badge-a">🎯 联动挑战</span>
              )}
            </div>
            <div className="bold" style={{ fontSize: 15, marginBottom: 10 }}>{viewing.title}</div>
            {viewing.content ? (
              <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.8, background: "var(--surface-2)", borderRadius: 8, padding: 14, color: "var(--ink-2)" }}>
                {viewing.content}
              </div>
            ) : (
              <div className="muted small">暂无详细内容</div>
            )}
          </div>
        )}
      </Modal>

      <NoteForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
      <ConfirmDialog open={confirmId !== null} title="删除笔记" message="删除后不可恢复，确认删除该笔记？" danger
        onCancel={() => setConfirmId(null)} onConfirm={() => { if (confirmId) remove("growthNotes", confirmId); }} />
    </div>
  );
}
