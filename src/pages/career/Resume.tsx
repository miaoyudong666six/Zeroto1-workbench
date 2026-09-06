/* ============================================================
   简历档案：多版本简历存储 + 岗位修改方向备注
   ============================================================ */

import { useMemo, useState } from "react";
import { useStore } from "../../store/StoreContext";
import { useI18n } from "../../i18n";
import { Modal, Field, Empty, ConfirmDialog } from "../../components/ui";
import type { Resume, PositionNote } from "../../types";

function ResumeForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: Resume | null }) {
  const { add, update } = useStore();
  const [name, setName] = useState(initial?.name ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  const valid = name.trim() && content.trim();

  const submit = () => {
    const payload = { name: name.trim(), content: content.trim() };
    if (initial) update("resumes", initial.id, payload);
    else add("resumes", { ...payload, positionNotes: [] });
    onClose();
  };

  return (
    <Modal
      open={open}
      title={initial ? "编辑简历" : "新增简历版本"}
      onClose={onClose}
      width={640}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={!valid} onClick={submit}>保存</button>
        </>
      }
    >
      <Field label="版本名称" required hint="如：2026-04 通用版 / 前端岗定制版">
        <input value={name} placeholder="版本名称" onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="简历内容" required hint="粘贴简历全文，支持多行">
        <textarea
          style={{ minHeight: 240, fontFamily: "var(--font-sans)", fontSize: 13 }}
          placeholder={"教育背景\n工作经历\n项目经历\n技能清单"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </Field>
    </Modal>
  );
}

function NoteForm({ open, onClose, resume, initial }: {
  open: boolean; onClose: () => void; resume: Resume | null; initial: PositionNote | null;
}) {
  const { update } = useStore();
  const [position, setPosition] = useState(initial?.position ?? "");
  const [note, setNote] = useState(initial?.note ?? "");

  const valid = position.trim() && note.trim();

  const submit = () => {
    if (!resume) return;
    const item: PositionNote = {
      id: initial?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      position: position.trim(),
      note: note.trim(),
      createdAt: initial?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    const list = initial
      ? resume.positionNotes.map((p) => (p.id === initial.id ? item : p))
      : [...resume.positionNotes, item];
    update("resumes", resume.id, { positionNotes: list });
    onClose();
  };

  return (
    <Modal
      open={open}
      title={initial ? "编辑岗位备注" : "新增岗位备注"}
      onClose={onClose}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={!valid} onClick={submit}>保存</button>
        </>
      }
    >
      <Field label="目标岗位" required>
        <input value={position} placeholder="如：前端工程师" onChange={(e) => setPosition(e.target.value)} />
      </Field>
      <Field label="简历修改方向" required hint="针对该岗位应调整的重点">
        <textarea value={note} placeholder="如：突出项目 A，弱化实习 B，增加量化数据" onChange={(e) => setNote(e.target.value)} />
      </Field>
    </Modal>
  );
}

export default function Resume() {
  const { data, remove, update } = useStore();
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Resume | null>(null);
  const [viewing, setViewing] = useState<Resume | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteResume, setNoteResume] = useState<Resume | null>(null);
  const [noteEditing, setNoteEditing] = useState<PositionNote | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmNote, setConfirmNote] = useState<{ resumeId: string; noteId: string } | null>(null);

  const resumes = useMemo(() => [...data.resumes].sort((a, b) => b.updatedAt - a.updatedAt), [data.resumes]);

  const removeNote = () => {
    if (!confirmNote) return;
    const r = data.resumes.find((x) => x.id === confirmNote.resumeId);
    if (r) {
      update("resumes", r.id, { positionNotes: r.positionNotes.filter((p) => p.id !== confirmNote.noteId) });
    }
    setConfirmNote(null);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">📄 {t.resume_title}</div>
          <div className="page-sub">{t.resume_sub}</div>
        </div>
        <button className="btn btn-blue btn-sm" onClick={() => { setEditing(null); setFormOpen(true); }}>{t.resume_new}</button>
      </div>

      {resumes.length === 0 ? (
        <div className="card"><Empty icon="📄" text="还没有简历，点击「＋ 新增简历版本」开始存放" /></div>
      ) : (
        <div className="dash-grid">
          {resumes.map((r) => (
            <section key={r.id} className="card">
              <div className="card-head">
                <span className="card-title">📄 {r.name}</span>
                <div className="row-actions">
                  <button className="btn btn-ghost btn-icon" onClick={() => setViewing(r)}>查看</button>
                  <button className="btn btn-ghost btn-icon" onClick={() => { setEditing(r); setFormOpen(true); }}>编辑</button>
                  <button className="btn btn-danger-ghost btn-icon" onClick={() => setConfirmId(r.id)}>删</button>
                </div>
              </div>
              <div style={{ padding: "12px 16px" }}>
                <div className="xs muted mb-1">内容预览</div>
                <div
                  className="small"
                  style={{ whiteSpace: "pre-wrap", maxHeight: 150, overflow: "hidden", color: "var(--ink-2)", WebkitLineClamp: 6, display: "-webkit-box", WebkitBoxOrient: "vertical" }}
                >
                  {r.content}
                </div>
                <div className="section-divider" style={{ margin: "14px 0 10px" }}>岗位修改方向</div>
                {r.positionNotes.length === 0 ? (
                  <div className="muted small" style={{ padding: "4px 0 8px" }}>暂无岗位备注</div>
                ) : (
                  <div>
                    {r.positionNotes.map((p) => (
                      <div key={p.id} className="small" style={{ padding: "6px 8px", background: "var(--b-soft)", borderRadius: 6, marginBottom: 6 }}>
                        <div className="flex between items-center">
                          <b style={{ color: "var(--b-strong)" }}>🎯 {p.position}</b>
                          <span className="flex gap-1">
                            <button className="btn btn-icon" style={{ fontSize: 11, color: "var(--b-strong)" }}
                              onClick={() => { setNoteResume(r); setNoteEditing(p); setNoteOpen(true); }}>编辑</button>
                            <button className="btn btn-icon" style={{ fontSize: 11, color: "var(--danger)" }}
                              onClick={() => setConfirmNote({ resumeId: r.id, noteId: p.id })}>删</button>
                          </span>
                        </div>
                        <div className="muted" style={{ marginTop: 2 }}>{p.note}</div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className="btn btn-soft btn-sm"
                  onClick={() => { setNoteResume(r); setNoteEditing(null); setNoteOpen(true); }}
                >
                  ＋ 添加岗位备注
                </button>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* 查看简历 */}
      <Modal open={viewing !== null} title={viewing?.name ?? "简历"} onClose={() => setViewing(null)} width={700}
        foot={<button className="btn btn-primary" onClick={() => setViewing(null)}>关闭</button>}
      >
        {viewing && (
          <div>
            <div className="flex gap-1 mb-1 wrap">
              <span className="badge badge-b">版本：{viewing.name}</span>
              {viewing.positionNotes.length > 0 && (
                <span className="badge">岗位备注 {viewing.positionNotes.length} 条</span>
              )}
            </div>
            <div style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.8, maxHeight: 480, overflowY: "auto", background: "var(--surface-2)", borderRadius: 8, padding: 16 }}>
              {viewing.content}
            </div>
            {viewing.positionNotes.length > 0 && (
              <>
                <div className="section-divider">岗位修改方向</div>
                {viewing.positionNotes.map((p) => (
                  <div key={p.id} className="small" style={{ padding: "6px 8px", background: "var(--b-soft)", borderRadius: 6, marginBottom: 6 }}>
                    <b style={{ color: "var(--b-strong)" }}>🎯 {p.position}</b>
                    <div className="muted">{p.note}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>

      <ResumeForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
      <NoteForm open={noteOpen} onClose={() => setNoteOpen(false)} resume={noteResume} initial={noteEditing} />
      <ConfirmDialog open={confirmId !== null} title="删除简历" message="删除后不可恢复，确认删除该简历版本？" danger
        onCancel={() => setConfirmId(null)} onConfirm={() => { if (confirmId) remove("resumes", confirmId); }} />
      <ConfirmDialog open={confirmNote !== null} title="删除岗位备注" message="确认删除这条岗位修改方向备注？" danger
        onCancel={() => setConfirmNote(null)} onConfirm={removeNote} />
    </div>
  );
}
