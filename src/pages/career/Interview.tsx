/* ============================================================
   面试问答知识库：分类收纳 + 自定义标签 + 随时新增查阅
   ============================================================ */

import { useMemo, useState } from "react";
import { useStore } from "../../store/StoreContext";
import { useI18n } from "../../i18n";
import { Modal, Field, Empty, ConfirmDialog } from "../../components/ui";
import { QA_CATEGORIES, type InterviewQA, type QACategory } from "../../types";

function QAForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: InterviewQA | null }) {
  const { add, update } = useStore();
  const [category, setCategory] = useState<QACategory>(initial?.category ?? "HR常规提问");
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [tags, setTags] = useState(initial?.tags.join(" ") ?? "");

  const valid = question.trim();

  const submit = () => {
    const tagList = tags.split(/[\s,，、]+/).map((s) => s.trim()).filter(Boolean);
    const payload = { category, question: question.trim(), answer: answer.trim() || undefined, tags: tagList };
    if (initial) update("interviewQAs", initial.id, payload);
    else add("interviewQAs", payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={initial ? "编辑题目" : "新增面试题"}
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
        <Field label="分类" required>
          <select value={category} onChange={(e) => setCategory(e.target.value as QACategory)}>
            {QA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="自定义标签" hint="用空格分隔，如：自我介绍 项目难点">
          <input value={tags} placeholder="标签（可选）" onChange={(e) => setTags(e.target.value)} />
        </Field>
      </div>
      <Field label="问题" required>
        <textarea value={question} placeholder="面试题或问题描述" onChange={(e) => setQuestion(e.target.value)} />
      </Field>
      <Field label="参考答案 / 模板">
        <textarea
          style={{ minHeight: 160 }}
          placeholder="参考回答、答题思路或模板"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </Field>
    </Modal>
  );
}

export default function Interview() {
  const { data, remove } = useStore();
  const { t } = useI18n();
  const [category, setCategory] = useState<QACategory | "全部">("全部");
  const [keyword, setKeyword] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InterviewQA | null>(null);
  const [viewing, setViewing] = useState<InterviewQA | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    data.interviewQAs.forEach((q) => q.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [data.interviewQAs]);

  const filtered = useMemo(() => {
    return data.interviewQAs
      .filter((q) => (category === "全部" ? true : q.category === category))
      .filter((q) => (tagFilter ? q.tags.includes(tagFilter) : true))
      .filter((q) =>
        keyword.trim() === "" ||
        q.question.includes(keyword.trim()) ||
        (q.answer ?? "").includes(keyword.trim())
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [data.interviewQAs, category, tagFilter, keyword]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { 全部: data.interviewQAs.length };
    QA_CATEGORIES.forEach((cat) => {
      c[cat] = data.interviewQAs.filter((q) => q.category === cat).length;
    });
    return c;
  }, [data.interviewQAs]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">💬 {t.interview_title}</div>
          <div className="page-sub">{t.interview_sub}</div>
        </div>
        <button className="btn btn-blue btn-sm" onClick={() => { setEditing(null); setFormOpen(true); }}>{t.interview_new}</button>
      </div>

      {/* 分类导航 */}
      <div className="flex gap-1 wrap mb-2">
        {(["全部", ...QA_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            className={`btn btn-sm ${category === c ? "btn-blue" : "btn-ghost"}`}
            onClick={() => setCategory(c)}
          >
            {c} <span className="xs" style={{ opacity: 0.75 }}>{counts[c] ?? 0}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input
          style={{ width: 200 }}
          placeholder="🔍 搜索问题或答案"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <div className="flex gap-1 wrap mb-2">
          <button
            className={`tag clickable ${tagFilter === null ? "" : ""}`}
            style={tagFilter === null ? { background: "var(--b-soft)", borderColor: "var(--b-line)", color: "var(--b-strong)" } : {}}
            onClick={() => setTagFilter(null)}
          >
            全部标签
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              className="tag clickable"
              style={tagFilter === t ? { background: "var(--b-soft)", borderColor: "var(--b-line)", color: "var(--b-strong)" } : {}}
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <div className="card">
        {filtered.length === 0 ? (
          <Empty icon="💬" text="没有匹配的题目，点击「＋ 新增题目」充实题库" />
        ) : (
          <div className="row-list">
            {filtered.map((q) => (
              <div key={q.id} className="row-item" style={{ cursor: "pointer" }} onClick={() => setViewing(q)}>
                <div className="row-main">
                  <div className="flex items-center gap-1" style={{ marginBottom: 2 }}>
                    <span className="badge badge-b">{q.category}</span>
                    {q.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
                  </div>
                  <div className="row-title" style={{ fontSize: 13.5 }}>{q.question}</div>
                  {q.answer && (
                    <div className="small muted truncate" style={{ marginTop: 2, maxWidth: "100%" }}>
                      {q.answer}
                    </div>
                  )}
                </div>
                <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-icon" onClick={() => { setEditing(q); setFormOpen(true); }}>编辑</button>
                  <button className="btn btn-danger-ghost btn-icon" onClick={() => setConfirmId(q.id)}>删</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 查看详情 */}
      <Modal open={viewing !== null} title="题目详情" onClose={() => setViewing(null)} width={620}
        foot={<button className="btn btn-primary" onClick={() => setViewing(null)}>关闭</button>}
      >
        {viewing && (
          <div>
            <div className="flex gap-1 wrap mb-2">
              <span className="badge badge-b">{viewing.category}</span>
              {viewing.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
            </div>
            <div className="bold" style={{ fontSize: 14, marginBottom: 10 }}>{viewing.question}</div>
            {viewing.answer ? (
              <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.8, background: "var(--surface-2)", borderRadius: 8, padding: 14, color: "var(--ink-2)" }}>
                {viewing.answer}
              </div>
            ) : (
              <div className="muted small">暂无参考答案</div>
            )}
          </div>
        )}
      </Modal>

      <QAForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
      <ConfirmDialog open={confirmId !== null} title="删除题目" message="删除后不可恢复，确认删除该题？" danger
        onCancel={() => setConfirmId(null)} onConfirm={() => { if (confirmId) remove("interviewQAs", confirmId); }} />
    </div>
  );
}
